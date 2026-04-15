$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "Starting PreLegal..."
docker compose up --build -d
Write-Host "Frontend: http://localhost:4200"
Write-Host "Backend:  http://localhost:9000"
