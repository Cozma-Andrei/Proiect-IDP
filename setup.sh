#!/bin/bash

# Culori pentru output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}CareLog Microservices Setup${NC}"

# 1. Verificare .env
if [ ! -f .env ]; then
    echo "Fisierul .env nu exista. Creez unul din .env.example..."
    cp .env.example .env
    echo "ATENTIE: Te rugam sa completezi datele AWS/Mail in fisierul .env inainte de a continua!"
    exit 1
fi

# 2. Creare Retea de Simulare
echo -e "${GREEN}Creare retea de simulare (172.18.0.0/16)...${NC}"
docker network create --subnet=172.18.0.0/16 swarm-sim-net 2>/dev/null || true

# 3. Initializare Docker Swarm (Manager)
echo -e "${GREEN}Initializare Docker Swarm (Manager pe 172.18.0.1)...${NC}"
# Fortam un restart curat daca Swarm-ul este deja pornit pentru a aplica noile setari de retea
if [ "$(docker info --format '{{.Swarm.LocalNodeState}}')" == "active" ]; then
    echo "Swarm-ul este deja activ. Resetam pentru a aplica noile adrese de date..."
    docker swarm leave --force 2>/dev/null
fi
docker swarm init --advertise-addr 172.18.0.1 --data-path-addr 172.18.0.1 2>/dev/null

# 4. Simulare Cluster Multi-Nod
echo -e "${GREEN}Simulare Workeri Suplimentari (DinD)...${NC}"

# Stergem containerele existente
docker rm -f worker-1 worker-2 2>/dev/null

# Pornim workerii in reteaua de simulare cu IP-uri fixe
docker run -d --privileged --name worker-1 --hostname worker-1 --network swarm-sim-net --ip 172.18.0.11 docker:dind
docker run -d --privileged --name worker-2 --hostname worker-2 --network swarm-sim-net --ip 172.18.0.12 docker:dind

TOKEN=$(docker swarm join-token worker -q)

echo "Asteptam pornirea engine-ului Docker pe workeri..."
sleep 10
docker exec worker-1 docker swarm join --token $TOKEN --advertise-addr 172.18.0.11 172.18.0.1:2377 2>/dev/null
docker exec worker-2 docker swarm join --token $TOKEN --advertise-addr 172.18.0.12 172.18.0.1:2377 2>/dev/null

echo -e "\n${BLUE}Stare Cluster Docker Swarm${NC}"
docker node ls

# 5. Oprire Stack existent
echo -e "\n${GREEN}Curatare stack anterior...${NC}"
docker stack rm carelog 2>/dev/null
sleep 10

# 6. Initializare Secrete
echo -e "${GREEN}Initializare Secrete Securizate...${NC}"
chmod +x init_secrets.sh
./init_secrets.sh

# 7. Build imagini
echo -e "${GREEN}Construire imagini microservicii...${NC}"
docker-compose -p carelog build

# 8. Sincronizare Imagini catre Workeri
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

# 9. Deploy Stack
echo -e "${GREEN}Lansare Stack in Swarm (carelog)...${NC}"
export CONFIG_VERSION=$(date +%s)
docker stack deploy -c docker-compose.yml carelog

# 10. Asteptare servicii
echo -e "${GREEN}Asteptare stabilizare servicii (30s)...${NC}"
sleep 30

# 11. Rulare Seeder
echo -e "${GREEN}Populare baza de date (Seeder)...${NC}"
NODE_NAME=$(docker service ps carelog_records-service --format "{{.Node}}" --filter "desired-state=running" | head -n1)
MANAGER_HOSTNAME=$(hostname)

if [ -z "$NODE_NAME" ]; then
    echo "Eroare: Nu s-a gasit niciun container records-service activ."
elif [ "$NODE_NAME" == "$MANAGER_HOSTNAME" ]; then
    CONTAINER_ID=$(docker ps -q -f name=carelog_records-service)
    docker exec -it $CONTAINER_ID npm run seed
else
    echo "Records Service se afla pe nodul: $NODE_NAME. Rulare prin tunel..."
    CONTAINER_ID_INSIDE=$(docker exec $NODE_NAME docker ps -q -f name=carelog_records-service)
    docker exec -it $NODE_NAME docker exec -it $CONTAINER_ID_INSIDE npm run seed
fi

echo -e "${BLUE}Setup Finalizat cu Succes!${NC}"
echo "Frontend: http://localhost:3000"
echo "Portainer:  http://localhost:9000"
echo "Grafana:    http://localhost:3001 (admin/admin)"
echo "Prometheus: http://localhost:9090"
echo -e "\nDistributie Servicii pe Noduri:"
docker stack ps carelog
