# 🚨 Fix 502 Bad Gateway Error

Complete guide to diagnose and fix 502 Bad Gateway errors on your Gulf Premium Telecom dashboard.

## Quick Fix (Most Common)

```bash
# Restart MongoDB and Backend
sudo systemctl restart mongod
sleep 2
sudo systemctl restart gulf-telecom-backend
sleep 5

# Test if working
curl http://localhost:3001/api/health
```

If you see `{"status":"ok"}`, you're fixed! Access: http://167.172.170.88

---

## Common Causes & Fixes

### 1. Backend Service Not Running ⚠️

**Check:**
```bash
sudo systemctl status gulf-telecom-backend
```

**Fix:**
```bash
sudo systemctl start gulf-telecom-backend
```

### 2. MongoDB Not Running 🗄️

**Check:**
```bash
sudo systemctl status mongod
```

**Fix:**
```bash
sudo systemctl start mongod
sudo systemctl restart gulf-telecom-backend
```

### 3. Backend Crashed 💥

**Check logs:**
```bash
sudo journalctl -u gulf-telecom-backend -n 50 --no-pager
```

**Fix after reviewing errors:**
```bash
sudo systemctl restart gulf-telecom-backend
```

### 4. Port 3001 Not Listening 🔌

**Check:**
```bash
sudo netstat -tlnp | grep 3001
```

**If nothing shows, backend isn't running!**

---

## Step-by-Step Diagnosis

### Step 1: Check Backend Status
```bash
sudo systemctl status gulf-telecom-backend
```

**Look for:**
- `Active: active (running)` ✅ Good
- `Active: inactive (dead)` ❌ Not running - restart it
- `Active: failed` ❌ Crashed - check logs

### Step 2: View Error Logs
```bash
sudo journalctl -u gulf-telecom-backend -n 100 --no-pager
```

### Step 3: Common Error Fixes

**"Cannot connect to MongoDB"**
```bash
sudo systemctl start mongod
sudo systemctl restart gulf-telecom-backend
```

**"Port 3001 already in use"**
```bash
sudo lsof -i :3001
# Note the PID, then kill it
sudo systemctl start gulf-telecom-backend
```

**"MODULE_NOT_FOUND"**
```bash
cd ~/Gulf-Premium-Telecom/server
npm install
sudo systemctl restart gulf-telecom-backend
```

---

## Complete Recovery Procedure

```bash
# 1. Stop everything
sudo systemctl stop gulf-telecom-backend
sudo systemctl stop gulf-telecom-frontend

# 2. Start MongoDB
sudo systemctl start mongod
sleep 2

# 3. Start backend
sudo systemctl start gulf-telecom-backend
sleep 5

# 4. Start frontend
sudo systemctl start gulf-telecom-frontend
sleep 3

# 5. Check status
sudo systemctl status gulf-telecom-backend
sudo systemctl status gulf-telecom-frontend

# 6. Test backend
curl http://localhost:3001/api/health

# 7. Test dashboard
curl http://167.172.170.88
```

---

## Environment Variables

Backend needs these in `~/Gulf-Premium-Telecom/server/.env`:

```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/gulf-telecom
AMI_HOST=localhost
AMI_PORT=5038
AMI_USERNAME=admin
AMI_PASSWORD=secret
JWT_SECRET=your-secret-key-here
```

**Check if exists:**
```bash
cat ~/Gulf-Premium-Telecom/server/.env
```

---

## Nginx Check

**Test Nginx configuration:**
```bash
sudo nginx -t
```

**View Nginx errors:**
```bash
sudo tail -20 /var/log/nginx/error.log
```

**Restart Nginx if needed:**
```bash
sudo systemctl restart nginx
```

---

## Prevention

**Enable auto-restart on failure:**

```bash
sudo systemctl edit gulf-telecom-backend
```

Add:
```ini
[Service]
Restart=always
RestartSec=10
```

Save and run:
```bash
sudo systemctl daemon-reload
```

---

## Quick Commands Reference

```bash
# Check all services
sudo systemctl status mongod gulf-telecom-backend gulf-telecom-frontend

# Restart all
sudo systemctl restart mongod
sudo systemctl restart gulf-telecom-backend  
sudo systemctl restart gulf-telecom-frontend

# View logs
sudo journalctl -u gulf-telecom-backend -f

# Test backend
curl http://localhost:3001/api/health
```

---

**Your 502 error should be fixed!** 🎉
