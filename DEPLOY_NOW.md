# 🚀 Deploy NOW - Working Commands

## Your VPS Setup (Asterisk Already Installed)

Since Asterisk is already installed on your VPS, use these **WORKING** commands:

---

## ✅ Method 1: Direct Install (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/copilot/build-asterisk-inbound-sip/vps-install-quick.sh | sudo bash
```

**Time:** 5-10 minutes  
**What it does:** Installs Node.js, MongoDB, application, configures everything

---

## ✅ Method 2: Clone & Run (RECOMMENDED)

This method is more reliable and lets you see the files:

```bash
# Step 1: Clone the repository with the correct branch
git clone -b copilot/build-asterisk-inbound-sip https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git

# Step 2: Go into the directory
cd Gulf-Premium-Telecom

# Step 3: Run the quick installer
sudo ./vps-install-quick.sh
```

**Time:** 5-10 minutes  
**Benefit:** You can see all files and modify if needed

---

## What Will Be Installed

1. ✅ Node.js 18.x (if not present)
2. ✅ MongoDB 6.0 (if not present)
3. ✅ Gulf Telecom Application (backend + frontend)
4. ✅ 8 SIP Trunk Configurations for your IP (167.172.170.88)
5. ✅ Firewall Rules (UFW)
6. ✅ Systemd Services (auto-start on boot)
7. ✅ Nginx Reverse Proxy
8. ✅ All Dependencies

---

## After Installation

### Access Your System
```
Dashboard:    http://167.172.170.88
Backend API:  http://167.172.170.88:3001/api
Health Check: http://167.172.170.88:3001/api/health
```

### Verify Installation
```bash
# Check all services are running
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend

# Check SIP trunks (should show 8)
sudo asterisk -rx "sip show peers" | grep supplier

# View logs
sudo journalctl -u gulf-telecom-backend -f
```

---

## Troubleshooting

### If curl gives 404 error
Use Method 2 (Clone & Run) - it's more reliable!

### If git not installed
```bash
sudo apt update
sudo apt install -y git
```

### If script fails
Check the logs:
```bash
# If using Method 1 (curl), there won't be logs
# Use Method 2 instead to see detailed output

# If using Method 2, the script shows detailed output
# Look for RED error messages
```

### Get Help
The script will show detailed error messages. Common issues:
- Asterisk not running: `sudo systemctl start asterisk`
- Not enough disk space: `df -h`
- Not enough memory: `free -h`

---

## Next Steps After Install

1. **Access Dashboard**
   - Open browser to http://167.172.170.88
   - You should see the Gulf Telecom dashboard

2. **Contact Suppliers**
   - Give them your IP: 167.172.170.88
   - Ask them to whitelist your server
   - Request test calls

3. **Monitor Logs**
   ```bash
   sudo journalctl -u gulf-telecom-backend -f
   ```

4. **Watch Asterisk**
   ```bash
   sudo asterisk -rvvv
   ```

---

## Your 8 Configured SIP Trunks

After installation, these trunks will be configured:

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

## Important Notes

### Branch Information
These files are currently on the `copilot/build-asterisk-inbound-sip` branch, not on `main` yet. That's why you need to specify the branch when cloning or use the full branch URL for curl.

### Why This Happened
You tried:
```bash
# This doesn't work (404 error):
curl ...Gulf-Premium-Telecom/main/vps-install-quick.sh

# This works:
curl ...Gulf-Premium-Telecom/copilot/build-asterisk-inbound-sip/vps-install-quick.sh
```

### Once Merged to Main
After the PR is merged, you'll be able to use the shorter URL:
```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/main/vps-install-quick.sh | sudo bash
```

But for now, use the commands shown above! ✅

---

## Quick Reference

### Connect to VPS
```bash
ssh root@167.172.170.88
```

### Run Installation (Choose One)
```bash
# Method 1: Direct curl
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/copilot/build-asterisk-inbound-sip/vps-install-quick.sh | sudo bash

# Method 2: Clone first (RECOMMENDED)
git clone -b copilot/build-asterisk-inbound-sip https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom
sudo ./vps-install-quick.sh
```

### Access Dashboard
```bash
http://167.172.170.88
```

---

**Ready to deploy? Run the commands above!** 🚀
