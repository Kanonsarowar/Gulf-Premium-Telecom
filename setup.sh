#!/bin/bash

# Gulf Premium Telecom - Quick Setup Script
# This script automates the basic setup process

set -e

echo "=========================================="
echo "Gulf Premium Telecom - Quick Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "Please do not run this script as root"
  exit 1
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo "Checking Node.js installation..."
if command_exists node; then
  echo "✓ Node.js is installed: $(node --version)"
else
  echo "✗ Node.js is not installed"
  echo "Please install Node.js v16 or higher from https://nodejs.org/"
  exit 1
fi

# Check npm
echo "Checking npm installation..."
if command_exists npm; then
  echo "✓ npm is installed: $(npm --version)"
else
  echo "✗ npm is not installed"
  exit 1
fi

# Check MongoDB
echo "Checking MongoDB installation..."
if command_exists mongod; then
  echo "✓ MongoDB is installed"
  sudo systemctl start mongod 2>/dev/null || echo "Note: Could not start MongoDB, it may already be running"
else
  echo "✗ MongoDB is not installed"
  echo "Please install MongoDB from https://www.mongodb.com/docs/manual/installation/"
  exit 1
fi

# Check Asterisk
echo "Checking Asterisk installation..."
if command_exists asterisk; then
  echo "✓ Asterisk is installed"
else
  echo "⚠ Asterisk is not installed"
  echo "Please install Asterisk before continuing"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "Installing backend dependencies..."
npm install

echo ""
echo "Installing frontend dependencies..."
cd client
npm install
cd ..

echo ""
echo "Setting up environment configuration..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Created .env file from .env.example"
  echo ""
  echo "⚠ IMPORTANT: Please edit .env and configure:"
  echo "  - Asterisk credentials (ASTERISK_USERNAME, ASTERISK_PASSWORD)"
  echo "  - MongoDB URI if different from default"
  echo "  - Call rate per minute for revenue calculation"
  echo ""
  read -p "Press Enter to edit .env now (or Ctrl+C to exit and edit manually later)..."
  ${EDITOR:-nano} .env
else
  echo "✓ .env file already exists"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Configure Asterisk:"
echo "   sudo cp asterisk-config/manager.conf /etc/asterisk/"
echo "   sudo cp asterisk-config/sip.conf /etc/asterisk/"
echo "   sudo cp asterisk-config/extensions.conf /etc/asterisk/"
echo "   sudo asterisk -rx 'module reload'"
echo ""
echo "2. Start the application:"
echo "   npm run dev"
echo ""
echo "3. Access the dashboard:"
echo "   http://localhost:3000"
echo ""
echo "For detailed installation instructions, see INSTALLATION.md"
echo ""
