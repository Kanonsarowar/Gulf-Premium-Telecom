#!/bin/bash

###############################################################################
# Gulf Premium Telecom - One Command Startup Script
# This script installs dependencies and starts all services
###############################################################################

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     Gulf Premium Telecom - One Command Setup & Start            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

###############################################################################
# Step 1: Check Prerequisites
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking Prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Please install Node.js 16+ first: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"

# Check MongoDB (optional - can be remote)
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB installed locally${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB not found locally (assuming remote MongoDB)${NC}"
fi

# Check Asterisk
if command -v asterisk &> /dev/null; then
    ASTERISK_VERSION=$(asterisk -V 2>&1 | head -n1 || echo "Unknown")
    echo -e "${GREEN}✓ Asterisk installed: $ASTERISK_VERSION${NC}"
else
    echo -e "${RED}✗ Asterisk is not installed${NC}"
    echo "  Please install Asterisk first"
    exit 1
fi

echo ""

###############################################################################
# Step 2: Install Backend Dependencies
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Installing Backend Dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

echo ""

###############################################################################
# Step 3: Install Frontend Dependencies
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Installing Frontend Dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd client
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
cd ..

echo ""

###############################################################################
# Step 4: Setup Environment Configuration
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Setting Up Environment Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit .env file with your configuration${NC}"
    echo "  Especially set your MONGODB_URI"
    echo ""
    echo "Press ENTER to edit .env now, or Ctrl+C to edit later..."
    read -r
    ${EDITOR:-nano} .env
    echo -e "${GREEN}✓ .env file configured${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

###############################################################################
# Step 5: Verify Asterisk Configuration
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Verifying Asterisk Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Checking if Asterisk is running..."
if pgrep -x "asterisk" > /dev/null; then
    echo -e "${GREEN}✓ Asterisk is running${NC}"
    
    # Check if trunks are configured
    echo "Checking SIP trunks..."
    TRUNK_COUNT=$(asterisk -rx "sip show peers" 2>/dev/null | grep -c "supplier" || echo "0")
    if [ "$TRUNK_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Found $TRUNK_COUNT SIP trunk(s) configured${NC}"
    else
        echo -e "${YELLOW}⚠ No supplier trunks found${NC}"
        echo "  Run './setup-trunks.sh' to configure trunks if needed"
    fi
else
    echo -e "${RED}✗ Asterisk is not running${NC}"
    echo "  Please start Asterisk first: sudo systemctl start asterisk"
    exit 1
fi

echo ""

###############################################################################
# Step 6: Check MongoDB Connection
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Checking MongoDB Connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$MONGODB_URI" ]; then
    echo -e "${YELLOW}⚠ MONGODB_URI not set in .env${NC}"
    echo "  Using default: mongodb://localhost:27017/gulf-telecom"
    export MONGODB_URI="mongodb://localhost:27017/gulf-telecom"
fi

echo "MongoDB URI: ${MONGODB_URI}"
echo -e "${GREEN}✓ MongoDB configuration loaded${NC}"

echo ""

###############################################################################
# Step 7: Start All Services
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Starting All Services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Starting Gulf Premium Telecom services..."
echo ""
echo "This will start:"
echo "  • Backend Server (Port 3001)"
echo "  • Frontend Dashboard (Port 3000)"
echo "  • WebSocket Server (Port 3001)"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""
sleep 2

# Check if concurrently is available
if npm list concurrently &> /dev/null || npm list -g concurrently &> /dev/null; then
    echo -e "${GREEN}Starting services with concurrently...${NC}"
    npm run dev
else
    echo -e "${YELLOW}concurrently not found, installing...${NC}"
    npm install -g concurrently
    npm run dev
fi
