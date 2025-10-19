#!/bin/bash

echo "🎯 Starting CTF Darknet..."
echo "=========================="

# Start backend server
echo "🔧 Starting backend server..."
cd backend
node server.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Start frontend development server
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Save PIDs to file for later cleanup
echo "$BACKEND_PID" > ../.backend.pid
echo "$FRONTEND_PID" > ../.frontend.pid

echo ""
echo "✅ CTF Darknet is starting up..."
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend API is running at: http://localhost:5000"
echo "🐳 SSH Server: ssh ctf_player@localhost -p 2222"
echo ""
echo "🔑 SSH Password: ctf123"
echo ""
echo "💡 Press Ctrl+C to stop all services"
echo "📝 Or run './scripts/stop-ctf.sh' to stop gracefully"

# Wait for user interrupt
wait