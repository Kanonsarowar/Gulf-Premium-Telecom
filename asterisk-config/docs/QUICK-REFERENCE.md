# Asterisk Quick Reference Card
## Gulf Premium Telecom

A quick reference for common Asterisk commands and troubleshooting.

---

## Connecting to Asterisk CLI

```bash
# Connect with verbose output
sudo asterisk -rvvv

# Connect with different verbosity
sudo asterisk -r          # Normal
sudo asterisk -rvv        # More verbose
sudo asterisk -rvvvvv     # Very verbose

# Exit CLI
*CLI> exit
```

---

## Essential CLI Commands

### System Status

```bash
# Show Asterisk version
*CLI> core show version

# Show uptime
*CLI> core show uptime

# Show system information
*CLI> core show sysinfo

# Show channels
*CLI> core show channels
*CLI> core show channels concise    # Compact format
*CLI> core show channels verbose    # Detailed

# Show active calls
*CLI> core show calls

# Show threads
*CLI> core show threads
```

### PJSIP Commands

```bash
# Show all endpoints
*CLI> pjsip show endpoints

# Show specific endpoint
*CLI> pjsip show endpoint carrier1-trunk

# Show transports
*CLI> pjsip show transports

# Show ACLs
*CLI> pjsip show acls

# Show identify sections
*CLI> pjsip show identifies

# Show authentication
*CLI> pjsip show auths

# Show AORs (Address of Records)
*CLI> pjsip show aors

# Show registrations
*CLI> pjsip show registrations
```

### Dialplan Commands

```bash
# Show all contexts
*CLI> dialplan show

# Show specific context
*CLI> dialplan show from-carriers
*CLI> dialplan show ivr-main

# Show specific extension
*CLI> dialplan show 100@internal-extensions

# Reload dialplan
*CLI> dialplan reload
```

### Module Commands

```bash
# Show all modules
*CLI> module show

# Show specific module
*CLI> module show like pjsip
*CLI> module show like cdr

# Load module
*CLI> module load res_pjsip.so

# Unload module
*CLI> module unload chan_sip.so

# Reload module
*CLI> module reload res_pjsip.so
```

### CDR Commands

```bash
# Show CDR status
*CLI> cdr show status

# Show CDR configuration
*CLI> cdr show config
```

### Debugging Commands

```bash
# Enable PJSIP logging
*CLI> pjsip set logger on
*CLI> pjsip set logger off

# Enable RTP debugging
*CLI> rtp set debug on
*CLI> rtp set debug on ip 203.0.113.10    # Specific IP
*CLI> rtp set debug off

# Enable verbose
*CLI> core set verbose 5
*CLI> core set verbose 0    # Disable

# Enable debug
*CLI> core set debug 5
*CLI> core set debug 0      # Disable

# Enable DTMF debug
*CLI> core set debug dtmf 5
```

### Reload Commands

```bash
# Reload PJSIP
*CLI> pjsip reload

# Reload dialplan
*CLI> dialplan reload

# Reload modules
*CLI> module reload

# Reload logger
*CLI> logger reload

# Reload everything
*CLI> core reload
```

### Call Control

```bash
# Hangup specific channel
*CLI> channel request hangup PJSIP/carrier1-trunk-00000001

# Hangup all channels
*CLI> channel request hangup all

# Originate call (test outbound)
*CLI> channel originate PJSIP/+1234567890@twilio-trunk application Playback demo-congrats

# Redirect call
*CLI> channel redirect PJSIP/carrier1-trunk-00000001 ivr-main,s,1
```

---

## System Commands (bash)

### Service Management

```bash
# Start Asterisk
sudo systemctl start asterisk

# Stop Asterisk
sudo systemctl stop asterisk

# Restart Asterisk
sudo systemctl restart asterisk

# Status
sudo systemctl status asterisk

# Enable on boot
sudo systemctl enable asterisk

# Disable on boot
sudo systemctl disable asterisk
```

### Log Viewing

```bash
# Follow full log
sudo tail -f /var/log/asterisk/full

# Follow messages
sudo tail -f /var/log/asterisk/messages

# Follow CDR
sudo tail -f /var/log/asterisk/cdr-csv/Master.csv

# Search logs
sudo grep "ERROR" /var/log/asterisk/full
sudo grep "203.0.113.10" /var/log/asterisk/messages
```

### Configuration

```bash
# Edit pjsip.conf
sudo nano /etc/asterisk/pjsip.conf

# Edit extensions.conf
sudo nano /etc/asterisk/extensions.conf

# Test configuration (dry run)
sudo asterisk -rx "pjsip reload"

# Backup configuration
sudo tar -czf /backup/asterisk-$(date +%Y%m%d).tar.gz /etc/asterisk/
```

### Network

```bash
# Check listening ports
sudo netstat -tulpn | grep asterisk
sudo ss -tulpn | grep asterisk

# Check connections
sudo netstat -anp | grep asterisk

# Test connectivity
ping carrier-ip
telnet carrier-ip 5060
```

### Firewall

```bash
# Show rules
sudo ufw status numbered
sudo iptables -L -n

# Add rule
sudo ufw allow from 203.0.113.0/24 to any port 5060

# Delete rule
sudo ufw delete [number]
```

---

## Common Troubleshooting Scenarios

### No Audio

```bash
# 1. Check public IP in config
grep external_media_address /etc/asterisk/pjsip.conf

# 2. Enable RTP debug
*CLI> rtp set debug on

# 3. Check firewall
sudo ufw status | grep 10000:20000
```

### Calls Not Coming In

```bash
# 1. Check endpoints
*CLI> pjsip show endpoints

# 2. Enable SIP debug
*CLI> pjsip set logger on

# 3. Check identify sections
*CLI> pjsip show identifies

# 4. Check if Asterisk is listening
sudo netstat -tulpn | grep 5060
```

### IVR Not Working

```bash
# 1. Check dialplan
*CLI> dialplan show ivr-main

# 2. Check audio files
ls -la /var/lib/asterisk/sounds/custom/

# 3. Enable verbose
*CLI> core set verbose 5

# 4. Test audio
*CLI> file convert /var/lib/asterisk/sounds/custom/welcome.wav /tmp/test.wav
```

### High CPU Usage

```bash
# Check threads
*CLI> core show threads

# Check channels
*CLI> core show channels

# Check system resources
top
htop
```

---

## File Locations

```bash
# Configuration files
/etc/asterisk/

# Log files
/var/log/asterisk/

# Sound files
/var/lib/asterisk/sounds/

# Call recordings
/var/spool/asterisk/monitor/

# AGI scripts
/var/lib/asterisk/agi-bin/

# Modules
/usr/lib/asterisk/modules/

# CDR
/var/log/asterisk/cdr-csv/
```

---

## Emergency Commands

### Stop All Calls

```bash
*CLI> channel request hangup all
```

### Block IP Immediately

```bash
sudo ufw insert 1 deny from ATTACKER_IP
```

### Restart Asterisk Safely

```bash
# Soft restart (wait for calls to end)
*CLI> core restart gracefully

# Immediate restart
sudo systemctl restart asterisk
```

### View Recent Errors

```bash
sudo tail -50 /var/log/asterisk/messages | grep ERROR
```

---

## Performance Monitoring

```bash
# Show calls per second (approximate)
watch -n 1 "asterisk -rx 'core show channels' | grep 'active call'"

# Show endpoint status
watch -n 5 "asterisk -rx 'pjsip show endpoints'"

# Monitor CPU and memory
top -p $(pgrep asterisk)
```

---

## Configuration Validation

```bash
# Check for syntax errors (look for warnings/errors on restart)
sudo asterisk -rx "core restart now"

# Validate PJSIP config
sudo asterisk -rx "pjsip show endpoints"

# Validate dialplan
sudo asterisk -rx "dialplan show"
```

---

## Quick Configuration Changes

### Add New Carrier IP

```bash
# 1. Edit config
sudo nano /etc/asterisk/pjsip.conf

# 2. Find carrier section and add IP to permit and match

# 3. Reload
sudo asterisk -rx "pjsip reload"

# 4. Verify
sudo asterisk -rx "pjsip show identifies"
```

### Update Twilio Credentials

```bash
# 1. Edit config
sudo nano /etc/asterisk/pjsip.conf

# 2. Update username/password in [twilio-auth]

# 3. Reload
sudo asterisk -rx "pjsip reload"

# 4. Test
sudo asterisk -rx "channel originate PJSIP/+1234567890@twilio-trunk application Playback demo-congrats"
```

### Add IVR Option

```bash
# 1. Edit dialplan
sudo nano /etc/asterisk/extensions.conf

# 2. Add new option in [ivr-main]
# exten => 4,1,Goto(internal-extensions,400,1)

# 3. Add routing in [internal-extensions]

# 4. Reload
sudo asterisk -rx "dialplan reload"

# 5. Verify
sudo asterisk -rx "dialplan show ivr-main"
```

---

## Getting Help

```bash
# Command help
*CLI> help
*CLI> help pjsip show
*CLI> help core show

# Online resources
# - https://wiki.asterisk.org/
# - https://community.asterisk.org/
```

---

**Print this card and keep it handy for quick reference!**

© 2024 Gulf Premium Telecom
