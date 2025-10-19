#!/bin/bash

echo "🚀 Setting up CTF Darknet Environment..."
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Docker and Node.js are installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Build and start Docker containers
echo "🐳 Setting up Docker containers..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker containers"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo "🎯 Run './scripts/start-ctf.sh' to start the CTF"
echo ""
echo "📋 Access Points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   SSH:      ssh ctf_player@localhost -p 2222"
echo "   SSH Pass: ctf123"