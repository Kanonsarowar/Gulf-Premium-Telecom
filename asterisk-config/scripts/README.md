# Scripts Directory
## Gulf Premium Telecom - Asterisk PBX

This directory contains utility scripts for installing, configuring, and testing the Asterisk PBX configuration.

---

## Available Scripts

### setup.sh
**Purpose:** Interactive setup and installation script

**What it does:**
- Backs up existing Asterisk configuration
- Copies configuration files to `/etc/asterisk/`
- Creates required directories
- Sets proper permissions
- Prompts for configuration values (IPs, credentials)
- Automatically updates configuration files
- Configures firewall rules
- Restarts Asterisk
- Verifies installation

**Usage:**
```bash
cd asterisk-config/scripts
sudo ./setup.sh
```

**Requirements:**
- Must be run as root (sudo)
- Asterisk must be installed
- Configuration files in `../conf/` directory

**Interactive Prompts:**
- Public IP address
- Carrier IP addresses
- Twilio domain
- Twilio username
- Twilio password
- Twilio caller ID

**Example:**
```bash
$ sudo ./setup.sh
================================
Gulf Premium Telecom
Asterisk PBX Setup Script
================================

Step 1: Backing up existing configuration
✓ Backup created: /etc/asterisk.backup.20240208_120000

Step 2: Copying configuration files
✓ Configuration files copied

...

Setup Complete!
```

---

### test.sh
**Purpose:** Comprehensive system testing and validation

**What it does:**
- Checks if Asterisk is running
- Tests CLI connectivity
- Validates PJSIP configuration
- Checks dialplan contexts
- Verifies RTP settings
- Validates module loading
- Checks directory structure
- Verifies IVR audio files
- Tests firewall rules
- Displays configuration status
- Shows active channels
- Displays recent logs

**Usage:**
```bash
cd asterisk-config/scripts
sudo ./test.sh
```

**Requirements:**
- Must be run as root (sudo)
- Asterisk must be running

**Output Sections:**
1. Asterisk running status
2. CLI connectivity test
3. PJSIP configuration validation
4. Dialplan context checks
5. RTP configuration
6. Module status
7. File system checks
8. IVR audio file validation
9. Network configuration
10. Configuration file status
11. Active channels
12. Recent log entries

**Example:**
```bash
$ sudo ./test.sh
================================
Asterisk Configuration Test
================================

Checking if Asterisk is running... ✓ Running
  Asterisk 20.0.0

PJSIP Configuration:
----------------------------------------
Checking PJSIP transports... ✓ 2 transport(s) configured
Checking PJSIP endpoints... ✓ 3 endpoint(s) configured
Checking PJSIP ACLs... ✓ 3 ACL(s) configured

...

Test Complete
```

---

## Common Tasks

### Initial Setup
```bash
# 1. Review configuration requirements
cat ../README.md

# 2. Run setup script
sudo ./setup.sh

# 3. Manually configure sensitive data
sudo nano /etc/asterisk/pjsip.conf
sudo nano /etc/asterisk/extensions.conf

# 4. Create IVR audio files
# (See main README.md)

# 5. Run tests
sudo ./test.sh

# 6. Monitor logs
sudo tail -f /var/log/asterisk/full
```

### Updating Configuration
```bash
# 1. Edit configuration files
sudo nano /etc/asterisk/pjsip.conf

# 2. Reload configuration
sudo asterisk -rx "pjsip reload"

# 3. Verify changes
sudo ./test.sh
```

### Troubleshooting
```bash
# 1. Run test script
sudo ./test.sh

# 2. Check for errors
sudo grep ERROR /var/log/asterisk/messages

# 3. Enable debugging
sudo asterisk -rvvv
*CLI> pjsip set logger on
*CLI> rtp set debug on

# 4. Review troubleshooting guide
cat ../docs/TROUBLESHOOTING.md
```

---

## Script Maintenance

### Customizing setup.sh

To add additional configuration prompts:

1. Edit `setup.sh`
2. Add prompt in the configuration section:
   ```bash
   read -p "Your Prompt: " YOUR_VARIABLE
   ```
3. Add sed command to update config file:
   ```bash
   sed -i "s/PLACEHOLDER/$YOUR_VARIABLE/g" /etc/asterisk/pjsip.conf
   ```

### Customizing test.sh

To add additional tests:

1. Edit `test.sh`
2. Add test section:
   ```bash
   echo ""
   echo -e "${YELLOW}Your Test Section:${NC}"
   echo "----------------------------------------"
   # Your test commands here
   ```

---

## Security Notes

- Scripts require root privileges
- Passwords are handled securely (not displayed during input)
- Configuration files are set to 640 permissions
- Backups are created before changes
- Logs show sensitive data - protect them accordingly

---

## Automation

### Scheduled Testing

Create a cron job to run tests regularly:

```bash
sudo crontab -e
```

Add:
```
0 */6 * * * /path/to/asterisk-config/scripts/test.sh > /var/log/asterisk/test-$(date +\%Y\%m\%d).log 2>&1
```

### Automated Deployment

For automated deployments, pre-configure values:

```bash
#!/bin/bash
# deploy-automated.sh

# Set variables
export PUBLIC_IP="203.0.113.10"
export CARRIER1_IP="198.51.100.0/24"
export TWILIO_DOMAIN="yourname.pstn.twilio.com"
export TWILIO_USER="username"
export TWILIO_PASS="password"
export CALLER_ID="+1234567890"

# Update configs
sed -i "s/YOUR_PUBLIC_IP/$PUBLIC_IP/g" /etc/asterisk/pjsip.conf
sed -i "s/203.0.113.0\/24/$CARRIER1_IP/g" /etc/asterisk/pjsip.conf
sed -i "s/YOUR_TWILIO_DOMAIN/$TWILIO_DOMAIN/g" /etc/asterisk/pjsip.conf
sed -i "s/YOUR_TWILIO_USERNAME/$TWILIO_USER/g" /etc/asterisk/pjsip.conf
sed -i "s/YOUR_TWILIO_PASSWORD/$TWILIO_PASS/g" /etc/asterisk/pjsip.conf
sed -i "s/+1234567890/$CALLER_ID/g" /etc/asterisk/extensions.conf

# Restart
systemctl restart asterisk

# Test
sleep 5
./test.sh
```

---

## Troubleshooting Scripts

### Setup Script Issues

**Problem:** "Configuration directory not found"
- **Solution:** Ensure you're running from the scripts directory
- **Command:** `cd asterisk-config/scripts`

**Problem:** "Permission denied"
- **Solution:** Run with sudo
- **Command:** `sudo ./setup.sh`

**Problem:** "Asterisk not found"
- **Solution:** Install Asterisk first
- **Reference:** See main README.md

### Test Script Issues

**Problem:** "Cannot connect to Asterisk"
- **Solution:** Check if Asterisk is running
- **Command:** `sudo systemctl status asterisk`

**Problem:** No endpoints shown
- **Solution:** Configuration may not be loaded
- **Command:** `sudo asterisk -rx "pjsip reload"`

---

## Additional Scripts

You can create additional scripts for common tasks:

### restart.sh - Safe restart
```bash
#!/bin/bash
echo "Restarting Asterisk..."
systemctl restart asterisk
sleep 3
systemctl status asterisk
```

### backup.sh - Configuration backup
```bash
#!/bin/bash
BACKUP_DIR="/backup/asterisk"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/config-$DATE.tar.gz /etc/asterisk/
echo "Backup created: $BACKUP_DIR/config-$DATE.tar.gz"
```

### monitor.sh - Live monitoring
```bash
#!/bin/bash
watch -n 2 "asterisk -rx 'core show channels' && echo '' && asterisk -rx 'pjsip show endpoints'"
```

---

## Getting Help

- **Main Documentation:** `../README.md`
- **Troubleshooting Guide:** `../docs/TROUBLESHOOTING.md`
- **Quick Reference:** `../docs/QUICK-REFERENCE.md`
- **Security Guide:** `../docs/SECURITY.md`

---

© 2024 Gulf Premium Telecom
