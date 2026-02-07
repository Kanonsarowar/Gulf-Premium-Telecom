# Asterisk Setup Checklist for Gulf Premium Telecom

**Server IP:** 167.172.170.88

Use this checklist to verify your Asterisk installation and configuration status.

## 1. System Requirements

### Check System Status
```bash
# Check OS version
cat /etc/os-release

# Check available memory
free -h

# Check disk space
df -h

# Check network connectivity
ping -c 4 8.8.8.8
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 2. Asterisk Installation

### Verify Asterisk is Installed
```bash
# Check Asterisk version
asterisk -V

# Should show: Asterisk 16.x or higher
```

**Expected Output:** `Asterisk 16.x.x` or `Asterisk 18.x.x` or `Asterisk 20.x.x`

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Check Asterisk Service
```bash
# Check if Asterisk is running
systemctl status asterisk

# Should show: active (running)
```

**Expected Status:** `active (running)`

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Verify Asterisk Console Access
```bash
# Connect to Asterisk console
asterisk -rvvv

# Should connect without errors
# Type 'exit' to leave console
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 3. Configuration Files

### Check Configuration Directory
```bash
# List Asterisk configuration files
ls -la /etc/asterisk/

# Should show: manager.conf, sip.conf, extensions.conf, etc.
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Verify manager.conf (AMI Configuration)
```bash
# Check if manager.conf exists and has content
cat /etc/asterisk/manager.conf | grep -A 10 "\[general\]"
```

**Required Settings:**
- [ ] `enabled = yes`
- [ ] Manager user configured (e.g., `[admin]`)
- [ ] Password set (`secret = your_password`)
- [ ] Appropriate permissions (`read = ...`, `write = ...`)

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Verify sip.conf (SIP Configuration)
```bash
# Check if sip.conf exists
ls -l /etc/asterisk/sip.conf

# View general section
asterisk -rx "sip show settings" | head -20
```

**Required Settings:**
- [ ] `bindport=5060`
- [ ] `bindaddr=0.0.0.0` or specific IP
- [ ] Codecs enabled: `allow=ulaw`, `allow=alaw`, `allow=gsm`, `allow=g729`
- [ ] SIP trunks configured (8 trunks for suppliers)

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Check Current SIP Peers/Trunks
```bash
# List all configured SIP peers
asterisk -rx "sip show peers"
```

**Current Trunks:** (List what you see)
- [ ] supplier1-trunk1 (108.61.70.46)
- [ ] supplier1-trunk2 (157.90.193.196)
- [ ] supplier1-trunk3 (51.77.77.223)
- [ ] supplier1-trunk4 (95.217.90.212)
- [ ] supplier2-aws1 (52.28.165.40)
- [ ] supplier2-aws2 (52.57.172.184)
- [ ] supplier2-aws3 (35.156.119.128)
- [ ] supplier3-quintum (149.12.160.10)

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Verify extensions.conf (Dialplan)
```bash
# Check if extensions.conf exists
ls -l /etc/asterisk/extensions.conf

# View dialplan contexts
asterisk -rx "dialplan show"
```

**Required Contexts:**
- [ ] `[from-trunk]` - Standard inbound context
- [ ] `[from-trunk-e164]` - E.164 format context (for Quintum)
- [ ] `[ivr-main]` - IVR menu
- [ ] `[internal]` - Internal extensions

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 4. Codec Support

### Check Installed Codecs
```bash
# List all available codecs
asterisk -rx "core show codecs"
```

**Required Codecs:**
- [ ] `ulaw` (G.711 µ-law)
- [ ] `alaw` (G.711 A-law)
- [ ] `gsm` (GSM)
- [ ] `g729` (G.729) - May require license or separate installation

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### G.729 Codec Installation (if needed)
```bash
# Check if G.729 is available
asterisk -rx "core show translation" | grep g729

# If not available, may need to install
# Commercial: Digium G.729 codec
# Open source alternatives available
```

**G.729 Status:** [ ] Installed [ ] Not Installed [ ] Not Required

---

## 5. Network Configuration

### Check Firewall Rules
```bash
# Check UFW status
sudo ufw status numbered

# OR check iptables
sudo iptables -L -n -v | grep 5060
```

**Required Firewall Rules:**
- [ ] Port 5060/UDP open for SIP signaling
- [ ] Ports 10000-20000/UDP open for RTP media
- [ ] Supplier IPs whitelisted (8 IPs)

**Supplier IPs to Whitelist:**
```
108.61.70.46
157.90.193.196
51.77.77.223
95.217.90.212
52.28.165.40
52.57.172.184
35.156.119.128
149.12.160.10
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Verify IP Address Configuration
```bash
# Check your public IP
curl -s ifconfig.me

# Should show: 167.172.170.88
```

**Your IP:** ___________________

**Status:** [ ] Confirmed [ ] Different IP

### Check NAT Configuration
```bash
# View NAT settings in sip.conf
grep -i nat /etc/asterisk/sip.conf
```

**Required Settings:**
- [ ] `nat=force_rport,comedia` (in general or per-trunk)

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 6. MongoDB Database

### Check MongoDB Installation
```bash
# Check MongoDB version
mongod --version

# Check MongoDB service
systemctl status mongod
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Verify Database Connection
```bash
# Test MongoDB connection
mongo --eval "db.version()"

# Test application database
mongo gulf_premium_telecom --eval "db.calls.count()"
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 7. Node.js Backend

### Check Node.js Installation
```bash
# Check Node.js version
node --version

# Should be v16 or higher
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Check Backend Server
```bash
# Check if backend is running
ps aux | grep "node.*server"

# OR check with PM2
pm2 list
```

**Status:** [ ] Running [ ] Not Running [ ] Not Started

### Test AMI Connection
```bash
# Check if backend can connect to Asterisk AMI
curl http://localhost:3001/health

# Should show: {"status":"ok","asterisk":"connected"}
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 8. Testing and Verification

### Test SIP Registration
```bash
# Check trunk status
asterisk -rx "sip show peers"

# All trunks should show IP and port (some may show UNKNOWN if not registered yet)
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Test Inbound Call Routing
```bash
# Monitor Asterisk console
asterisk -rvvv

# Enable SIP debugging
sip set debug on

# Request test call from supplier
# Should see INVITE message and call routing
```

**Test Calls Status:**
- [ ] Supplier Group 1 (test from any of 4 IPs)
- [ ] Supplier Group 2 (AWS - test from any of 3 IPs)
- [ ] Supplier Group 3 (Quintum - test E.164 format)

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Test IVR Menu
```bash
# Make test call and verify:
# 1. Call is answered
# 2. IVR menu plays
# 3. DTMF options work (press 1, 2, 3, 9, 0)
# 4. Call routes to correct extension
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

### Check Call Logging
```bash
# Verify calls are logged in database
mongo gulf_premium_telecom --eval "db.calls.find().limit(5).pretty()"

# Check Asterisk CDR
asterisk -rx "cdr show status"
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 9. Security

### SSL/TLS Configuration
```bash
# Check if using SIP over TLS (optional)
grep -i "tlsenable" /etc/asterisk/sip.conf
```

**Status:** [ ] Enabled [ ] Not Enabled [ ] Not Required

### Fail2ban Configuration (Recommended)
```bash
# Check if fail2ban is installed
systemctl status fail2ban

# Check Asterisk-specific jails
fail2ban-client status asterisk
```

**Status:** [ ] Complete [ ] In Progress [ ] Not Started

---

## 10. Monitoring and Logs

### Check Asterisk Logs
```bash
# View full log
tail -f /var/log/asterisk/full

# View messages log
tail -f /var/log/asterisk/messages
```

**Log Location:** ___________________

**Status:** [ ] Configured [ ] Need to Configure

### Check System Resources
```bash
# Monitor CPU and memory during calls
top

# Check call statistics
asterisk -rx "core show channels"
```

**Status:** [ ] Monitoring Setup [ ] Need to Setup

---

## Quick Commands Reference

### Reload Configurations
```bash
# Reload SIP configuration
asterisk -rx "sip reload"

# Reload dialplan
asterisk -rx "dialplan reload"

# Reload manager configuration
asterisk -rx "manager reload"

# Complete reload (use carefully)
asterisk -rx "core reload"
```

### Restart Services
```bash
# Restart Asterisk
systemctl restart asterisk

# Restart backend
pm2 restart gulf-telecom-backend

# Restart frontend
pm2 restart gulf-telecom-frontend
```

### Debug Commands
```bash
# Enable SIP debugging
asterisk -rx "sip set debug on"

# Disable SIP debugging
asterisk -rx "sip set debug off"

# Enable dialplan debugging
asterisk -rx "dialplan set debug on"

# Monitor RTP traffic
asterisk -rx "rtp set debug on"
```

---

## Summary Checklist

### Critical Items (Must Complete)
- [ ] Asterisk installed and running
- [ ] manager.conf configured with AMI enabled
- [ ] sip.conf configured with 8 supplier trunks
- [ ] extensions.conf with from-trunk and IVR contexts
- [ ] Firewall allows traffic from supplier IPs
- [ ] Codecs enabled (especially G.729 if required)
- [ ] MongoDB installed and running
- [ ] Backend server running and connected to AMI

### Important Items (Should Complete)
- [ ] Test calls from each supplier successful
- [ ] IVR menu working correctly
- [ ] Calls logged in database
- [ ] NAT configuration correct
- [ ] Security measures in place (fail2ban)

### Optional Items (Nice to Have)
- [ ] SSL/TLS for SIP
- [ ] Advanced monitoring tools
- [ ] Backup procedures
- [ ] Load testing completed

---

## Next Steps

Based on what you've completed:

1. **If Asterisk is not installed**: Follow INSTALLATION.md
2. **If Asterisk is installed but not configured**: Copy configuration files from `asterisk-config/` directory
3. **If Asterisk is configured**: Run `setup-trunks.sh` to add the new supplier trunks
4. **If everything is ready**: Request test calls from suppliers

---

## Need Help?

### Configuration Files in This Repo
- `asterisk-config/sip.conf` - Pre-configured with 8 supplier trunks
- `asterisk-config/extensions.conf` - Dialplan with IVR and E.164 support
- `asterisk-config/manager.conf` - AMI configuration
- `setup-trunks.sh` - Automated setup script
- `TRUNK_CONFIG.md` - Detailed trunk documentation

### Support Commands
```bash
# Show Asterisk version and build
asterisk -rx "core show version"

# Show system information
asterisk -rx "core show sysinfo"

# Show uptime
asterisk -rx "core show uptime"
```

### Contact
- Repository: https://github.com/Kanonsarowar/Gulf-Premium-Telecom
- Documentation: See README.md, INSTALLATION.md, TRUNK_CONFIG.md
