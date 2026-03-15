# Fix for Installation Errors

## Your Issue

You encountered these errors:
```
cannot stat '/opt/gulf-telecom/asterisk-config/sip.conf': No such file or directory
Unit gulf-telecom-backend.service could not be found.
Unit gulf-telecom-frontend.service could not be found.
```

## Why It Happened

The installation script expected the repository to be at `/opt/gulf-telecom/` but you cloned it to `~/Gulf-Premium-Telecom`. The paths didn't match.

## Simple Solution

We've created a new script that works from your current directory!

### Steps to Fix:

1. **Make sure you're in the repository directory:**
   ```bash
   cd ~/Gulf-Premium-Telecom
   ```

2. **Run the new installation script:**
   ```bash
   sudo ./install-from-here.sh
   ```

That's it! The script will:
- ✅ Detect it's running from your cloned directory
- ✅ Install Node.js if needed
- ✅ Install MongoDB if needed  
- ✅ Configure Asterisk with your 8 SIP trunks
- ✅ Set up firewall
- ✅ Install all dependencies
- ✅ Build the frontend
- ✅ Create systemd services (using the correct path!)
- ✅ Configure Nginx
- ✅ Start everything

## After Installation

### Verify Services Are Running
```bash
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend
```

Should show both services as **active (running)** ✅

### Check SIP Trunks
```bash
sudo asterisk -rx "sip show peers" | grep supplier
```

Should show your 8 configured trunks

### Access Dashboard
```
http://167.172.170.88
```

### View Logs
```bash
# Backend logs
sudo journalctl -u gulf-telecom-backend -f

# Frontend logs  
sudo journalctl -u gulf-telecom-frontend -f
```

## If You Still Have Issues

### Clean Up Old Attempts
```bash
# Remove any partially created services
sudo systemctl stop gulf-telecom-backend 2>/dev/null
sudo systemctl stop gulf-telecom-frontend 2>/dev/null
sudo systemctl disable gulf-telecom-backend 2>/dev/null
sudo systemctl disable gulf-telecom-frontend 2>/dev/null
sudo rm /etc/systemd/system/gulf-telecom-*.service 2>/dev/null
sudo systemctl daemon-reload

# Then run the install script again
cd ~/Gulf-Premium-Telecom
sudo ./install-from-here.sh
```

## Your 8 Configured Trunks

After successful installation, these trunks will be configured:

- **108.61.70.46** → supplier1-trunk1
- **157.90.193.196** → supplier1-trunk2
- **51.77.77.223** → supplier1-trunk3
- **95.217.90.212** → supplier1-trunk4
- **52.28.165.40** → supplier2-aws1
- **52.57.172.184** → supplier2-aws2
- **35.156.119.128** → supplier2-aws3
- **149.12.160.10** → supplier3-quintum

All configured for your IP: **167.172.170.88**

## Next Steps After Installation

1. **Verify everything is running** (commands above)
2. **Contact your suppliers** - give them your IP: 167.172.170.88
3. **Request test calls** from each supplier
4. **Monitor your dashboard** at http://167.172.170.88

## Need Help?

If the installation still fails, check logs:
```bash
# Backend errors
sudo journalctl -u gulf-telecom-backend -n 100

# Frontend errors
sudo journalctl -u gulf-telecom-frontend -n 100

# Asterisk errors
sudo asterisk -rx "core show channels"
```

---

**The key fix:** Use `./install-from-here.sh` instead of the other scripts. This one works from your current directory! 🎯
