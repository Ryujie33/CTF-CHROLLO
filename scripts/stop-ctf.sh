#!/bin/bash

echo "🛑 Stopping CTF Darknet services..."

# Stop backend if PID file exists
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill $BACKEND_PID 2>/dev/null; then
        echo "✅ Stopped backend server (PID: $BACKEND_PID)"
    else
        echo "⚠️  Backend server already stopped"
    fi
    rm .backend.pid
fi

# Stop frontend if PID file exists
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill $FRONTEND_PID 2>/dev/null; then
        echo "✅ Stopped frontend server (PID: $FRONTEND_PID)"
    else
        echo "⚠️  Frontend server already stopped"
    fi
    rm .frontend.pid
fi

# Stop Docker containers
echo "🐳 Stopping Docker containers..."
cd backend
docker-compose down

echo ""
echo "✅ All CTF Darknet services have been stopped"