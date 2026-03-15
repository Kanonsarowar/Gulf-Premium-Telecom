# VPS Quick Commands Reference

Quick command reference for managing Gulf Premium Telecom on your VPS (167.172.170.88).

## 🚀 Initial Installation

### One-Command Install (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/main/vps-install.sh | sudo bash
```

### Manual Installation
See [VPS_SETUP.md](VPS_SETUP.md) for complete step-by-step guide.

---

## 🔧 Service Management

### Start/Stop/Restart Services

```bash
# Start all services
sudo systemctl start gulf-telecom-backend gulf-telecom-frontend

# Stop all services
sudo systemctl stop gulf-telecom-backend gulf-telecom-frontend

# Restart all services
sudo systemctl restart gulf-telecom-backend gulf-telecom-frontend

# Check service status
sudo systemctl status gulf-telecom-backend
sudo systemctl status gulf-telecom-frontend
sudo systemctl status mongod
sudo systemctl status asterisk
sudo systemctl status nginx
```

### View Logs

```bash
# Backend logs (live)
sudo journalctl -u gulf-telecom-backend -f

# Frontend logs (live)
sudo journalctl -u gulf-telecom-frontend -f

# Last 100 lines
sudo journalctl -u gulf-telecom-backend -n 100

# All logs since today
sudo journalctl -u gulf-telecom-backend --since today
```

---

## 📞 Asterisk Commands

### Connect to Asterisk Console

```bash
# Connect with verbose output
sudo asterisk -rvvv

# Inside console:
core show version      # Show Asterisk version
sip show peers        # Show all SIP peers/trunks
core show channels    # Show active calls
dialplan reload       # Reload dialplan
sip reload           # Reload SIP configuration
exit                 # Exit console
```

### One-Line Commands

```bash
# Show all SIP trunks
sudo asterisk -rx "sip show peers"

# Show only supplier trunks
sudo asterisk -rx "sip show peers" | grep supplier

# Count active calls
sudo asterisk -rx "core show channels" | grep "active call"

# Show active channels
sudo asterisk -rx "core show channels verbose"

# Reload configurations
sudo asterisk -rx "sip reload"
sudo asterisk -rx "dialplan reload"
sudo asterisk -rx "manager reload"
```

### Enable SIP Debugging

```bash
# Start SIP debugging
sudo asterisk -rx "sip set debug on"

# Watch in console
sudo asterisk -rvvv

# Stop SIP debugging
sudo asterisk -rx "sip set debug off"
```

---

## 🗄️ MongoDB Commands

### Check MongoDB Status

```bash
# Service status
sudo systemctl status mongod

# Start/Stop MongoDB
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl restart mongod

# Connect to MongoDB shell
mongosh

# Inside mongosh:
use gulf-telecom           # Switch to database
db.calls.count()          # Count calls
db.calls.find().limit(5)  # Show last 5 calls
exit                      # Exit shell
```

### Backup MongoDB

```bash
# Backup database
sudo mongodump --db gulf-telecom --out /backup/mongo/$(date +%Y%m%d)

# Restore database
sudo mongorestore --db gulf-telecom /backup/mongo/20260207/gulf-telecom
```

---

## 🌐 Nginx Commands

### Manage Nginx

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Reload configuration (no downtime)
sudo systemctl reload nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Application

### Pull Latest Changes

```bash
cd /opt/gulf-telecom

# Stop services
sudo systemctl stop gulf-telecom-backend gulf-telecom-frontend

# Pull updates
git pull

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
cd client && npm run build && cd ..

# Start services
sudo systemctl start gulf-telecom-backend gulf-telecom-frontend

# Check status
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend
```

---

## 🔥 Firewall Commands

### Check Firewall Status

```bash
# Show all rules
sudo ufw status verbose

# Show numbered rules
sudo ufw status numbered
```

### Common Firewall Operations

```bash
# Allow specific IP on SIP port
sudo ufw allow from 192.168.1.100 to any port 5060 proto udp

# Remove a rule (use number from 'ufw status numbered')
sudo ufw delete 15

# Disable/Enable firewall
sudo ufw disable
sudo ufw enable
```

---

## 🔍 Troubleshooting Commands

### Check if Ports are in Use

```bash
# Check specific ports
sudo netstat -tlnp | grep -E '3000|3001|5038|5060'

# Check all listening ports
sudo netstat -tlnp

# Alternative with ss command
sudo ss -tlnp | grep -E '3000|3001'
```

### Check Disk Space

```bash
# Disk usage summary
df -h

# Largest directories
du -h --max-depth=1 / | sort -hr | head -20
```

### Check Memory Usage

```bash
# Memory usage
free -h

# Top processes by memory
ps aux --sort=-%mem | head -10
```

### Check CPU Usage

```bash
# Real-time process monitor
top

# Alternative with better UI
htop
```

### Check System Logs

```bash
# System logs
sudo journalctl -xe

# Kernel messages
sudo dmesg | tail -50

# Authentication logs
sudo tail -f /var/log/auth.log
```

---

## 🧪 Testing Commands

### Test API Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Get all calls
curl http://localhost:3001/api/calls

# Get revenue statistics
curl http://localhost:3001/api/revenue/stats
```

### Test WebSocket Connection

```bash
# Install wscat if needed
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3001
```

### Test Asterisk AMI

```bash
# Test AMI connection
telnet localhost 5038

# You should see:
# Asterisk Call Manager/X.X
```

---

## 📊 Monitoring Commands

### Watch Service Status

```bash
# Watch services in real-time (refreshes every 2 seconds)
watch -n 2 'systemctl status gulf-telecom-backend gulf-telecom-frontend mongod asterisk nginx'
```

### Monitor Active Calls

```bash
# Watch active calls
watch -n 1 'sudo asterisk -rx "core show channels"'
```

### Monitor Logs

```bash
# Monitor multiple logs at once
sudo tail -f /var/log/nginx/access.log & \
sudo journalctl -u gulf-telecom-backend -f & \
sudo journalctl -u gulf-telecom-frontend -f
```

---

## 🔒 Security Commands

### Change AMI Password

```bash
# Edit manager.conf
sudo nano /etc/asterisk/manager.conf

# Change the 'secret' line
secret=new_secure_password

# Restart Asterisk
sudo systemctl restart asterisk

# Update .env file
sudo nano /opt/gulf-telecom/.env

# Change AMI_SECRET value
AMI_SECRET=new_secure_password

# Restart backend
sudo systemctl restart gulf-telecom-backend
```

### Check Failed Login Attempts

```bash
# SSH login attempts
sudo grep "Failed password" /var/log/auth.log

# Count by IP
sudo grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -nr
```

### Install Fail2Ban

```bash
# Install
sudo apt install -y fail2ban

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

---

## 💾 Backup Commands

### Create Complete Backup

```bash
# Create backup directory
sudo mkdir -p /backup/gulf-telecom/$(date +%Y%m%d)

# Backup MongoDB
sudo mongodump --db gulf-telecom --out /backup/gulf-telecom/$(date +%Y%m%d)/mongodb

# Backup application
sudo tar -czf /backup/gulf-telecom/$(date +%Y%m%d)/application.tar.gz /opt/gulf-telecom

# Backup Asterisk configs
sudo tar -czf /backup/gulf-telecom/$(date +%Y%m%d)/asterisk-configs.tar.gz /etc/asterisk

# List backups
ls -lh /backup/gulf-telecom/
```

### Restore from Backup

```bash
# Restore MongoDB
sudo mongorestore --db gulf-telecom /backup/gulf-telecom/20260207/mongodb/gulf-telecom

# Restore application (if needed)
sudo tar -xzf /backup/gulf-telecom/20260207/application.tar.gz -C /

# Restore Asterisk configs
sudo tar -xzf /backup/gulf-telecom/20260207/asterisk-configs.tar.gz -C /
sudo systemctl restart asterisk
```

---

## 🎯 Access URLs

After installation, access your system at:

- **Dashboard**: http://167.172.170.88
- **Backend API**: http://167.172.170.88:3001/api
- **Health Check**: http://167.172.170.88:3001/api/health
- **WebSocket**: ws://167.172.170.88:3001

---

## 📞 Emergency Commands

### Complete System Restart

```bash
# Stop all services
sudo systemctl stop gulf-telecom-backend gulf-telecom-frontend nginx

# Restart dependencies
sudo systemctl restart mongod asterisk

# Wait 5 seconds
sleep 5

# Start application services
sudo systemctl start gulf-telecom-backend gulf-telecom-frontend nginx

# Check all status
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend mongod asterisk nginx
```

### Reset Application (Keep Data)

```bash
cd /opt/gulf-telecom

# Stop services
sudo systemctl stop gulf-telecom-backend gulf-telecom-frontend

# Reinstall dependencies
rm -rf node_modules client/node_modules
npm install
cd client && npm install && npm run build && cd ..

# Start services
sudo systemctl start gulf-telecom-backend gulf-telecom-frontend
```

---

## 📚 Quick Reference

| Task | Command |
|------|---------|
| **Check all services** | `sudo systemctl status gulf-telecom-backend gulf-telecom-frontend mongod asterisk nginx` |
| **Restart application** | `sudo systemctl restart gulf-telecom-backend gulf-telecom-frontend` |
| **View backend logs** | `sudo journalctl -u gulf-telecom-backend -f` |
| **Show SIP trunks** | `sudo asterisk -rx "sip show peers"` |
| **Show active calls** | `sudo asterisk -rx "core show channels"` |
| **Test API** | `curl http://localhost:3001/api/health` |
| **Update app** | `cd /opt/gulf-telecom && git pull && npm install && cd client && npm install && npm run build` |
| **Backup MongoDB** | `sudo mongodump --db gulf-telecom --out /backup/$(date +%Y%m%d)` |

---

## 🆘 Need More Help?

- **Complete Setup Guide**: [VPS_SETUP.md](VPS_SETUP.md)
- **Installation Checklist**: [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
- **Troubleshooting**: [FAQ.md](FAQ.md)
- **API Documentation**: [API.md](API.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Server IP**: 167.172.170.88
**Installation Directory**: /opt/gulf-telecom
