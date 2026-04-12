$ErrorActionPreference = "Stop"  
  
Write-Host "==> Creando red devops-net..." -ForegroundColor Cyan
# Silenciamos el error si la red ya existe sin romper el script
docker network create devops-net 2>$null
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Red ya existe o hubo un aviso, continuando." -ForegroundColor Yellow 
}  
  
Write-Host "==> Levantando Jenkins..." -ForegroundColor Cyan
# Nota: Asegúrate de que no haya espacios después de cada `
docker run -d --name jenkins --network devops-net --restart always -p 8080:8080 -v jenkins_home:/var/jenkins_home -v //var/run/docker.sock:/var/run/docker.sock jenkins/jenkins:lts-jdk21
  
Write-Host "==> Levantando SonarQube..." -ForegroundColor Cyan
docker run -d --name sonarqube --network devops-net --restart always -p 9000:9000 -v sonarqube_data:/opt/sonarqube/data -v sonarqube_logs:/opt/sonarqube/logs -v sonarqube_extensions:/opt/sonarqube/extensions sonarqube:community
  
Write-Host ""  
Write-Host "--------------------------------------------" -ForegroundColor Green
Write-Host "Jenkins   -> http://localhost:8080"  
Write-Host "SonarQube -> http://localhost:9000"  
Write-Host "--------------------------------------------" -ForegroundColor Green
Write-Host ""  

# Esperar unos segundos a que Jenkins extraiga los archivos antes de pedir la clave
Write-Host "Esperando a que Jenkins inicie para obtener la contraseña..."
Start-Sleep -Seconds 10

Write-Host "Contraseña inicial de Jenkins:" -ForegroundColor Yellow
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword