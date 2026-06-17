@echo off
REM Deploy script for Travel Agency Platform
echo Building and starting services...
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d
echo Waiting for services to be healthy...
timeout /t 15
echo Services status:
docker-compose ps
echo.
echo Backend: http://localhost:8080/api/health
echo Frontend: http://localhost:80
