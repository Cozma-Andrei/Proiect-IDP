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

# 2. Initializare Docker Swarm
echo -e "${GREEN}1. Initializare Docker Swarm...${NC}"
docker swarm init 2>/dev/null || echo "Swarm este deja initializat."

# 3. Oprire Stack existent (daca exista)
echo -e "${GREEN}2. Curatare stack anterior...${NC}"
docker stack rm carelog 2>/dev/null
echo "Asteptam 10 secunde pentru eliberarea resurselor (retele, secrete)..."
sleep 10

# 4. Initializare Secrete (Docker Secrets)
echo -e "${GREEN}3. Initializare Secrete Securizate...${NC}"
chmod +x init_secrets.sh
./init_secrets.sh

# 5. Build imagini
echo -e "${GREEN}4. Construire imagini microservicii...${NC}"
docker-compose build

# 6. Deploy Stack
echo -e "${GREEN}5. Lansare Stack in Swarm (carelog)...${NC}"
docker stack deploy -c docker-compose.yml carelog

# 7. Asteptare servicii
echo -e "${GREEN}6. Asteptare stabilizare servicii (30s)...${NC}"
sleep 30

# 8. Rulare Seeder
echo -e "${GREEN}7. Populare baza de date (Seeder)...${NC}"
CONTAINER_ID=$(docker ps -q -f name=carelog_records-service)
if [ -z "$CONTAINER_ID" ]; then
    echo "Eroare: Nu s-a gasit containerul records-service. Verifica 'docker service ls'."
else
    docker exec -it $CONTAINER_ID npm run seed
fi

echo -e "${BLUE}Setup Finalizat cu Succes!${NC}"
echo "Frontend: http://localhost:3000"
echo "Portainer: http://localhost:9000"
