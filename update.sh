#!/bin/bash

# Culori pentru output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}CareLog Cluster Update (Manual Trigger)${NC}"

# 1. Sincronizare cod (Git Pull)
echo -e "${GREEN}Sincronizare configurare din GitHub...${NC}"
git pull origin main 2>/dev/null || echo "Git pull a esuat. Folosesc configurarea locala."

# 2. Descarcare imagini noi
echo -e "${GREEN}Descarcare ultimele imagini de pe Docker Hub...${NC}"
docker stack deploy -c docker-compose.yml carelog --resolve-image always 2>/dev/null

# 3. Verificare stare
echo -e "${GREEN}Verificare stare servicii...${NC}"
docker service ls --filter "name=carelog"

echo -e "\n${BLUE}Update finalizat, verificati aplicatia la http://localhost:3000${NC}"
