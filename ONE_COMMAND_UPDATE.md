# 🚀 One-Command Server Update

Quick guide for updating your Gulf Premium Telecom server with a single command.

---

## The One Command

```bash
sudo ./update-server.sh
```

**That's it!** This single command will:
1. ✅ Pull latest code from GitHub
2. ✅ Install new dependencies
3. ✅ Build frontend
4. ✅ Restart backend service
5. ✅ Restart frontend service
6. ✅ Show status

---

## First Time Setup

Make the script executable (only needed once):

```bash
chmod +x update-server.sh
```

---

## Usage

### On Your VPS (167.172.170.88)

```bash
# Navigate to project directory
cd ~/Gulf-Premium-Telecom

# Run the update
sudo ./update-server.sh
```

### What You'll See

```
🚀 Gulf Premium Telecom - Server Update
========================================

📁 Current directory: /root/Gulf-Premium-Telecom

📥 Step 1/5: Pulling latest code from GitHub...
   Current branch: copilot/build-asterisk-inbound-sip
   ✅ Code updated successfully

📦 Step 2/5: Installing backend dependencies...
   ✅ Backend dependencies installed

📦 Step 3/5: Checking frontend dependencies...
   🔨 Building frontend...
   ✅ Frontend built successfully

🔄 Step 4/5: Restarting backend service...
   ✅ Backend service restarted successfully

🔄 Step 5/5: Restarting frontend service...
   ✅ Frontend service restarted successfully

📊 Service Status:
===================
✅ Backend:  Running
✅ Frontend: Running

🌐 Access your system:
======================
Dashboard: http://167.172.170.88
Backend:   http://167.172.170.88:3001/api

✨ Update completed!

📝 Useful commands:
   Check backend logs:  sudo journalctl -u gulf-telecom-backend -f
   Check frontend logs: sudo journalctl -u gulf-telecom-frontend -f
   Check status:        sudo systemctl status gulf-telecom-backend gulf-telecom-frontend
```

---

## What It Does

### Step 1: Pull Latest Code
- Fetches latest changes from GitHub
- Pulls current branch
- Shows what was updated

### Step 2: Install Backend Dependencies
- Checks for new npm packages
- Installs production dependencies
- Only installs what's needed

### Step 3: Build Frontend
- Installs frontend dependencies if needed
- Builds optimized production bundle
- Ready for serving

### Step 4: Restart Backend
- Restarts Node.js backend service
- Waits for service to come up
- Verifies service is running

### Step 5: Restart Frontend
- Restarts Next.js frontend service
- Waits for service to come up
- Verifies service is running

---

## Troubleshooting

### If Update Fails

**Check what went wrong:**
```bash
sudo ./update-server.sh
# Read the error messages
```

**Common issues:**

1. **Git pull fails:**
   ```bash
   # Check if you have local changes
   git status
   
   # Stash local changes
   git stash
   
   # Try update again
   sudo ./update-server.sh
   ```

2. **npm install fails:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Try update again
   sudo ./update-server.sh
   ```

3. **Service won't start:**
   ```bash
   # Check backend logs
   sudo journalctl -u gulf-telecom-backend -n 50
   
   # Check frontend logs
   sudo journalctl -u gulf-telecom-frontend -n 50
   ```

### Manual Restart

If services don't restart automatically:

```bash
# Restart backend
sudo systemctl restart gulf-telecom-backend

# Restart frontend
sudo systemctl restart gulf-telecom-frontend

# Check status
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend
```

---

## When to Use

**Use the update command when:**
- ✅ New code is pushed to repository
- ✅ New features are added
- ✅ Bug fixes are deployed
- ✅ Configuration changes are made
- ✅ Dependencies are updated

**Example scenarios:**
```bash
# After new features are committed
sudo ./update-server.sh

# After fixing bugs
sudo ./update-server.sh

# Weekly maintenance
sudo ./update-server.sh

# After reviewing documentation updates
sudo ./update-server.sh
```

---

## Safety Features

**The script includes:**
- ✅ Error checking (exits on failure)
- ✅ Root permission verification
- ✅ Service status verification
- ✅ Graceful error handling
- ✅ Clear status messages
- ✅ Helpful troubleshooting tips

**Safe to run multiple times:**
- Won't break if run repeatedly
- Idempotent operations
- No data loss

---

## Advanced Usage

### Update Specific Branch

```bash
# Switch to specific branch first
git checkout main

# Then update
sudo ./update-server.sh
```

### Update Without Building Frontend

Edit the script to skip frontend build:
```bash
# Comment out frontend build section
```

### Dry Run (See What Would Happen)

```bash
# Just pull code without restarting
git pull origin copilot/build-asterisk-inbound-sip
```

---

## Quick Reference

### The Command
```bash
sudo ./update-server.sh
```

### Check Logs After Update
```bash
# Backend
sudo journalctl -u gulf-telecom-backend -f

# Frontend
sudo journalctl -u gulf-telecom-frontend -f
```

### Verify Services
```bash
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend
```

### Test Dashboard
```bash
curl http://localhost
```

---

## Automation (Optional)

### Set Up Auto-Update (Cron)

Update every night at 2 AM:
```bash
# Edit crontab
sudo crontab -e

# Add this line:
0 2 * * * cd /root/Gulf-Premium-Telecom && ./update-server.sh >> /var/log/gulf-update.log 2>&1
```

### Webhook-Triggered Update

When you push to GitHub, automatically update:
```bash
# Install webhook listener
npm install -g github-webhook-handler

# Configure webhook
# Point to script
```

---

## Benefits

**Single Command:**
- ✅ No manual steps
- ✅ No SSH commands to remember
- ✅ Everything automated
- ✅ Consistent updates

**Safe & Reliable:**
- ✅ Error checking
- ✅ Status verification
- ✅ Rollback possible
- ✅ Clear feedback

**Time Saving:**
- ✅ 30 seconds vs 5 minutes
- ✅ No mistakes
- ✅ Professional process
- ✅ Repeatable

---

## Summary

**One command does everything:**

```bash
sudo ./update-server.sh
```

**Result:**
- Latest code deployed
- Services restarted
- System updated
- Ready to use!

**Perfect for:**
- Quick updates
- Frequent deployments
- Team collaboration
- Production maintenance

---

**Update your server in seconds, not minutes!** 🚀✨

