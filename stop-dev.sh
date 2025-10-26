#!/bin/bash

# Stop local development servers

echo "Stopping development servers..."

if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✓ Backend stopped (PID: $BACKEND_PID)"
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✓ Frontend stopped (PID: $FRONTEND_PID)"
    rm .frontend.pid
fi

# Also kill any php and node processes on the ports
lsof -ti:3003 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

echo "All development servers stopped."
