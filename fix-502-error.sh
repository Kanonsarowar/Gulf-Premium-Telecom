#!/bin/bash

# Diagnostic script for 502 Bad Gateway error

echo "🔍 Diagnosing 502 Bad Gateway Error..."
echo "======================================"

# 1. Check backend service
echo ""
echo "1️⃣ Backend Service Status:"
sudo systemctl status gulf-telecom-backend --no-pager | head -10

# 2. Check if listening
echo ""
echo "2️⃣ Port 3001 Status:"
sudo netstat -tlnp | grep 3001 || echo "❌ Port 3001 NOT listening!"

# 3. Check MongoDB
echo ""
echo "3️⃣ MongoDB Status:"
sudo systemctl status mongod --no-pager | head -5

# 4. Check recent errors
echo ""
echo "4️⃣ Recent Backend Errors:"
sudo journalctl -u gulf-telecom-backend -n 20 --no-pager | grep -i error || echo "✅ No recent errors found"

# 5. Test backend directly
echo ""
echo "5️⃣ Testing Backend API:"
curl -s http://localhost:3001/api/health 2>/dev/null || echo "❌ Backend not responding!"

echo ""
echo "======================================"
echo "📋 Diagnosis Complete!"
echo ""
echo "💡 To fix, try:"
echo "   sudo systemctl restart mongod"
echo "   sudo systemctl restart gulf-telecom-backend"
