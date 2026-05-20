docker stack rm carelog
docker stop worker-1 worker-2
---
docker start worker-1 worker-2
sleep 10
docker stack deploy -c docker-compose.yml carelog
---
docker stack ps carelog --filter "desired-state=running"
