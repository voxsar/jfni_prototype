#!/bin/bash

# Setup script for Dieline Folding Application

echo "=========================================="
echo "Dieline Folding App - Setup Script"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker and Docker Compose are installed"
echo ""

# Create backend .env if not exists
if [ ! -f backend/.env ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✓ Backend .env created"
else
    echo "✓ Backend .env already exists"
fi

echo ""
echo "=========================================="
echo "Starting Docker containers..."
echo "=========================================="
echo ""

# Build and start containers
docker-compose up --build -d

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Services are starting up. Please wait a moment..."
echo ""
echo "Access the application at:"
echo "  - Frontend: http://localhost:3002"
echo "  - Backend API: http://localhost:3003/api/health"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop the application:"
echo "  docker-compose down"
echo ""
