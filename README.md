# Gulf Premium Telecom - Asterisk IPRN Configuration

## Overview

This repository contains production-ready Asterisk PBX configuration for handling **inbound call invitations from upstream IP addresses** in a carrier-grade VoIP environment. The configuration is designed for IP-to-IP routing without registration, supporting high CPS (calls per second) and large call volumes typical in telecom carrier operations.

## System Architecture

```
┌─────────────────┐
│ Upstream        │
│ SIP Provider 1  │──┐
│ (Premium Route) │  │
└─────────────────┘  │
                     │     ┌──────────────────┐
┌─────────────────┐  │     │                  │      ┌─────────────┐
│ Upstream        │  ├────▶│  Asterisk IPRN   │─────▶│ Call Center │
│ SIP Provider 2  │  │     │  (This System)   │      │   Queues    │
│ (Standard Route)│  │     │                  │      └─────────────┘
└─────────────────┘  │     └──────────────────┘
                     │              │
┌─────────────────┐  │              │
│ Upstream        │──┘              ▼
│ SIP Provider 3  │           ┌────────────┐
│ (Asia Route)    │           │  Asternic  │
└─────────────────┘           │ Call Stats │
                              └────────────┘
```

## Key Features

### 1. **IP-Based SIP Trunk Support**
- No registration required (IP-to-IP routing)
- Multiple upstream provider support
- IP-based authentication and routing
- ACL (Access Control List) for security

### 2. **Inbound Call Handling**
- Automatic DID (Direct Inward Dial) routing
- Multi-level IVR (Interactive Voice Response) with 9 menu options:
  - **1** - Sales Department
  - **2** - Technical Support
  - **3** - Billing Department
  - **4** - VIP Support
  - **5** - Account Management
  - **6** - Emergency Support
  - **0** - Operator/Receptionist
  - **9** - Directory Access
- Queue-based call distribution
- Call recording capabilities

### 3. **High Availability**
- Production-ready configuration
- RTP timeout detection for dead calls
- Automatic call recovery mechanisms
- Comprehensive logging for troubleshooting

### 4. **Integration Ready**
- Asternic Call Center Stats support
- AMI (Asterisk Manager Interface) configured
- CDR (Call Detail Records) for billing
- Queue logging for reporting

## Configuration Files

| File | Purpose |
|------|---------|
| `pjsip.conf` | SIP/PJSIP trunk configuration for upstream providers |
| `extensions.conf` | Dialplan for call routing and IVR |
| `rtp.conf` | RTP media settings (UDP 10000-20000) |
| `modules.conf` | Module loading configuration |
| `logger.conf` | Logging and debugging |
| `queues.conf` | Call center queue configuration |
| `manager.conf` | AMI configuration for monitoring |
| `cdr.conf` | Call Detail Records |
| `musiconhold.conf` | Hold music configuration |
| `asterisk.conf` | Main Asterisk settings |

## Quick Start

### Prerequisites

- Linux server (Ubuntu 20.04+ or Debian 11+ recommended)
- Asterisk 16, 18, 19, or 20 installed
- Root or sudo access
- Public IP or SBC (Session Border Controller)
- Firewall access for:
  - UDP 5060 (SIP signaling)
  - UDP 10000-20000 (RTP media)

### Installation Steps

1. **Backup existing configuration** (if any):
```bash
sudo mkdir -p /etc/asterisk.backup
sudo cp -r /etc/asterisk/* /etc/asterisk.backup/
```

2. **Copy configuration files**:
```bash
sudo cp asterisk/etc/asterisk/* /etc/asterisk/
```

3. **Set proper permissions**:
```bash
sudo chown -R asterisk:asterisk /etc/asterisk
sudo chmod 640 /etc/asterisk/*.conf
```

4. **Configure upstream provider IPs** - Edit `/etc/asterisk/pjsip.conf`:
```ini
[upstream-provider-1-identify]
endpoint=upstream-provider-1
match=YOUR_UPSTREAM_IP_1      # REPLACE with actual IP
match=YOUR_UPSTREAM_IP_2      # Add all upstream IPs
```

5. **Configure DID routing** - Edit `/etc/asterisk/extensions.conf`:
```ini
[did-routing]
exten => _966XXXXXXXXX,1,NoOp(Saudi number)
same => n,Goto(ivr-main,s,1)  # Route to your desired destination
```

6. **Update security settings** - Edit `/etc/asterisk/manager.conf`:
```ini
[asternic]
secret=YOUR_SECURE_PASSWORD   # CHANGE THIS!
```

7. **Verify Asterisk syntax**:
```bash
sudo asterisk -rx "dialplan reload"
sudo asterisk -rx "module reload"
```

8. **Restart Asterisk**:
```bash
sudo systemctl restart asterisk
```

9. **Verify configuration**:
```bash
sudo asterisk -rvvv
```

Then run these CLI commands:
```
pjsip show endpoints
pjsip show transports
dialplan show from-upstream
queue show
```

## Critical Configuration Steps

### 1. Configure Upstream Provider IPs

The most critical step for receiving inbound calls is configuring the upstream provider IP addresses in `pjsip.conf`:

```ini
[upstream-provider-1-identify](upstream-identify-template)
endpoint=upstream-provider-1
match=203.0.113.10        # REPLACE: Upstream provider IP 1
match=203.0.113.11        # REPLACE: Upstream provider IP 2
match=203.0.113.12        # REPLACE: Backup IP
```

**⚠️ WARNING**: Calls will be rejected if the upstream IP is not listed here!

### 2. Configure NAT Settings (if behind NAT)

If your Asterisk server is behind NAT, edit `pjsip.conf`:

```ini
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060
external_media_address=YOUR_PUBLIC_IP       # UNCOMMENT and set
external_signaling_address=YOUR_PUBLIC_IP   # UNCOMMENT and set
```

### 3. Firewall Configuration

Ensure these ports are open in your firewall:

**Ubuntu/Debian (ufw)**:
```bash
sudo ufw allow 5060/udp      # SIP signaling
sudo ufw allow 10000:20000/udp   # RTP media
```

**CentOS/RHEL (firewalld)**:
```bash
sudo firewall-cmd --permanent --add-port=5060/udp
sudo firewall-cmd --permanent --add-port=10000-20000/udp
sudo firewall-cmd --reload
```

**iptables**:
```bash
sudo iptables -A INPUT -p udp --dport 5060 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

### 4. Configure DID Routing

Edit `extensions.conf` to route your DIDs (Direct Inward Dial numbers):

```ini
[did-routing]
; Saudi mobile number to sales queue
exten => _966501234567,1,NoOp(Sales DID)
same => n,Goto(queue-sales,s,1)

; Support number to support queue
exten => _966507654321,1,NoOp(Support DID)
same => n,Goto(queue-support,s,1)

; Default: route unknown DIDs to main IVR
exten => _X.,1,NoOp(Default routing)
same => n,Goto(ivr-main,s,1)
```

## Troubleshooting Inbound Call Issues

### Problem: Calls Not Arriving

**Symptoms**: No incoming calls, upstream provider shows calls sent but Asterisk doesn't see them.

**Solution Steps**:

1. **Enable PJSIP debug logging**:
```bash
asterisk -rvvv
pjsip set logger on
```

2. **Check if INVITE is received**:
```bash
tail -f /var/log/asterisk/full | grep INVITE
```

3. **Verify upstream IP is configured**:
```bash
asterisk -rx "pjsip show endpoints"
```

4. **Check transport is listening**:
```bash
asterisk -rx "pjsip show transports"
netstat -ulnp | grep 5060
```

5. **Test with tcpdump**:
```bash
sudo tcpdump -i any -n port 5060 -A
```

6. **Common fixes**:
   - Add upstream IP to `pjsip.conf` identify section
   - Check firewall rules
   - Verify Asterisk is running: `systemctl status asterisk`
   - Check logs: `tail -f /var/log/asterisk/full`

### Problem: One-Way Audio or No Audio

**Symptoms**: Call connects but can't hear caller or caller can't hear you.

**Solution Steps**:

1. **Enable RTP debugging**:
```bash
asterisk -rvvv
rtp set debug on
```

2. **Check RTP flow**:
```bash
sudo tcpdump -i any -n udp portrange 10000-20000
```

3. **Verify RTP ports are open**:
```bash
sudo netstat -ulnp | grep asterisk | grep "10[0-9][0-9][0-9]"
```

4. **Common fixes**:
   - Configure NAT settings in `pjsip.conf`
   - Ensure firewall allows UDP 10000-20000
   - Check `rtp_symmetric=yes` in trunk config
   - Verify `direct_media=no` (forces RTP through Asterisk)
   - Set `external_media_address` if behind NAT

### Problem: Calls Rejected with 403 Forbidden

**Symptoms**: Upstream sends INVITE, Asterisk responds with 403 Forbidden.

**Solution**: Upstream IP not in identify section of `pjsip.conf`.

```ini
[upstream-provider-1-identify]
endpoint=upstream-provider-1
match=UPSTREAM_IP_ADDRESS    # Add this line with correct IP
```

### Problem: Calls Rejected with 404 Not Found

**Symptoms**: Call connects to Asterisk but gets 404 Not Found.

**Solution**: DID not configured in dialplan.

1. Check which DID is being sent:
```bash
tail -f /var/log/asterisk/full | grep "DID:"
```

2. Add DID to `extensions.conf`:
```ini
[did-routing]
exten => _YOUR_DID_PATTERN,1,NoOp(New DID)
same => n,Goto(ivr-main,s,1)
```

## Monitoring and Maintenance

### Essential CLI Commands

```bash
# Connect to Asterisk console
asterisk -rvvv

# Show active calls
core show channels verbose

# Show endpoints (trunks)
pjsip show endpoints

# Show endpoint status
pjsip show endpoint upstream-provider-1

# Show registrations (if any)
pjsip show registrations

# Show queues
queue show

# Show queue statistics
queue show sales

# Check module status
module show like pjsip
module show like res_rtp

# Reload dialplan
dialplan reload

# Reload PJSIP
module reload res_pjsip.so

# Show last 50 log lines
core show log 50
```

### Log Files

| Log File | Purpose |
|----------|---------|
| `/var/log/asterisk/full` | Complete debug log |
| `/var/log/asterisk/messages` | Standard operational log |
| `/var/log/asterisk/queue_log` | Queue events (for Asternic) |
| `/var/log/asterisk/cdr-csv/Master.csv` | Call detail records |

### Performance Monitoring

**Check system resources**:
```bash
# CPU usage
top -p $(pgrep asterisk)

# Memory usage
ps aux | grep asterisk

# Active calls
asterisk -rx "core show channels" | grep "active call"

# Uptime
asterisk -rx "core show uptime"
```

## Integration with Asternic Call Center Stats

Asternic Call Center Stats requires:

1. **AMI Access** - Already configured in `manager.conf`
2. **Queue Logs** - Automatically written to `/var/log/asterisk/queue_log`
3. **Database Access** - Configure if using MySQL CDR backend

**Asternic Configuration**:
- AMI Host: `127.0.0.1` (or server IP)
- AMI Port: `5038`
- AMI Username: `asternic`
- AMI Password: (set in `manager.conf`)

## Security Best Practices

### 1. Change Default Passwords

**CRITICAL**: Change all passwords in `manager.conf`:
```ini
[asternic]
secret=YOUR_STRONG_PASSWORD_HERE
```

### 2. Restrict AMI Access

Ensure AMI is restricted to localhost or trusted IPs:
```ini
[asternic]
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.255
```

### 3. Implement IP Whitelisting

Only allow upstream provider IPs in `pjsip.conf`:
```ini
[upstream-provider-1-identify]
match=ONLY_TRUSTED_IPS_HERE
```

### 4. Fail2Ban Configuration

Install fail2ban to prevent brute force attacks:
```bash
sudo apt install fail2ban
```

Create `/etc/fail2ban/jail.d/asterisk.conf`:
```ini
[asterisk]
enabled = true
port = 5060
protocol = udp
filter = asterisk
logpath = /var/log/asterisk/messages
maxretry = 5
bantime = 3600
```

### 5. Regular Security Updates

```bash
# Update system
sudo apt update && sudo apt upgrade

# Update Asterisk (check for security patches)
sudo apt update asterisk
```

## Backup and Disaster Recovery

### Backup Configuration

```bash
#!/bin/bash
# backup-asterisk.sh
BACKUP_DIR="/backup/asterisk/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup configuration
cp -r /etc/asterisk $BACKUP_DIR/

# Backup recordings (if any)
cp -r /var/spool/asterisk/monitor $BACKUP_DIR/

# Backup CDR
cp /var/log/asterisk/cdr-csv/Master.csv $BACKUP_DIR/

# Backup queue logs
cp /var/log/asterisk/queue_log $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
```

### Restore Configuration

```bash
#!/bin/bash
# restore-asterisk.sh
BACKUP_DIR="/backup/asterisk/20240101"  # Adjust date

# Stop Asterisk
systemctl stop asterisk

# Restore configuration
cp -r $BACKUP_DIR/asterisk/* /etc/asterisk/

# Set permissions
chown -R asterisk:asterisk /etc/asterisk
chmod 640 /etc/asterisk/*.conf

# Start Asterisk
systemctl start asterisk

echo "Restore completed"
```

## Capacity Planning

### Recommended System Resources

| Concurrent Calls | CPU | RAM | Network |
|-----------------|-----|-----|---------|
| 0-100 | 2 cores | 4 GB | 1 Gbps |
| 100-500 | 4 cores | 8 GB | 1 Gbps |
| 500-1000 | 8 cores | 16 GB | 10 Gbps |
| 1000+ | 16+ cores | 32+ GB | 10 Gbps |

### Bandwidth Calculation

**Per call bandwidth** (approximate):
- G.711 (ulaw/alaw): 87 kbps (64 kbps + overhead)
- G.729: 31 kbps (8 kbps + overhead)

**Example**: 100 concurrent calls with G.711
- Bandwidth needed: 100 × 87 kbps = 8.7 Mbps

## Support and Troubleshooting

### Getting Help

1. **Check logs**: `tail -f /var/log/asterisk/full`
2. **Enable debugging**: See "Troubleshooting" section above
3. **Asterisk documentation**: https://wiki.asterisk.org/
4. **PJSIP documentation**: https://wiki.asterisk.org/wiki/display/AST/PJSIP

### Common Error Codes

| SIP Code | Meaning | Common Cause |
|----------|---------|--------------|
| 403 | Forbidden | Upstream IP not whitelisted |
| 404 | Not Found | DID not configured in dialplan |
| 480 | Temporarily Unavailable | No agents available in queue |
| 486 | Busy Here | All lines busy |
| 487 | Request Terminated | Caller hung up before answer |

## Production Checklist

Before going live, verify:

- [ ] All upstream provider IPs configured in `pjsip.conf`
- [ ] NAT settings configured if behind NAT
- [ ] Firewall rules allow SIP (5060) and RTP (10000-20000)
- [ ] DID routing configured in `extensions.conf`
- [ ] AMI passwords changed from defaults
- [ ] Call recording directory exists and is writable
- [ ] Music on hold files installed
- [ ] Queue agents configured
- [ ] Asternic integration tested (if applicable)
- [ ] CDR logging verified
- [ ] Backup script configured
- [ ] Monitoring alerts configured
- [ ] Load testing completed

## License

Copyright © 2024 Gulf Premium Telecom  
All Rights Reserved

---

**Version**: 1.0  
**Last Updated**: 2024  
**Author**: Gulf Premium Telecom Engineering Team  
**Support**: Contact your system administrator
