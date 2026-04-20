# Changelog CareLog

* Proiect realizat de Cozma Andrei, 345C1
* Am implementat pentru etapa 2 **toată aplicația** conform cerințelor din regulamentul proiectului:
    * un microserviciu care se ocupă de autentificare si autorizare 
    * minim un microserviciu care se ocupă de „business logic” 
    * minim un microserviciu care interacționează cu o bază de date (există două microservicii care fac acest lucru) 
    * minim o bază de date (am folosit MongoDB, și există două baze de date MongoDB în aplicație)
    * minim un utilitar de gestiune a bazelor de date (MongoDB Compass)
    * Portainer pentru asigurarea gestiunii din UI a clusterului 
    * Kong pentru servirea publică a rutelor 
    * un sistem de logging sau monitorizare, cu dashboard pentru observabilitate (am folosit Grafana și Prometheus)
    * CI/CD pentru deployment automat (am folosit GitHub Actions cu self-hosted runner)

### 29 Martie 2026

* **Added**
    * Infrastructură cu Docker Swarm, Kong (pentru servirea publică a rutelor) și Portainer (pentru gestiunea clusterului din UI), inclusiv script de setup.
    * Sistem de monitorizare și logging folosind Prometheus și Grafana.
    * Configurare Dashboard în Grafana pentru observabilitate.
    * Pipeline-uri CI/CD pentru deployment automat (folosind GitHub Actions cu self-hosted runner).
    * Teste unitare (Unit tests) pentru validarea codului.
* **Created**
    * Infrastructura finală configurată și funcțională pentru a rula pe 3 noduri.
* **Edited**
    * Rezolvat conflict de dependențe la build-ul de Docker (remediat de două ori).
    * Ajustări minore pentru configurarea Grafana.
    * Fix minor pentru seeder în `docker-compose` (cu flag-ul `[skip deploy]`).
    * Ajustări și rulări de teste pe procesul de Continuous Deployment (CD).


### 28 Martie 2026

* **Added**
    * Rol de administrator în sistem.
* **Created**
    * Arhitectură bazată pe microservicii prin separarea proiectului și crearea de fișiere `Dockerfile` individuale pentru fiecare serviciu.
* **Edited**
    * Implementarea logicii de business a aplicației și integrarea modificărilor aferente funcționalităților noi.

### 20 Martie 2026

* **Created**
    * Funcționalitățile de bază ale aplicației (App Features), incluzând structura inițială pentru microserviciul de autentificare/autorizare, microserviciul de business logic și cele două microservicii care interacționează cu bazele de date MongoDB.
