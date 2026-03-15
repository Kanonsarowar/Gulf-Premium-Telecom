# 🚀 YOUR VPS SETUP - Quick Reference

## Your Situation
- **VPS IP:** 167.172.170.88
- **Asterisk:** Already installed ✓
- **Need:** Install Gulf Telecom application and configure trunks

---

## THE COMMAND YOU NEED

Since Asterisk is already installed on your VPS, use **ONE OF THESE METHODS**:

### Method 1: Direct Install (One Command)
```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/copilot/build-asterisk-inbound-sip/vps-install-quick.sh | sudo bash
```

### Method 2: Clone & Run (RECOMMENDED - More Reliable)
```bash
git clone -b copilot/build-asterisk-inbound-sip https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom
sudo ./vps-install-quick.sh
```

That's it! Everything will be installed and configured automatically in 5-10 minutes.

> **Note:** Files are currently on branch `copilot/build-asterisk-inbound-sip`. After PR merge, you can use `/main/` in the URL.

---

## What This Command Does

1. ✅ Checks Asterisk is installed (exits if not)
2. ✅ Installs Node.js 18.x (if needed)
3. ✅ Installs MongoDB 6.0 (if needed)
4. ✅ Clones Gulf Telecom application
5. ✅ Configures 8 SIP trunks in Asterisk
6. ✅ Sets up firewall for all 8 supplier IPs
7. ✅ Installs all dependencies
8. ✅ Builds frontend
9. ✅ Creates systemd services (auto-start)
10. ✅ Configures Nginx reverse proxy
11. ✅ Starts everything
12. ✅ Verifies installation

**Time:** 5-10 minutes

---

## Step-by-Step Instructions

### 1. Connect to Your VPS
```bash
ssh root@167.172.170.88
# or
ssh your-username@167.172.170.88
```

### 2. Run the Installer

**Option A: Direct curl**
```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/copilot/build-asterisk-inbound-sip/vps-install-quick.sh | sudo bash
```

**Option B: Clone first (recommended)**
```bash
git clone -b copilot/build-asterisk-inbound-sip https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom
sudo ./vps-install-quick.sh
```

### 3. Wait for Completion
The script will show progress and complete in 5-10 minutes.

### 4. Access Your Dashboard
Open in browser:
```
http://167.172.170.88
```

---

## After Installation

### Check Everything is Running
```bash
# Check all services
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend

# Check SIP trunks (should show 8)
sudo asterisk -rx "sip show peers" | grep supplier

# Test API
curl http://localhost:3001/api/health
```

### View Logs
```bash
# Backend logs
sudo journalctl -u gulf-telecom-backend -f

# Frontend logs
sudo journalctl -u gulf-telecom-frontend -f
```

---

## Your 8 Configured SIP Trunks

After installation, these trunks will be configured in Asterisk:

**Supplier Group 1:**
- 108.61.70.46 → supplier1-trunk1
- 157.90.193.196 → supplier1-trunk2
- 51.77.77.223 → supplier1-trunk3
- 95.217.90.212 → supplier1-trunk4

**Supplier Group 2 (AWS):**
- 52.28.165.40 → supplier2-aws1
- 52.57.172.184 → supplier2-aws2
- 35.156.119.128 → supplier2-aws3

**Supplier Group 3 (Quintum):**
- 149.12.160.10 → supplier3-quintum

---

## Next Steps

### 1. Contact Your Suppliers
Provide them your VPS IP: **167.172.170.88**

Send them this information:
```
Server IP: 167.172.170.88
SIP Port: 5060
RTP Ports: 10000-20000
Codecs: G.729, G.711 (ulaw/alaw), GSM
```

### 2. Request Test Calls
Ask each supplier to send test calls to verify connectivity.

### 3. Monitor Dashboard
Watch for incoming calls at:
```
http://167.172.170.88
```

### 4. Monitor Asterisk Console (Optional)
```bash
sudo asterisk -rvvv
# Enable SIP debugging
sip set debug on
# Watch for INVITE messages from supplier IPs
```

---

## Common Commands

### Restart Services
```bash
sudo systemctl restart gulf-telecom-backend gulf-telecom-frontend
```

### View Logs
```bash
sudo journalctl -u gulf-telecom-backend -f
```

### Check Asterisk Trunks
```bash
sudo asterisk -rx "sip show peers"
```

### Check Active Calls
```bash
sudo asterisk -rx "core show channels"
```

---

## Troubleshooting

### If Installation Fails

**Asterisk Not Found:**
```bash
# Check if Asterisk is installed
which asterisk
asterisk -V

# If not installed, use full installer instead:
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/main/vps-install.sh | sudo bash
```

**Services Not Starting:**
```bash
# Check logs
sudo journalctl -u gulf-telecom-backend -n 50
sudo journalctl -u gulf-telecom-frontend -n 50

# Check if ports are in use
sudo netstat -tlnp | grep -E '3000|3001'
```

**Can't Access Dashboard:**
```bash
# Check firewall
sudo ufw status

# Check if services are running
sudo systemctl status gulf-telecom-frontend

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## Important Files

### Application
- **Directory:** /opt/gulf-telecom
- **Environment:** /opt/gulf-telecom/.env
- **Logs:** Use `journalctl -u gulf-telecom-backend`

### Asterisk
- **Config Directory:** /etc/asterisk
- **SIP Config:** /etc/asterisk/sip.conf
- **Dialplan:** /etc/asterisk/extensions.conf
- **AMI Config:** /etc/asterisk/manager.conf

### Systemd Services
- **Backend:** /etc/systemd/system/gulf-telecom-backend.service
- **Frontend:** /etc/systemd/system/gulf-telecom-frontend.service

---

## Access URLs

After installation:

- **Dashboard:** http://167.172.170.88
- **Backend API:** http://167.172.170.88:3001/api
- **Health Check:** http://167.172.170.88:3001/api/health
- **WebSocket:** ws://167.172.170.88:3001

---

## Summary

**Your VPS:** 167.172.170.88  
**Command to run:** 
```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/main/vps-install-quick.sh | sudo bash
```

**Time:** 5-10 minutes  
**Result:** Complete working system with 8 SIP trunks configured!

---

## Need More Help?

- **Quick Commands:** VPS_QUICK_COMMANDS.md
- **Full Setup Guide:** VPS_SETUP.md
- **Troubleshooting:** SETUP_CHECKLIST.md
- **API Reference:** API.md

---

**Just run the command above on your VPS and you'll be ready to receive calls in 10 minutes!** 🚀
