#!/bin/bash

# ATX File Manager Health Check Script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================"
echo "ATX File Manager Health Check"
echo "================================"
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Not installed"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} Installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} Not installed"
    exit 1
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} Installed: $PSQL_VERSION"
    
    # Try to connect
    echo -n "  Testing connection... "
    if psql -U postgres -d atxfilemanager -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} Connected"
    else
        echo -e "${YELLOW}!${NC} Cannot connect (database may not be set up yet)"
    fi
else
    echo -e "${RED}✗${NC} Not installed"
    exit 1
fi

# Check Redis
echo -n "Checking Redis... "
if command -v redis-cli &> /dev/null; then
    echo -e "${GREEN}✓${NC} Installed"
    
    # Try to connect
    echo -n "  Testing connection... "
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓${NC} Connected"
    else
        echo -e "${RED}✗${NC} Cannot connect"
    fi
else
    echo -e "${RED}✗${NC} Not installed"
    exit 1
fi

# Check if built
echo -n "Checking if application is built... "
if [ -d "dist" ]; then
    echo -e "${GREEN}✓${NC} Built"
else
    echo -e "${YELLOW}!${NC} Not built (run: npm run build)"
fi

# Check if dependencies are installed
echo -n "Checking backend dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}!${NC} Not installed (run: npm install)"
fi

echo -n "Checking frontend dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}!${NC} Not installed (run: cd frontend && npm install)"
fi

# Check .env file
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Exists"
else
    echo -e "${YELLOW}!${NC} Not found (copy from .env.example)"
fi

# Check if backend is running
echo -n "Checking if backend is running... "
if curl -s http://localhost:3001/health &> /dev/null; then
    echo -e "${GREEN}✓${NC} Running on port 3001"
else
    echo -e "${YELLOW}!${NC} Not running"
fi

# Check if frontend is running
echo -n "Checking if frontend is running... "
if curl -s http://localhost:3000 &> /dev/null; then
    echo -e "${GREEN}✓${NC} Running on port 3000"
else
    echo -e "${YELLOW}!${NC} Not running"
fi

# Check directories
echo -n "Checking storage directories... "
if [ -d "uploads" ] && [ -d "temp" ]; then
    echo -e "${GREEN}✓${NC} Created"
else
    echo -e "${YELLOW}!${NC} Missing (will be created on first run)"
fi

echo ""
echo "================================"
echo "Health check complete!"
echo "================================"
