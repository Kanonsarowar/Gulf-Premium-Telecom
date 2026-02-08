# Security Best Practices
## Gulf Premium Telecom Asterisk PBX

This document outlines security best practices for the Asterisk PBX deployment.

---

## Table of Contents
1. [Network Security](#network-security)
2. [Access Control](#access-control)
3. [Authentication](#authentication)
4. [Firewall Configuration](#firewall-configuration)
5. [Monitoring and Logging](#monitoring-and-logging)
6. [Regular Maintenance](#regular-maintenance)
7. [Incident Response](#incident-response)

---

## Network Security

### IP Whitelisting

**Critical:** Only allow known carrier IPs in PJSIP ACLs.

```ini
[acl-carrier1]
type=acl
deny=0.0.0.0/0
permit=203.0.113.0/24    # Only known carrier IPs
```

**Do NOT use:**
```ini
permit=0.0.0.0/0         # NEVER allow all IPs
```

### Separate Networks

If possible, use separate network interfaces:
- One for carrier traffic
- One for internal management

```bash
# Example network configuration
# External (carriers): eth0 - 203.0.113.10
# Internal (management): eth1 - 192.168.1.10
```

### VPN Access

For remote management, use VPN instead of exposing management ports:

```bash
# Only allow SSH from VPN network
sudo ufw allow from 10.8.0.0/24 to any port 22
sudo ufw deny 22
```

---

## Access Control

### Principle of Least Privilege

Only grant the minimum necessary permissions:

```bash
# Asterisk should NOT run as root
sudo chown -R asterisk:asterisk /etc/asterisk
sudo chmod 750 /etc/asterisk
sudo chmod 640 /etc/asterisk/*.conf
```

### Disable Unnecessary Services

```bash
# Disable unused network services
sudo systemctl disable telnet
sudo systemctl disable ftp
```

### Lock Down Asterisk Manager Interface (AMI)

If using AMI for Asternic:

```ini
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1    # Only localhost

[asternic]
secret = STRONG_RANDOM_PASSWORD_HERE
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.255    # Only localhost
read = system,call,log,verbose
write = system,call,log,verbose
```

**Generate strong password:**
```bash
openssl rand -base64 32
```

---

## Authentication

### Strong Passwords

**For Twilio and any SIP endpoints:**

```bash
# Generate strong passwords
openssl rand -base64 24
```

### Password Policy

- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Change every 90 days
- Never reuse passwords
- Store securely (use password manager)

### Protect Configuration Files

```bash
# Restrict access to config files
sudo chmod 640 /etc/asterisk/pjsip.conf
sudo chmod 640 /etc/asterisk/extensions.conf

# Only asterisk user and root can read
sudo chown root:asterisk /etc/asterisk/*.conf
```

---

## Firewall Configuration

### UFW (Uncomplicated Firewall)

#### Basic Configuration

```bash
# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH (from specific IPs only)
sudo ufw allow from YOUR_MANAGEMENT_IP to any port 22

# SIP signaling (from known carriers only)
sudo ufw allow from 203.0.113.0/24 to any port 5060 proto udp
sudo ufw allow from 198.51.100.0/24 to any port 5060 proto udp

# RTP media (from carriers and Twilio)
sudo ufw allow from 203.0.113.0/24 to any port 10000:20000 proto udp
sudo ufw allow from 198.51.100.0/24 to any port 10000:20000 proto udp
# Add all Twilio IPs...

# Enable firewall
sudo ufw enable
```

#### Advanced: iptables Rules

For more control:

```bash
# Create script: /etc/iptables/asterisk-rules.sh
#!/bin/bash

# Flush existing rules
iptables -F

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from specific IP
iptables -A INPUT -p tcp --dport 22 -s YOUR_MANAGEMENT_IP -j ACCEPT

# Allow SIP from carrier1
iptables -A INPUT -p udp --dport 5060 -s 203.0.113.0/24 -j ACCEPT

# Allow RTP from carrier1
iptables -A INPUT -p udp --dport 10000:20000 -s 203.0.113.0/24 -j ACCEPT

# Rate limiting for SIP (prevent DoS)
iptables -A INPUT -p udp --dport 5060 -m limit --limit 10/sec -j ACCEPT
iptables -A INPUT -p udp --dport 5060 -j DROP

# Log dropped packets (for monitoring)
iptables -A INPUT -j LOG --log-prefix "DROPPED: "

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### Rate Limiting

Prevent SIP flooding attacks:

```bash
# Limit SIP INVITE to 10 per second per IP
sudo ufw limit 5060/udp
```

---

## Monitoring and Logging

### Enable Comprehensive Logging

Already configured in `logger.conf`:

```ini
[logfiles]
security => security
messages => notice,warning,error
```

### Monitor Logs in Real-Time

```bash
# Watch for security events
tail -f /var/log/asterisk/security

# Watch for failed authentication
tail -f /var/log/asterisk/messages | grep -i "failed\|error\|hack"
```

### Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/asterisk
```

```
/var/log/asterisk/*.log {
    daily
    rotate 30
    missingok
    notifempty
    compress
    delaycompress
    postrotate
        /usr/sbin/asterisk -rx "logger reload" > /dev/null 2>&1
    endscript
}
```

### Install Fail2Ban

Automatically ban IPs with suspicious activity:

```bash
sudo apt install -y fail2ban
```

Create Asterisk filter:
```bash
sudo nano /etc/fail2ban/filter.d/asterisk.conf
```

```ini
[Definition]
failregex = NOTICE.* .*: Registration from '.*' failed for '<HOST>:.*' - Wrong password
            NOTICE.* .*: Registration from '.*' failed for '<HOST>:.*' - No matching peer found
            NOTICE.* .*: Registration from '.*' failed for '<HOST>:.*' - Username/auth name mismatch
            NOTICE.* <HOST> failed to authenticate as '.*'$
            NOTICE.* .*: No registration for peer '.*' \(from <HOST>\)
            NOTICE.* .*: Host <HOST> failed MD5 authentication for '.*' (.*)
            NOTICE.* .*: Failed to authenticate user .*@<HOST>.*
            SECURITY.* .*SecurityEvent="FailedACL".*RemoteAddress="IPV4/UDP/<HOST>/.*
ignoreregex =
```

Create jail:
```bash
sudo nano /etc/fail2ban/jail.d/asterisk.local
```

```ini
[asterisk]
enabled = true
filter = asterisk
logpath = /var/log/asterisk/messages
maxretry = 5
bantime = 3600
findtime = 600
action = iptables-allports[name=asterisk, protocol=all]
```

Start fail2ban:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

Check status:
```bash
sudo fail2ban-client status asterisk
```

---

## Regular Maintenance

### Update System Regularly

```bash
# Update OS packages
sudo apt update
sudo apt upgrade -y

# Check for Asterisk security updates
# Subscribe to: https://www.asterisk.org/community/security/
```

### Review Logs Weekly

```bash
# Check for unusual patterns
sudo grep -i "failed\|unauthorized\|hack" /var/log/asterisk/messages

# Check CDR for unusual call patterns
sudo tail -100 /var/log/asterisk/cdr-csv/Master.csv
```

### Audit User Access

```bash
# List users with shell access
cat /etc/passwd | grep -v "nologin"

# Check sudo access
sudo cat /etc/sudoers
```

### Review Firewall Rules

```bash
# List all UFW rules
sudo ufw status numbered

# Remove unnecessary rules
sudo ufw delete [number]
```

### Backup Configuration

```bash
#!/bin/bash
# /usr/local/bin/backup-asterisk.sh

BACKUP_DIR="/backup/asterisk"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/config-$DATE.tar.gz /etc/asterisk/
tar -czf $BACKUP_DIR/sounds-$DATE.tar.gz /var/lib/asterisk/sounds/custom/

# Keep only last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Encrypt backups (optional but recommended)
gpg --encrypt --recipient admin@gulfpremium.com $BACKUP_DIR/config-$DATE.tar.gz
```

Schedule daily:
```bash
sudo crontab -e
```

```
0 2 * * * /usr/local/bin/backup-asterisk.sh
```

---

## Incident Response

### Suspected Breach

**If you suspect unauthorized access:**

1. **Isolate the system:**
   ```bash
   # Block all incoming traffic immediately
   sudo ufw default deny incoming
   ```

2. **Check active connections:**
   ```bash
   sudo asterisk -rx "core show channels"
   sudo netstat -antup | grep asterisk
   ```

3. **Review recent logs:**
   ```bash
   sudo tail -1000 /var/log/asterisk/messages
   sudo tail -1000 /var/log/asterisk/security
   ```

4. **Check for unauthorized changes:**
   ```bash
   # Check config file modification times
   ls -la /etc/asterisk/
   
   # Check for unauthorized users
   cat /etc/passwd
   ```

5. **Change all passwords:**
   - Twilio credentials
   - System passwords
   - AMI passwords

6. **Document everything:**
   - Save logs
   - Document timeline
   - Note any anomalies

### Unauthorized Calls

**If you detect fraudulent calls:**

1. **Stop the calls:**
   ```bash
   # Hangup all active channels
   sudo asterisk -rx "channel request hangup all"
   ```

2. **Block the source:**
   ```bash
   # Block attacker IP
   sudo ufw deny from ATTACKER_IP
   ```

3. **Review CDR:**
   ```bash
   # Check recent calls
   sudo tail -100 /var/log/asterisk/cdr-csv/Master.csv
   
   # Look for unusual destinations or durations
   ```

4. **Notify carriers:**
   - Inform your carriers
   - Request call blocking if needed

5. **Update security:**
   - Review and strengthen ACLs
   - Verify all endpoints are secured
   - Check for misconfigurations

### Contact Information

Keep emergency contacts handy:
- **System Administrator:** [Contact]
- **Network Administrator:** [Contact]
- **Carrier Support:** [Contact]
- **Twilio Support:** https://support.twilio.com/

---

## Security Checklist

**Pre-Deployment:**
- [ ] All default passwords changed
- [ ] Firewall configured and enabled
- [ ] IP whitelisting implemented
- [ ] Fail2ban installed and configured
- [ ] Logs configured and rotating
- [ ] Backups scheduled
- [ ] Unnecessary services disabled
- [ ] Configuration files protected (chmod 640)

**Weekly:**
- [ ] Review security logs
- [ ] Check for failed auth attempts
- [ ] Review CDR for anomalies
- [ ] Verify firewall rules
- [ ] Check system updates

**Monthly:**
- [ ] Update system packages
- [ ] Review user access
- [ ] Test backup restoration
- [ ] Audit configuration changes
- [ ] Review and update documentation

**Quarterly:**
- [ ] Change passwords
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review incident response plan

---

## Additional Resources

- [Asterisk Security](https://wiki.asterisk.org/wiki/display/AST/Asterisk+Security)
- [OWASP VoIP Security](https://owasp.org/www-community/vulnerabilities/VoIP_Security)
- [CIS Benchmarks](https://www.cisecurity.org/benchmark/ubuntu_linux)

---

**Remember:** Security is not a one-time setup, but an ongoing process. Stay vigilant!

---

© 2024 Gulf Premium Telecom - Confidential
