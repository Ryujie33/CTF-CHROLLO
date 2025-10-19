#!/bin/bash

echo "🔄 Resetting CTF Darknet..."

# Stop services first
./scripts/stop-ctf.sh

# Reset Docker containers
echo "🐳 Resetting Docker containers..."
cd backend
docker-compose down
docker-compose up -d

echo ""
echo "✅ CTF Darknet has been reset"
echo "🎯 Run './scripts/start-ctf.sh' to start again"