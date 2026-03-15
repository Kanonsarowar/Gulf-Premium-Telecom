# Configuration Summary
# Gulf Premium Telecom - Asterisk IPRN

## Overview

This document provides a complete summary of the Asterisk IPRN configuration created to fix inbound call reception issues from upstream IP addresses.

## Problem Statement

**Original Issue**: Asterisk PBX unable to receive inbound call invitations from upstream IP addresses.

**Root Cause**: Missing or incomplete configuration for:
- IP-based SIP trunk authentication
- Upstream provider IP whitelisting
- Inbound call routing (dialplan)
- RTP media handling
- Proper module loading

## Solution Implemented

A complete, production-ready Asterisk configuration has been created with all necessary components to receive and process inbound calls from upstream providers.

## File Structure

```
Gulf-Premium-Telecom/
├── README.md                          # Main documentation
├── DEPLOYMENT.md                      # Step-by-step deployment guide
├── QUICK-REFERENCE.md                 # Quick command reference
├── troubleshoot.sh                    # Automated troubleshooting script
│
└── asterisk/
    └── etc/
        └── asterisk/
            ├── asterisk.conf          # Main Asterisk configuration
            ├── pjsip.conf            # SIP trunk configuration (CRITICAL)
            ├── extensions.conf        # Dialplan/call routing (CRITICAL)
            ├── rtp.conf              # RTP media settings
            ├── modules.conf          # Module loading
            ├── logger.conf           # Logging configuration
            ├── queues.conf           # Call center queues
            ├── manager.conf          # AMI for monitoring
            ├── cdr.conf              # Call detail records
            └── musiconhold.conf      # Hold music
```

## Configuration Files Created

### 1. **pjsip.conf** - SIP Trunk Configuration
**Purpose**: Configure IP-based SIP trunks from upstream providers

**Key Features**:
- IP-based authentication (no registration required)
- Multiple upstream provider support (3 templates included)
- IP whitelisting via identify sections
- Codec configuration (ulaw, alaw, g729)
- RTP settings (symmetric, keepalive, timeouts)
- Security settings (ACLs)

**Critical Sections**:
```ini
[transport-udp]              # SIP transport on port 5060
[upstream-provider-X]        # Endpoint configuration
[upstream-provider-X-identify]  # IP whitelisting (MUST BE CONFIGURED)
```

**Action Required**:
- Replace example IPs with actual upstream provider IPs
- Configure NAT settings if behind NAT
- Adjust codec preferences if needed

### 2. **extensions.conf** - Dialplan Configuration
**Purpose**: Route inbound calls to appropriate destinations

**Key Features**:
- `from-upstream` context: Entry point for all inbound calls
- `did-routing` context: Route based on DID (phone number)
- `ivr-main` context: Main IVR menu with options 0-6 and 9
  - Option 1: Sales
  - Option 2: Support
  - Option 3: Billing
  - Option 4: VIP Support
  - Option 5: Account Management
  - Option 6: Emergency Support
  - Option 0: Operator
  - Option 9: Directory
- `queue-*` contexts: Route to call center queues
- Call logging and CDR tracking
- Error handling

**Critical Sections**:
```ini
[from-upstream]    # Entry point from upstream
[did-routing]      # DID-based routing (MUST BE CONFIGURED)
[ivr-main]        # IVR menu
```

**Action Required**:
- Configure your actual DIDs in `did-routing` context
- Customize IVR prompts and menu options
- Set up queue routing based on your needs

### 3. **rtp.conf** - RTP Media Configuration
**Purpose**: Configure voice media (audio) handling

**Key Features**:
- RTP port range: 10000-20000 (MUST open in firewall)
- RTP timeouts for detecting dead calls
- RTP keepalive to maintain NAT bindings
- QoS settings (ToS/CoS)
- Strict RTP security

**Action Required**:
- Ensure firewall allows UDP 10000-20000
- Adjust port range if conflicts exist

### 4. **modules.conf** - Module Loading
**Purpose**: Load only necessary modules for optimal performance

**Key Features**:
- PJSIP stack and all dependencies
- Essential applications (Dial, Queue, Playback, etc.)
- Codec modules (ulaw, alaw, g729, etc.)
- CDR and CEL modules for billing
- Bridge and channel technologies
- Disables unnecessary modules for security

**Action Required**:
- Uncomment codec_g729 if you have G.729 license
- Enable database CDR modules if using MySQL/PostgreSQL

### 5. **logger.conf** - Logging Configuration
**Purpose**: Comprehensive logging for troubleshooting

**Key Features**:
- Multiple log files (full, messages, errors, security)
- Optional PJSIP debug (for signaling issues)
- Optional RTP debug (for audio issues)
- Queue logging for Asternic
- CDR logging

**Action Required**:
- Enable debug logs when troubleshooting
- Disable debug logs after issues are resolved
- Set up log rotation (example provided)

### 6. **queues.conf** - Queue Configuration
**Purpose**: Call center queue setup

**Key Features**:
- 5 pre-configured queues: sales, support, billing, operator, vip
- Various queue strategies (ringall, rrmemory)
- Agent wrap-up time
- Queue announcements
- Call recording support

**Action Required**:
- Add queue members (agents)
- Adjust queue parameters for your needs
- Configure queue timeouts

### 7. **manager.conf** - AMI Configuration
**Purpose**: Asterisk Manager Interface for monitoring and Asternic

**Key Features**:
- 4 pre-configured users: asternic, admin, monitoring, queue_manager
- Restricted to localhost by default
- Granular permissions per user
- Security best practices included

**Action Required**:
- **CRITICAL**: Change all default passwords
- Adjust IP restrictions as needed
- Configure Asternic to use AMI credentials

### 8. **cdr.conf** - Call Detail Records
**Purpose**: Call billing and reporting

**Key Features**:
- CSV file output (Master.csv)
- Configurable batch processing
- Support for database backends
- Detailed call information

**Action Required**:
- Configure database backend if needed (MySQL/PostgreSQL)
- Set up CDR analysis tools

### 9. **musiconhold.conf** - Hold Music
**Purpose**: Music/announcements while on hold

**Key Features**:
- Multiple MOH classes (default, premium, sales, support)
- File-based MOH playback
- Random playback order

**Action Required**:
- Add music files to `/var/lib/asterisk/moh/`
- Use WAV format, 8000Hz, mono
- Ensure proper licensing for music

### 10. **asterisk.conf** - Main Configuration
**Purpose**: Core Asterisk settings

**Key Features**:
- Directory paths
- User/group settings
- High priority mode for real-time performance
- Maximum calls limit
- System name

**Action Required**:
- Adjust maxcalls based on capacity
- Verify directory paths match your installation

## Critical Configuration Steps

### Step 1: Configure Upstream Provider IPs (MANDATORY)

Edit `pjsip.conf`:
```ini
[upstream-provider-1-identify](upstream-identify-template)
endpoint=upstream-provider-1
match=YOUR_UPSTREAM_IP_1    # REPLACE THIS
match=YOUR_UPSTREAM_IP_2    # REPLACE THIS
```

**Without this, NO inbound calls will work!**

### Step 2: Configure DID Routing (MANDATORY)

Edit `extensions.conf`:
```ini
[did-routing]
exten => _966XXXXXXXXX,1,NoOp(Your DID)
same => n,Goto(ivr-main,s,1)
```

### Step 3: Configure NAT (if behind NAT)

Edit `pjsip.conf`:
```ini
[transport-udp]
external_media_address=YOUR_PUBLIC_IP
external_signaling_address=YOUR_PUBLIC_IP
```

### Step 4: Open Firewall Ports (MANDATORY)

```bash
sudo ufw allow 5060/udp
sudo ufw allow 10000:20000/udp
```

### Step 5: Change AMI Passwords (MANDATORY)

Edit `manager.conf` and change all passwords:
```ini
secret=YOUR_STRONG_PASSWORD_HERE
```

## Testing Procedure

### 1. Verify Configuration Syntax
```bash
sudo asterisk -rx "dialplan reload"
sudo asterisk -rx "module reload"
```

### 2. Check Endpoints
```bash
sudo asterisk -rx "pjsip show endpoints"
```

Expected output: Your upstream providers listed

### 3. Check Transport
```bash
sudo asterisk -rx "pjsip show transports"
```

Expected output: transport-udp is CREATED and listening on 0.0.0.0:5060

### 4. Test Inbound Call
- Have upstream provider send test call
- Monitor: `sudo asterisk -rvvv`
- Watch logs: `sudo tail -f /var/log/asterisk/full`

### 5. Verify Audio
- Answer call
- Speak and verify two-way audio
- If one-way audio, check NAT settings and firewall

## Troubleshooting Guide

### Issue: No Inbound Calls

**Checklist**:
1. ✓ Asterisk running? `systemctl status asterisk`
2. ✓ Port 5060 listening? `netstat -ulnp | grep 5060`
3. ✓ Upstream IP configured? Check pjsip.conf
4. ✓ Firewall allows 5060? Check ufw/firewalld
5. ✓ Transport active? `asterisk -rx "pjsip show transports"`

**Debug**:
```bash
asterisk -rvvv
pjsip set logger on
```

### Issue: One-Way Audio

**Checklist**:
1. ✓ Firewall allows 10000-20000/udp?
2. ✓ NAT configured if behind NAT?
3. ✓ RTP symmetric enabled? (in pjsip.conf)
4. ✓ Direct media disabled? (in pjsip.conf)

**Debug**:
```bash
asterisk -rvvv
rtp set debug on
```

### Issue: 403 Forbidden

**Cause**: Upstream IP not whitelisted

**Fix**: Add IP to identify section in pjsip.conf

### Issue: 404 Not Found

**Cause**: DID not configured in dialplan

**Fix**: Add DID to did-routing context in extensions.conf

## Automated Troubleshooting

Run the included script:
```bash
sudo ./troubleshoot.sh
```

This checks:
- Asterisk status
- Network connectivity
- Firewall configuration
- PJSIP endpoints
- Dialplan configuration
- Active calls
- Recent errors
- System resources

## Security Considerations

### 1. IP Whitelisting
Only allow known upstream IPs in pjsip.conf

### 2. AMI Security
- Change all default passwords
- Restrict to localhost or trusted IPs
- Use strong passwords (20+ characters)

### 3. Firewall
- Only open required ports
- Block all other traffic
- Use fail2ban for brute force protection

### 4. Regular Updates
- Keep Asterisk updated
- Apply security patches
- Update OS regularly

### 5. Monitoring
- Review logs daily
- Set up alerts for errors
- Monitor for unauthorized access

## Performance Tuning

### System Resources (per 100 concurrent calls)
- CPU: 2 cores
- RAM: 4 GB
- Network: 1 Gbps
- Bandwidth: ~8.7 Mbps (G.711)

### Asterisk Settings
- `maxcalls`: Set based on capacity (default 1000)
- `maxfiles`: Set to 10000 for high volume
- `highpriority=yes`: Enable for real-time performance

## Integration Points

### Asternic Call Center Stats
- AMI configured (port 5038)
- Queue logs enabled
- CDR available

### CDR Databases
- CSV files by default
- MySQL/PostgreSQL support available
- Configure in cdr.conf

### External Monitoring
- AMI events available
- Syslog integration possible
- REST API via ARI (if needed)

## Maintenance Schedule

### Daily
- Check Asterisk status
- Review error logs
- Monitor disk space

### Weekly
- Backup configuration
- Review CDR statistics
- Check for updates

### Monthly
- Full system backup
- Security audit
- Capacity planning review

## Support Resources

### Documentation
- Main: README.md
- Deployment: DEPLOYMENT.md
- Quick Reference: QUICK-REFERENCE.md

### Asterisk Resources
- Wiki: https://wiki.asterisk.org/
- Forums: https://community.asterisk.org/
- PJSIP: https://wiki.asterisk.org/wiki/display/AST/PJSIP

### Troubleshooting
- Run: `./troubleshoot.sh`
- Check logs: `/var/log/asterisk/full`
- Enable debug: See QUICK-REFERENCE.md

## Key Differences from Standard Setup

This configuration is specifically designed for:

1. **IP-to-IP Routing**: No registration required
2. **Carrier-Grade**: High CPS and call volume
3. **Upstream Integration**: Receives calls from multiple upstream providers
4. **Security**: IP whitelisting and ACLs
5. **Production-Ready**: Comprehensive logging and monitoring
6. **Gulf Region Focus**: Saudi Arabia and MENA traffic patterns

## Success Criteria

Configuration is working correctly when:

- ✓ Asterisk starts without errors
- ✓ Transport shows as CREATED
- ✓ Endpoints are configured
- ✓ Test call from upstream connects
- ✓ Two-way audio works
- ✓ Calls route to correct destinations
- ✓ CDR records are created
- ✓ Queue logs are written
- ✓ No errors in logs
- ✓ System resources are stable

## Next Steps After Deployment

1. Monitor system for 24-48 hours
2. Disable debug logging once stable
3. Fine-tune queue parameters
4. Set up automated backups
5. Configure monitoring alerts
6. Perform load testing
7. Train support staff
8. Document any customizations

## Version Information

- **Configuration Version**: 1.0
- **Compatible with**: Asterisk 16, 18, 19, 20
- **Created**: 2024
- **Author**: Gulf Premium Telecom Engineering Team

## Changes from Default Asterisk

| Setting | Default | This Config | Reason |
|---------|---------|-------------|--------|
| SIP Stack | chan_sip | PJSIP | Modern, better performance |
| Authentication | Registration | IP-based | Carrier-grade IP-to-IP |
| Direct Media | Enabled | Disabled | Better media control |
| RTP Symmetric | Disabled | Enabled | NAT traversal |
| Logging | Minimal | Comprehensive | Troubleshooting |
| Modules | All loaded | Selective | Performance & security |

---

**Document**: Configuration Summary  
**Version**: 1.0  
**Date**: 2024  
**Classification**: Technical Documentation  
**Distribution**: Gulf Premium Telecom Engineering Team
