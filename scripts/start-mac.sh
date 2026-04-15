#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "Starting PreLegal..."
docker compose up --build -d
echo "Frontend: http://localhost:4200"
echo "Backend:  http://localhost:9000"
