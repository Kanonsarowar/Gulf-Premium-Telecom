#!/bin/bash

# Quick fix script for 502 Bad Gateway error

echo "🚀 Quick Fix for 502 Bad Gateway"
echo "================================"

echo "1. Starting MongoDB..."
sudo systemctl start mongod
sleep 2

echo "2. Restarting Backend..."
sudo systemctl restart gulf-telecom-backend
sleep 5

echo "3. Checking Status..."
if sudo systemctl is-active --quiet gulf-telecom-backend; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start. Check logs:"
    sudo journalctl -u gulf-telecom-backend -n 20 --no-pager
    exit 1
fi

echo "4. Testing API..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend API responding!"
else
    echo "❌ Backend not responding. Check logs."
    exit 1
fi

echo ""
echo "🎉 Fixed! Try accessing:"
echo "   http://167.172.170.88"
