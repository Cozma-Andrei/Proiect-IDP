#!/bin/bash

# Culori pentru output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}CareLog Microservices Setup${NC}"

# 1. Verificare .env
if [ ! -f .env ]; then
    echo "Fisierul .env nu exista. Cream unul din .env.example..."
    cp .env.example .env
    echo "ATENTIE: Te rugam sa completezi datele AWS/Mail in fisierul .env inainte de a continua."
    exit 1
fi

# 2. Initializare Docker Swarm (Manager pe 192.168.100.1)
echo -e "${GREEN}Initializare Docker Swarm (Manager pe 192.168.100.1)...${NC}"
# Fortam un restart curat daca Swarm-ul este deja pornit pentru a aplica noile setari de retea
if [ "$(docker info --format '{{.Swarm.LocalNodeState}}')" == "active" ]; then
    echo "Swarm activ deja. Resetam..."
    docker stack rm carelog 2>/dev/null
    sleep 5
    docker swarm leave --force 2>/dev/null
fi
docker swarm init --advertise-addr 192.168.100.1 --data-path-addr 192.168.100.1

# 3. Creare retea de simulare
echo -e "${GREEN}Creare retea de simulare (192.168.100.0/24)...${NC}"
docker network rm swarm-sim-net 2>/dev/null || true
docker network create --driver bridge --subnet=192.168.100.0/24 swarm-sim-net

# 4. Simulare cluster multi-nod
echo -e "${GREEN}Simulare workeri suplimentari (DinD)...${NC}"

# Stergem containerele existente
docker rm -f worker-1 worker-2 2>/dev/null || true

# Pornim workerii in reteaua de simulare cu IP-uri fixe
docker run -d --privileged --name worker-1 --hostname worker-1 --network swarm-sim-net --ip 192.168.100.11 docker:dind
docker run -d --privileged --name worker-2 --hostname worker-2 --network swarm-sim-net --ip 192.168.100.12 docker:dind

TOKEN=$(docker swarm join-token worker -q)

echo "Asteptam pornirea daemon-ului Docker in workeri..."
for worker in worker-1 worker-2; do
    echo -n "  $worker: "
    for i in $(seq 1 30); do
        if docker exec "$worker" docker info > /dev/null 2>&1; then
            echo "ready"
            break
        fi
        echo -n "."
        sleep 2
    done
done

ADDR_1="192.168.100.11"
ADDR_2="192.168.100.12"
docker exec worker-1 docker swarm join --token "$TOKEN" --advertise-addr "$ADDR_1" 192.168.100.1:2377 || echo "WARN: worker-1 join failed"
docker exec worker-2 docker swarm join --token "$TOKEN" --advertise-addr "$ADDR_2" 192.168.100.1:2377 || echo "WARN: worker-2 join failed"

# 5. Oprire stack existent
echo -e "\n${GREEN}Curatare stack anterior...${NC}"
docker stack rm carelog 2>/dev/null
sleep 10

# 6. Initializare secrete
echo -e "${GREEN}Initializare secrete securizate...${NC}"
chmod +x init_secrets.sh
./init_secrets.sh

# 7. Build imagini
echo -e "${GREEN}Construire imagini microservicii...${NC}"
docker-compose -p carelog build

# 8. Sincronizare imagini catre workeri
echo -e "${GREEN}Sincronizare imagini catre worker-1 si worker-2...${NC}"
IMAGES=(
    "cozmaandrei/carelog-frontend:latest"
    "cozmaandrei/carelog-auth-service:latest"
    "cozmaandrei/carelog-medical-service:latest"
    "cozmaandrei/carelog-records-service:latest"
    "cozmaandrei/carelog-io-service:latest"
)

for img in "${IMAGES[@]}"; do
    echo "Trimitere $img catre noduri..."
    docker save "$img" | docker exec -i worker-1 docker load > /dev/null &
    docker save "$img" | docker exec -i worker-2 docker load > /dev/null &
    wait
done

# 9. Deploy stack
echo -e "${GREEN}Lansare stack in Swarm...${NC}"
export CONFIG_VERSION=$(date +%s)
docker stack deploy -c docker-compose.yml carelog

# 10. Asteptare servicii
echo -e "${GREEN}Asteptare stabilizare servicii (30s)...${NC}"
sleep 30

# 11. Rulare seeder
echo -e "${GREEN}Populare baza de date...${NC}"
NODE_NAME=$(docker service ps carelog_records-service --format "{{.Node}}" --filter "desired-state=running" | head -n1 | tr -d '\r\n[:space:]')
MANAGER_HOSTNAME=$(hostname | tr -d '\r\n[:space:]')

if [ -z "$NODE_NAME" ]; then
    echo "Eroare: Nu s-a gasit niciun container records-service activ."
    exit 1
fi

echo "Records Service se afla pe nodul: $NODE_NAME."

MAX_RETRIES=10
RETRY_COUNT=0
CONTAINER_ID=""

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if [ "$NODE_NAME" == "$MANAGER_HOSTNAME" ]; then
        CONTAINER_ID=$(docker ps -q -f name=carelog_records-service | head -n1)
    else
        CONTAINER_ID=$(docker exec "$NODE_NAME" docker ps -q -f name=carelog_records-service | head -n1)
    fi

    if [ -n "$CONTAINER_ID" ]; then
        break
    fi

    echo "Asteptam containerul pe $NODE_NAME (incercarea $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ -z "$CONTAINER_ID" ]; then
    echo "Eroare: Nu s-a putut gasi ID-ul containerului pe nodul $NODE_NAME."
    exit 1
fi

if [ "$NODE_NAME" == "$MANAGER_HOSTNAME" ]; then
    docker exec -it "$CONTAINER_ID" npm run seed
else
    echo "Rulare prin tunel pe $NODE_NAME..."
    docker exec -it "$NODE_NAME" docker exec -it "$CONTAINER_ID" npm run seed
fi

echo -e "${BLUE}Setup finalizat cu succes:${NC}"
echo "Frontend: http://localhost:3000"
echo "Portainer:  http://localhost:9000"
echo "Grafana:    http://localhost:3001 (admin/admin)"
echo "Prometheus: http://localhost:9090"
echo -e "\nDistributie servicii pe noduri:"
docker stack ps carelog
