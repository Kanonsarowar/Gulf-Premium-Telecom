# DEPLOYMENT GUIDE
# Gulf Premium Telecom - Asterisk IPRN

## Pre-Deployment Checklist

### 1. System Requirements Verification

```bash
# Check OS version
cat /etc/os-release

# Check Asterisk version
asterisk -V

# Check available disk space (need at least 10GB for logs/recordings)
df -h

# Check available memory (need at least 4GB)
free -h

# Check CPU cores
nproc
```

### 2. Network Requirements

- [ ] Public IP address configured
- [ ] DNS resolution working
- [ ] NTP time synchronization configured
- [ ] Network latency < 100ms to upstream providers

### 3. Firewall Ports

Open these ports:

**Inbound**:
- UDP 5060 (SIP signaling from upstream)
- UDP 10000-20000 (RTP media)
- TCP 5038 (AMI - only from trusted IPs)

**Outbound**:
- UDP 5060 (SIP signaling to upstream)
- UDP 10000-20000 (RTP media)

## Deployment Steps

### Step 1: Backup Existing Configuration

```bash
# Create backup directory with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sudo mkdir -p /backup/asterisk_${TIMESTAMP}

# Backup current configuration
sudo cp -r /etc/asterisk /backup/asterisk_${TIMESTAMP}/

# Verify backup
ls -lah /backup/asterisk_${TIMESTAMP}/asterisk/

echo "Backup completed: /backup/asterisk_${TIMESTAMP}"
```

### Step 2: Stop Asterisk

```bash
# Stop Asterisk gracefully
sudo asterisk -rx "core stop gracefully"

# Wait for shutdown (max 30 seconds)
sleep 5

# Force stop if still running
sudo systemctl stop asterisk

# Verify it's stopped
sudo systemctl status asterisk
```

### Step 3: Deploy New Configuration

```bash
# Copy new configuration files
sudo cp -r asterisk/etc/asterisk/* /etc/asterisk/

# Set proper ownership
sudo chown -R asterisk:asterisk /etc/asterisk

# Set proper permissions (secure)
sudo chmod 750 /etc/asterisk
sudo chmod 640 /etc/asterisk/*.conf

# Verify permissions
ls -lah /etc/asterisk/
```

### Step 4: Configure Upstream Provider IPs

**CRITICAL**: Edit `/etc/asterisk/pjsip.conf` and replace example IPs with your actual upstream provider IPs.

```bash
sudo nano /etc/asterisk/pjsip.conf

# Find these sections and update:
# [upstream-provider-1-identify]
# match=YOUR_ACTUAL_UPSTREAM_IP_1
# match=YOUR_ACTUAL_UPSTREAM_IP_2
```

**Example**:
```ini
[upstream-provider-1-identify](upstream-identify-template)
endpoint=upstream-provider-1
match=203.0.113.10    # Production upstream IP
match=203.0.113.11    # Backup upstream IP
```

### Step 5: Configure NAT (if applicable)

If your Asterisk server is behind NAT, configure external addresses:

```bash
sudo nano /etc/asterisk/pjsip.conf

# Find [transport-udp] section and uncomment/set:
# external_media_address=YOUR_PUBLIC_IP
# external_signaling_address=YOUR_PUBLIC_IP
```

### Step 6: Configure DID Routing

Edit dialplan to route your actual DIDs:

```bash
sudo nano /etc/asterisk/extensions.conf

# Find [did-routing] context and configure your DIDs
```

**Example**:
```ini
[did-routing]
; Your actual Saudi DID
exten => _966501234567,1,NoOp(Sales Line)
same => n,Goto(queue-sales,s,1)

; Your support DID
exten => _966509876543,1,NoOp(Support Line)
same => n,Goto(queue-support,s,1)

; Catch-all for other DIDs
exten => _X.,1,NoOp(Unknown DID: ${EXTEN})
same => n,Goto(ivr-main,s,1)
```

### Step 7: Update Security Settings

**CRITICAL**: Change default AMI passwords:

```bash
sudo nano /etc/asterisk/manager.conf

# Change these passwords for ALL users:
# [asternic]
# secret=YOUR_SECURE_PASSWORD_HERE

# [admin]
# secret=YOUR_ADMIN_PASSWORD_HERE

# [monitoring]
# secret=YOUR_MONITOR_PASSWORD_HERE
```

**Generate strong passwords**:
```bash
# Generate 20-character random passwords
openssl rand -base64 20
```

### Step 8: Create Required Directories

```bash
# Create recording directory
sudo mkdir -p /var/spool/asterisk/monitor
sudo chown asterisk:asterisk /var/spool/asterisk/monitor
sudo chmod 755 /var/spool/asterisk/monitor

# Create MOH directory
sudo mkdir -p /var/lib/asterisk/moh
sudo chown asterisk:asterisk /var/lib/asterisk/moh
sudo chmod 755 /var/lib/asterisk/moh

# Create log directory (if not exists)
sudo mkdir -p /var/log/asterisk
sudo chown asterisk:asterisk /var/log/asterisk
sudo chmod 755 /var/log/asterisk
```

### Step 9: Validate Configuration Syntax

```bash
# Test PJSIP configuration syntax (dry run)
sudo asterisk -rx "pjsip show endpoints" 2>&1 | grep -i error

# Test dialplan syntax
sudo asterisk -rx "dialplan show" 2>&1 | grep -i error
```

### Step 10: Start Asterisk

```bash
# Start Asterisk
sudo systemctl start asterisk

# Wait for startup
sleep 5

# Check status
sudo systemctl status asterisk

# Connect to CLI
sudo asterisk -rvvv
```

### Step 11: Verify Configuration

Run these commands in Asterisk CLI:

```
# Check PJSIP transports
pjsip show transports

# Check PJSIP endpoints
pjsip show endpoints

# Check dialplan
dialplan show from-upstream
dialplan show did-routing

# Check queues
queue show

# Check modules
module show like pjsip
module show like res_rtp

# Check logging
logger show channels
```

Expected output:
- Transport should be CREATED and listening on 0.0.0.0:5060
- Endpoints should show your configured upstream providers
- Dialplan should show all your contexts
- Queues should be configured

### Step 12: Firewall Configuration

**Ubuntu/Debian (UFW)**:
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow SIP
sudo ufw allow 5060/udp

# Allow RTP
sudo ufw allow 10000:20000/udp

# Allow AMI only from localhost (if Asternic is on same server)
# No need to open 5038 externally

# Show rules
sudo ufw status verbose
```

**CentOS/RHEL (firewalld)**:
```bash
# Start firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow SIP
sudo firewall-cmd --permanent --add-port=5060/udp

# Allow RTP
sudo firewall-cmd --permanent --add-port=10000-20000/udp

# Reload
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

### Step 13: Enable Debug Logging (Initial Deployment)

For the first few days, enable detailed logging:

```bash
sudo nano /etc/asterisk/logger.conf

# Uncomment these lines:
# pjsip_debug => debug,notice,warning,error,verbose
# rtp_debug => debug,dtmf
```

Then reload:
```bash
sudo asterisk -rx "logger reload"
```

### Step 14: Test Inbound Call

Make a test call from your upstream provider:

**Monitor in real-time**:
```bash
# Terminal 1: Watch Asterisk console
sudo asterisk -rvvv

# Terminal 2: Watch full log
sudo tail -f /var/log/asterisk/full

# Terminal 3: Watch SIP traffic
sudo tcpdump -i any -n port 5060 -A

# Terminal 4: Watch RTP traffic
sudo tcpdump -i any -n udp portrange 10000-20000 -c 100
```

**Expected flow**:
1. INVITE received from upstream IP
2. Endpoint matched
3. Context: from-upstream
4. DID routing logic executed
5. Call answered
6. RTP established
7. Audio both ways

### Step 15: Verify CDR Logging

After test call:

```bash
# Check CDR file
sudo tail -20 /var/log/asterisk/cdr-csv/Master.csv

# Check queue log (if routed to queue)
sudo tail -20 /var/log/asterisk/queue_log
```

## Post-Deployment Monitoring

### First 24 Hours

Monitor these every hour:

```bash
# Active calls
sudo asterisk -rx "core show channels verbose"

# Call statistics
sudo asterisk -rx "core show channels" | tail -1

# System resources
top -p $(pgrep asterisk)

# Error logs
sudo grep -i error /var/log/asterisk/full | tail -20

# Warning logs
sudo grep -i warning /var/log/asterisk/full | tail -20
```

### First Week

Daily monitoring:

```bash
# Check log file sizes
sudo du -sh /var/log/asterisk/*

# Check CDR count
sudo wc -l /var/log/asterisk/cdr-csv/Master.csv

# Check for any 403/404 errors
sudo grep "403\|404" /var/log/asterisk/full | tail -20

# Memory usage
free -h

# Disk usage
df -h
```

### Setup Log Rotation

Create `/etc/logrotate.d/asterisk`:

```bash
sudo nano /etc/logrotate.d/asterisk
```

Add:
```
/var/log/asterisk/*log /var/log/asterisk/messages {
    daily
    rotate 30
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        /usr/sbin/asterisk -rx 'logger reload' > /dev/null 2>&1 || true
    endscript
}

/var/log/asterisk/cdr-csv/*.csv {
    daily
    rotate 90
    missingok
    notifempty
    compress
    delaycompress
}

/var/log/asterisk/queue_log {
    daily
    rotate 90
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        /usr/sbin/asterisk -rx 'logger reload' > /dev/null 2>&1 || true
    endscript
}
```

Test log rotation:
```bash
sudo logrotate -d /etc/logrotate.d/asterisk
```

## Rollback Procedure

If deployment fails:

```bash
# Stop Asterisk
sudo systemctl stop asterisk

# Restore backup (use your backup timestamp)
BACKUP_TIMESTAMP=20240101_120000
sudo rm -rf /etc/asterisk
sudo cp -r /backup/asterisk_${BACKUP_TIMESTAMP}/asterisk /etc/

# Set permissions
sudo chown -R asterisk:asterisk /etc/asterisk
sudo chmod 750 /etc/asterisk
sudo chmod 640 /etc/asterisk/*.conf

# Start Asterisk
sudo systemctl start asterisk

# Verify
sudo asterisk -rvvv
```

## Common Deployment Issues

### Issue 1: Asterisk Won't Start

**Check logs**:
```bash
sudo journalctl -xeu asterisk.service
sudo tail -50 /var/log/asterisk/messages
```

**Common causes**:
- Configuration syntax error
- Permission issues
- Port already in use
- Missing modules

**Fix**:
```bash
# Check syntax
sudo asterisk -rx "core show config mappings"

# Check permissions
ls -lah /etc/asterisk/

# Check port
sudo netstat -ulnp | grep 5060

# Start in foreground for debugging
sudo asterisk -cvvv
```

### Issue 2: No Inbound Calls

**Symptoms**: Upstream says calls sent, but Asterisk doesn't see them.

**Debug**:
```bash
# Enable PJSIP debugging
sudo asterisk -rvvv
pjsip set logger on

# Watch for INVITE
sudo tcpdump -i any -n port 5060 | grep INVITE
```

**Common causes**:
- Upstream IP not in identify section
- Firewall blocking
- Wrong port
- Transport not listening

**Fix**: See "Troubleshooting Inbound Call Issues" in main README

### Issue 3: One-Way Audio

**Symptoms**: Can hear but can't be heard, or vice versa.

**Debug**:
```bash
# Enable RTP debugging
sudo asterisk -rvvv
rtp set debug on

# Check RTP traffic
sudo tcpdump -i any -n udp portrange 10000-20000
```

**Common causes**:
- Firewall blocking RTP ports
- NAT not configured
- External address not set

**Fix**: Configure NAT settings in pjsip.conf

## Success Criteria

Deployment is successful when:

- [ ] Asterisk starts without errors
- [ ] All transports show as CREATED
- [ ] All endpoints are configured
- [ ] Test inbound call completes successfully
- [ ] Two-way audio works
- [ ] CDR records are created
- [ ] Queue logs are written (if applicable)
- [ ] No error messages in logs
- [ ] System resources are normal

## Next Steps

After successful deployment:

1. Disable debug logging (after 48 hours stable)
2. Configure monitoring alerts
3. Setup backup automation
4. Configure Asternic (if applicable)
5. Perform load testing
6. Document any custom changes
7. Train staff on new system

## Support Contacts

- Asterisk Community: https://community.asterisk.org/
- PJSIP Documentation: https://wiki.asterisk.org/wiki/display/AST/PJSIP
- Gulf Premium Telecom Support: [Your support contact]

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Prepared by**: Gulf Premium Telecom Engineering Team
