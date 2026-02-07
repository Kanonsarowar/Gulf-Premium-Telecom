#!/bin/bash

# Gulf Premium Telecom - One-Command Server Update Script
# Usage: sudo ./update-server.sh

set -e  # Exit on error

echo "🚀 Gulf Premium Telecom - Server Update"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Current directory: $SCRIPT_DIR"
echo ""

# Step 1: Pull latest code
echo "📥 Step 1/5: Pulling latest code from GitHub..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "   Current branch: $CURRENT_BRANCH"

if git pull origin "$CURRENT_BRANCH"; then
    echo "   ✅ Code updated successfully"
else
    echo "   ⚠️  Pull failed, continuing anyway..."
fi
echo ""

# Step 2: Install backend dependencies
echo "📦 Step 2/5: Installing backend dependencies..."
if [ -f "server/package.json" ]; then
    cd server
    npm install --production
    cd ..
    echo "   ✅ Backend dependencies installed"
else
    echo "   ⚠️  No server/package.json found, skipping..."
fi
echo ""

# Step 3: Install frontend dependencies (if needed)
echo "📦 Step 3/5: Checking frontend dependencies..."
if [ -f "client/package.json" ]; then
    cd client
    if [ ! -d "node_modules" ]; then
        npm install
        echo "   ✅ Frontend dependencies installed"
    else
        echo "   ℹ️  Frontend dependencies already installed"
    fi
    
    # Build frontend
    echo "   🔨 Building frontend..."
    npm run build
    echo "   ✅ Frontend built successfully"
    cd ..
else
    echo "   ℹ️  No client/package.json found, skipping..."
fi
echo ""

# Step 4: Restart backend service
echo "🔄 Step 4/5: Restarting backend service..."
if systemctl is-active --quiet gulf-telecom-backend; then
    systemctl restart gulf-telecom-backend
    sleep 2
    if systemctl is-active --quiet gulf-telecom-backend; then
        echo "   ✅ Backend service restarted successfully"
    else
        echo "   ❌ Backend service failed to start"
        echo "   Check logs: sudo journalctl -u gulf-telecom-backend -n 50"
    fi
else
    echo "   ℹ️  Backend service not found or not running"
fi
echo ""

# Step 5: Restart frontend service
echo "🔄 Step 5/5: Restarting frontend service..."
if systemctl is-active --quiet gulf-telecom-frontend; then
    systemctl restart gulf-telecom-frontend
    sleep 2
    if systemctl is-active --quiet gulf-telecom-frontend; then
        echo "   ✅ Frontend service restarted successfully"
    else
        echo "   ❌ Frontend service failed to start"
        echo "   Check logs: sudo journalctl -u gulf-telecom-frontend -n 50"
    fi
else
    echo "   ℹ️  Frontend service not found or not running"
fi
echo ""

# Show service status
echo "📊 Service Status:"
echo "==================="
if systemctl is-active --quiet gulf-telecom-backend; then
    echo "✅ Backend:  Running"
else
    echo "❌ Backend:  Stopped"
fi

if systemctl is-active --quiet gulf-telecom-frontend; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Stopped"
fi
echo ""

# Show URLs
echo "🌐 Access your system:"
echo "======================"
echo "Dashboard: http://$(hostname -I | awk '{print $1}')"
echo "Backend:   http://$(hostname -I | awk '{print $1}'):3001/api"
echo ""

echo "✨ Update completed!"
echo ""
echo "📝 Useful commands:"
echo "   Check backend logs:  sudo journalctl -u gulf-telecom-backend -f"
echo "   Check frontend logs: sudo journalctl -u gulf-telecom-frontend -f"
echo "   Check status:        sudo systemctl status gulf-telecom-backend gulf-telecom-frontend"
echo ""
