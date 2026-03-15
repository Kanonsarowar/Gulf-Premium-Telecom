# Post-Installation Guide

## 🎉 Congratulations!

Your Gulf Premium Telecom system has been successfully installed and is now running on your VPS at **167.172.170.88**.

---

## Quick Verification

### Check Services Are Running
```bash
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend
```

Both should show: `Active: active (running)` ✅

### Check SIP Trunks
```bash
sudo asterisk -rx "sip show peers" | grep supplier
```

Should show: **8 supplier trunks** ✅

### Access Dashboard
```bash
curl http://167.172.170.88
```

Or open in browser: **http://167.172.170.88**

Should load the Gulf Telecom Dashboard ✅

---

## System Access Points

### Web Interfaces
- **Dashboard:** http://167.172.170.88
- **Backend API:** http://167.172.170.88:3001/api
- **Health Check:** http://167.172.170.88:3001/api/health

### Dashboard Views
1. **Real-time Dashboard** - Active calls, today's stats, trends
2. **Active Calls** - Monitor and control active calls
3. **Revenue Analytics** - Revenue breakdown and top callers
4. **Call History** - Complete call records with search

---

## Next Steps

### 1. Contact Your Suppliers (IMPORTANT!)

You need to provide your IP address to all 8 suppliers so they can send calls to you.

**Your IP Address:** `167.172.170.88`

**Your 8 Configured Trunks:**

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

**Email Template:**
```
Subject: SIP Trunk Configuration - Gulf Premium Telecom

Dear [Supplier Name],

Please configure our SIP trunk with the following details:

Destination IP: 167.172.170.88
Port: 5060
Protocol: UDP
Codecs: G.729, G.711 (ulaw/alaw), GSM
Format: E.164 (for Quintum)

Our system is now operational and ready to receive calls.
Please send test calls to verify connectivity.

Best regards,
[Your Name]
Gulf Premium Telecom
```

### 2. Request Test Calls

After contacting suppliers, ask them to send test calls:
- Monitor the dashboard at http://167.172.170.88
- Watch for incoming calls in real-time
- Test the IVR menu (options 1, 2, 3)
- Verify call data appears in dashboard

### 3. Monitor Your System

**Watch Backend Logs:**
```bash
sudo journalctl -u gulf-telecom-backend -f
```

**Watch Asterisk Console:**
```bash
sudo asterisk -rvvv
```

**Enable SIP Debug (for testing):**
```bash
sudo asterisk -rx "sip set debug on"
# When done testing:
sudo asterisk -rx "sip set debug off"
```

---

## Dashboard Features

### Real-time Dashboard (Main View)
- **Active Calls Counter** - Live count of ongoing calls
- **Today's Statistics** - Calls, revenue, averages
- **Active Calls Table** - Current calls with details
- **Recent Calls** - Last completed calls
- **7-Day Trend** - Chart showing call volume

### Active Calls View
- Monitor all active calls
- View call timeline and events
- See IVR selections made by callers
- Remote hangup control for active calls

### Revenue Analytics
- Daily revenue summary
- Hourly revenue breakdown chart
- Top 10 callers by revenue
- Average revenue per call
- Performance metrics

### Call History
- Paginated call records
- Search and filter capabilities
- Detailed call information modal
- Complete event timeline for each call

---

## Daily Operations

### Service Management

**Check Status:**
```bash
sudo systemctl status gulf-telecom-backend
sudo systemctl status gulf-telecom-frontend
sudo systemctl status mongod
sudo systemctl status asterisk
sudo systemctl status nginx
```

**Restart Services:**
```bash
sudo systemctl restart gulf-telecom-backend
sudo systemctl restart gulf-telecom-frontend
```

**View Logs:**
```bash
# Backend logs
sudo journalctl -u gulf-telecom-backend -f

# Frontend logs
sudo journalctl -u gulf-telecom-frontend -f

# All logs
sudo journalctl -u gulf-telecom-* -f
```

### Asterisk Commands

**Enter Console:**
```bash
sudo asterisk -rvvv
```

**Common Commands:**
```bash
# Check SIP peers
sudo asterisk -rx "sip show peers"

# Check active channels
sudo asterisk -rx "core show channels"

# Reload dialplan
sudo asterisk -rx "dialplan reload"

# Reload SIP
sudo asterisk -rx "sip reload"

# Show calls
sudo asterisk -rx "core show calls"
```

### Database Operations

**Connect to MongoDB:**
```bash
mongosh
```

**Database Commands:**
```javascript
// Use database
use gulf-telecom

// Count calls
db.calls.countDocuments()

// View recent calls
db.calls.find().sort({startTime: -1}).limit(10).pretty()

// View today's calls
db.calls.find({
  startTime: {$gte: new Date(new Date().setHours(0,0,0,0))}
}).count()

// Calculate revenue
db.calls.aggregate([
  {$match: {revenue: {$exists: true}}},
  {$group: {_id: null, total: {$sum: "$revenue"}}}
])
```

---

## Monitoring & Maintenance

### Daily Tasks
- ✅ Check service status
- ✅ Review dashboard statistics
- ✅ Monitor for errors in logs
- ✅ Verify all trunks are reachable

### Weekly Tasks
- ✅ Review revenue reports
- ✅ Check disk space: `df -h`
- ✅ Review supplier performance
- ✅ Check for system updates
- ✅ Review call quality metrics

### Monthly Tasks
- ✅ Backup MongoDB database
- ✅ Review security logs
- ✅ Update system packages
- ✅ Performance review and optimization
- ✅ Review and rotate logs

---

## Backup Procedures

### Backup MongoDB Database

**Manual Backup:**
```bash
# Create backup directory
sudo mkdir -p /backup/mongodb

# Dump database
sudo mongodump --db gulf-telecom --out /backup/mongodb/$(date +%Y%m%d)

# Compress backup
cd /backup/mongodb
sudo tar -czf gulf-telecom-$(date +%Y%m%d).tar.gz $(date +%Y%m%d)
```

**Restore from Backup:**
```bash
# Extract backup
cd /backup/mongodb
sudo tar -xzf gulf-telecom-YYYYMMDD.tar.gz

# Restore
sudo mongorestore --db gulf-telecom YYYYMMDD/gulf-telecom
```

### Backup Configuration Files

```bash
# Create backup
sudo tar -czf ~/gulf-telecom-config-backup.tar.gz \
  /etc/asterisk/sip.conf \
  /etc/asterisk/extensions.conf \
  /etc/asterisk/manager.conf \
  ~/Gulf-Premium-Telecom/.env

# Restore (if needed)
sudo tar -xzf ~/gulf-telecom-config-backup.tar.gz -C /
```

---

## Performance Optimization

### Monitor Resource Usage

```bash
# CPU and Memory
htop

# Disk usage
df -h
du -sh /var/lib/mongodb

# Network
sudo iftop

# Asterisk statistics
sudo asterisk -rx "core show uptime"
sudo asterisk -rx "core show channels count"
```

### Optimize MongoDB

```bash
# Compact database (monthly)
mongosh
use gulf-telecom
db.runCommand({compact: 'calls'})

# Add indexes (if not exist)
db.calls.createIndex({startTime: -1})
db.calls.createIndex({callerNumber: 1})
db.calls.createIndex({status: 1})
```

---

## Security Best Practices

### Update Passwords

**Change AMI Password:**
```bash
sudo nano /etc/asterisk/manager.conf
# Change the secret= line
sudo asterisk -rx "manager reload"
```

**Update .env File:**
```bash
cd ~/Gulf-Premium-Telecom
nano .env
# Update ASTERISK_AMI_PASSWORD
sudo systemctl restart gulf-telecom-backend
```

### Firewall Management

**Check Firewall Status:**
```bash
sudo ufw status numbered
```

**Add/Remove IPs:**
```bash
# Add new supplier IP
sudo ufw allow from NEW_IP to any port 5060 proto udp

# Remove IP
sudo ufw delete RULE_NUMBER
```

### Regular Updates

```bash
# Update system
sudo apt update
sudo apt upgrade

# Update Node.js packages (if needed)
cd ~/Gulf-Premium-Telecom
npm update
cd client && npm update
```

---

## Troubleshooting

### Services Not Starting

**Backend Issues:**
```bash
# Check logs
sudo journalctl -u gulf-telecom-backend -n 100

# Common issues:
# - MongoDB not running: sudo systemctl start mongod
# - Asterisk not running: sudo systemctl start asterisk
# - Port already in use: sudo netstat -tlnp | grep 3001
```

**Frontend Issues:**
```bash
# Check logs
sudo journalctl -u gulf-telecom-frontend -n 100

# Rebuild if needed
cd ~/Gulf-Premium-Telecom/client
npm run build
sudo systemctl restart gulf-telecom-frontend
```

### No Calls Coming In

1. **Verify Trunks:**
   ```bash
   sudo asterisk -rx "sip show peers"
   # All 8 should show "OK"
   ```

2. **Check Firewall:**
   ```bash
   sudo ufw status | grep 5060
   # Should show 8 supplier IPs allowed
   ```

3. **Enable SIP Debug:**
   ```bash
   sudo asterisk -rx "sip set debug on"
   # Watch for INVITE messages
   ```

4. **Verify Suppliers:**
   - Confirm they have your IP whitelisted
   - Ask them to send test calls
   - Check their trunk status on their end

### Dashboard Not Loading

1. **Check Services:**
   ```bash
   sudo systemctl status gulf-telecom-frontend nginx
   ```

2. **Check Ports:**
   ```bash
   sudo netstat -tlnp | grep -E '(3000|80)'
   ```

3. **Check Nginx Config:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Database Issues

1. **Check MongoDB:**
   ```bash
   sudo systemctl status mongod
   ```

2. **Check Connection:**
   ```bash
   mongosh
   # If connects, MongoDB is running
   ```

3. **Check Disk Space:**
   ```bash
   df -h
   # MongoDB needs free disk space
   ```

---

## API Integration

### Available Endpoints

**Calls:**
- `GET /api/calls` - Get all calls (paginated)
- `GET /api/calls/active` - Get active calls
- `GET /api/calls/:id` - Get specific call
- `POST /api/calls/:id/hangup` - Hangup a call

**Revenue:**
- `GET /api/revenue/today` - Today's revenue
- `GET /api/revenue/hourly` - Hourly breakdown
- `GET /api/revenue/top-callers` - Top callers by revenue

**System:**
- `GET /api/health` - Health check

See **API.md** for complete documentation with examples.

---

## Support & Resources

### Documentation Files
- **API.md** - Complete API reference
- **ARCHITECTURE.md** - System architecture
- **TRUNK_CONFIG.md** - SIP trunk configuration
- **SECURITY.md** - Security guide
- **FAQ.md** - Frequently asked questions
- **DAILY_OPERATIONS.md** - Daily operations manual

### Quick References
- **VPS_QUICK_COMMANDS.md** - Common commands
- **SUCCESS_CHECKLIST.txt** - Verification checklist
- **USER_GUIDE_SUMMARY.txt** - Complete overview

### Getting Help
- Check FAQ.md for common questions
- Review troubleshooting sections
- Check logs for error messages
- Verify configuration files

---

## Summary

### ✅ What's Working
- Backend server running on port 3001
- Frontend dashboard running on port 3000
- MongoDB database storing call data
- Asterisk with 8 SIP trunks configured
- Nginx reverse proxy
- Firewall configured for 8 suppliers
- Auto-start services enabled

### 📋 Your Next Actions
1. Contact all 8 suppliers with your IP (167.172.170.88)
2. Request test calls from each supplier
3. Monitor dashboard for incoming calls
4. Verify IVR functionality
5. Check call data is being stored
6. Review revenue calculations

### 🎯 Goals
- Receive test calls from all suppliers
- Verify system handles calls correctly
- Monitor for 24-48 hours
- Begin production operations
- Start generating revenue!

---

**Your Gulf Premium Telecom system is ready! Contact your suppliers and start receiving calls!** 🎉📞💰

For any issues, refer to the troubleshooting section or check the documentation files.

**Good luck with your telecommunications business!** 🚀
