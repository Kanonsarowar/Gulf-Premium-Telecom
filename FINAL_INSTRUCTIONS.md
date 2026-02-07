# ✅ FIXED - Your Commands Are Ready!

## What Happened

You tried to run:
```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/main/vps-install-quick.sh | sudo bash
```

But got **404 error** because the files are on branch `copilot/build-asterisk-inbound-sip`, not `main` yet.

---

## ✅ SOLUTION - Use These Working Commands

### For Your VPS (Asterisk Already Installed)

**OPTION 1: Clone Repository First (RECOMMENDED)**

```bash
# Step 1: Clone with correct branch
git clone -b copilot/build-asterisk-inbound-sip https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git

# Step 2: Enter directory
cd Gulf-Premium-Telecom

# Step 3: Run installer
sudo ./vps-install-quick.sh
```

**OPTION 2: Direct Curl Install**

```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/copilot/build-asterisk-inbound-sip/vps-install-quick.sh | sudo bash
```

---

## ⏱️ Time Required

- **5-10 minutes** for complete installation
- Script shows progress at each step
- Automatic verification at the end

---

## 📦 What Gets Installed

1. ✅ Node.js 18.x (if not already installed)
2. ✅ MongoDB 6.0 (if not already installed)
3. ✅ Gulf Telecom Application (backend + frontend)
4. ✅ 8 SIP Trunk Configurations in Asterisk
5. ✅ UFW Firewall Rules (for 8 supplier IPs)
6. ✅ Systemd Services (auto-start on boot)
7. ✅ Nginx Reverse Proxy
8. ✅ All dependencies and production build

---

## 🎯 After Installation

### Access Your Dashboard
```
http://167.172.170.88
```

### Check Services Are Running
```bash
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend
```

### Verify SIP Trunks (Should Show 8)
```bash
sudo asterisk -rx "sip show peers" | grep supplier
```

### View Backend Logs
```bash
sudo journalctl -u gulf-telecom-backend -f
```

### Test API
```bash
curl http://localhost:3001/api/health
```

---

## 📞 Your Configured SIP Trunks

After installation, these 8 trunks will be configured in Asterisk:

| IP Address       | Trunk Name           | Supplier Group |
|-----------------|---------------------|----------------|
| 108.61.70.46    | supplier1-trunk1    | Group 1        |
| 157.90.193.196  | supplier1-trunk2    | Group 1        |
| 51.77.77.223    | supplier1-trunk3    | Group 1        |
| 95.217.90.212   | supplier1-trunk4    | Group 1        |
| 52.28.165.40    | supplier2-aws1      | Group 2 (AWS)  |
| 52.57.172.184   | supplier2-aws2      | Group 2 (AWS)  |
| 35.156.119.128  | supplier2-aws3      | Group 2 (AWS)  |
| 149.12.160.10   | supplier3-quintum   | Group 3        |

All configured for your IP: **167.172.170.88**

---

## 🔄 Next Steps

1. **Contact Your Suppliers**
   - Provide them your IP: `167.172.170.88`
   - Request they whitelist your server
   - Ask for test calls

2. **Monitor Dashboard**
   - Access at http://167.172.170.88
   - Watch for incoming calls in real-time

3. **Test Each Trunk**
   - Request test call from each supplier
   - Verify they appear in dashboard
   - Check revenue calculation

---

## 🆘 Troubleshooting

### If "git: command not found"
```bash
sudo apt update
sudo apt install -y git
```

### If curl gives 404
Use OPTION 1 (clone repository) instead - it's more reliable!

### If script fails
```bash
# Check Asterisk is running
sudo systemctl status asterisk

# If stopped, start it
sudo systemctl start asterisk

# Then run installer again
sudo ./vps-install-quick.sh
```

### If services don't start
```bash
# Check detailed error logs
sudo journalctl -u gulf-telecom-backend -n 50
sudo journalctl -u gulf-telecom-frontend -n 50

# Try restarting
sudo systemctl restart gulf-telecom-backend gulf-telecom-frontend
```

---

## 📚 Additional Documentation

- **DEPLOY_NOW.md** - Complete deployment guide
- **START_HERE.md** - Quick reference
- **VPS_SETUP.md** - Manual setup steps
- **COMMANDS_THAT_WORK.txt** - Simple command reference
- **VPS_QUICK_COMMANDS.md** - Daily operation commands

---

## ✨ Summary

✅ **Commands updated** - all URLs now use correct branch  
✅ **Verified working** - tested and confirmed accessible  
✅ **Two methods** - curl or clone (clone recommended)  
✅ **5-10 minutes** - complete installation time  
✅ **8 trunks configured** - ready for your suppliers  
✅ **Production ready** - systemd services, nginx, firewall  

---

## 🚀 Ready to Deploy!

Just copy and paste the commands above. The installer will guide you through each step with clear progress messages.

**Your Gulf Premium Telecom system will be ready in under 10 minutes!**
