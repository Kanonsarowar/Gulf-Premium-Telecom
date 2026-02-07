# SIP Trunk Configuration Guide

## Overview

This document provides detailed information about the configured SIP trunks for Gulf Premium Telecom's Asterisk server.

**Your Asterisk Server IP:** `167.172.170.88`

## Configured SIP Trunks

### Supplier Group 1 - General SIP Providers

These trunks are configured for standard inbound SIP traffic with multi-codec support.

| Trunk Name | IP Address | Port | Context | Codecs Supported |
|------------|------------|------|---------|------------------|
| supplier1-trunk1 | 108.61.70.46 | 5060 | from-trunk | ulaw, alaw, gsm, g729 |
| supplier1-trunk2 | 157.90.193.196 | 5060 | from-trunk | ulaw, alaw, gsm, g729 |
| supplier1-trunk3 | 51.77.77.223 | 5060 | from-trunk | ulaw, alaw, gsm, g729 |
| supplier1-trunk4 | 95.217.90.212 | 5060 | from-trunk | ulaw, alaw, gsm, g729 |

**Configuration Details:**
- Type: friend (allows both incoming and outgoing)
- Authentication: IP-based (insecure=port,invite)
- NAT: Enabled with force_rport,comedia
- Qualify: Yes (monitors trunk availability)
- DTMF Mode: RFC2833

### Supplier Group 2 - AWS-Based Provider

High-priority G.729 codec support with AWS infrastructure.

| Trunk Name | IP Address | Port | Context | Primary Codec |
|------------|------------|------|---------|---------------|
| supplier2-aws1 | 52.28.165.40 | 5060 | from-trunk | G.729 |
| supplier2-aws2 | 52.57.172.184 | 5060 | from-trunk | G.729 |
| supplier2-aws3 | 35.156.119.128 | 5060 | from-trunk | G.729 |

**Configuration Details:**
- Type: friend
- Authentication: IP-based (insecure=port,invite)
- Codec Priority: G.729 (primary), GSM, ulaw, alaw
- NAT: Enabled with force_rport,comedia
- Qualify: Yes
- DTMF Mode: RFC2833

**Special Notes:**
- Calls are forwarded automatically to your SIP server
- Numbers must be assigned with application format: `SIP_username_IP`
- AWS IP addresses may change; monitor trunk status regularly

### Supplier Group 3 - Quintum Gateway

E.164 international number format support with SIP/H323 capability.

| Trunk Name | IP Address | Port | Context | Number Format |
|------------|------------|------|---------|---------------|
| supplier3-quintum | 149.12.160.10 | 5060 | from-trunk-e164 | E.164 |

**Configuration Details:**
- Type: friend
- Authentication: IP-based (insecure=port,invite)
- Codecs: G.729, ulaw, alaw (G.711)
- NAT: Enabled with force_rport,comedia
- Qualify: Yes
- DTMF Mode: RFC2833
- Number Format: E.164 International (e.g., +1234567890)

**Special Features:**
- Supports both SIP and H323 protocols
- Expects E.164 format with international country code
- Separate dialplan context for E.164 number handling

## Dialplan Contexts

### from-trunk (Standard Inbound)
Used by Supplier Groups 1 and 2 for regular inbound calls.

**Features:**
- Tracks call with IVR_CALL_ID (unique identifier)
- Records start time
- Identifies supplier via CHANNEL(peername)
- Routes to IVR main menu

### from-trunk-e164 (E.164 Inbound)
Used by Supplier Group 3 (Quintum) for E.164 formatted calls.

**Features:**
- Handles both +prefix and non-prefix E.164 numbers
- Stores original E.164 number in IVR_E164_NUMBER variable
- Tracks supplier as supplier3-quintum
- Routes to IVR main menu

## Codec Configuration

### Global Codec Priority
```
disallow=all
allow=ulaw
allow=alaw
allow=gsm
allow=g729
```

### Per-Trunk Codec Settings

**Supplier Group 1:**
- Supports all codecs: ulaw, alaw, gsm, g729
- No preference order; negotiated with supplier

**Supplier Group 2 (AWS):**
- Primary: G.729 (listed first for priority)
- Fallback: GSM, ulaw, alaw

**Supplier Group 3 (Quintum):**
- Primary: G.729
- Fallback: ulaw, alaw (G.711)

## Security Configuration

All trunks use IP-based authentication with the following security settings:

```
insecure=port,invite
```

This configuration:
- `port`: Accepts calls from any port on the configured IP
- `invite`: Does not require authentication for INVITE messages

**Security Recommendations:**
1. Ensure firewall rules only allow SIP traffic from configured IPs
2. Monitor trunk activity regularly with `asterisk -rx "sip show peers"`
3. Review call logs for suspicious activity
4. Keep Asterisk updated with security patches

## Firewall Configuration

Allow SIP traffic from the following IPs on your firewall:

```bash
# Supplier Group 1
iptables -A INPUT -p udp -s 108.61.70.46 --dport 5060 -j ACCEPT
iptables -A INPUT -p udp -s 157.90.193.196 --dport 5060 -j ACCEPT
iptables -A INPUT -p udp -s 51.77.77.223 --dport 5060 -j ACCEPT
iptables -A INPUT -p udp -s 95.217.90.212 --dport 5060 -j ACCEPT

# Supplier Group 2 (AWS)
iptables -A INPUT -p udp -s 52.28.165.40 --dport 5060 -j ACCEPT
iptables -A INPUT -p udp -s 52.57.172.184 --dport 5060 -j ACCEPT
iptables -A INPUT -p udp -s 35.156.119.128 --dport 5060 -j ACCEPT

# Supplier Group 3 (Quintum)
iptables -A INPUT -p udp -s 149.12.160.10 --dport 5060 -j ACCEPT

# RTP ports for media
iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT
```

## Installation Instructions

### 1. Backup Current Configuration
```bash
sudo cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup
sudo cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup
```

### 2. Copy New Configuration Files
```bash
sudo cp asterisk-config/sip.conf /etc/asterisk/
sudo cp asterisk-config/extensions.conf /etc/asterisk/
```

### 3. Set Proper Ownership
```bash
sudo chown asterisk:asterisk /etc/asterisk/sip.conf
sudo chown asterisk:asterisk /etc/asterisk/extensions.conf
```

### 4. Test Configuration
```bash
sudo asterisk -rx "sip reload"
sudo asterisk -rx "dialplan reload"
```

### 5. Verify Trunk Registration
```bash
sudo asterisk -rx "sip show peers"
```

Expected output should show all 8 trunks with their IPs and status.

## Monitoring and Troubleshooting

### Check Trunk Status
```bash
# View all SIP peers
asterisk -rx "sip show peers"

# Check specific trunk
asterisk -rx "sip show peer supplier1-trunk1"

# Monitor real-time SIP traffic
asterisk -rvvv
sip set debug on
```

### Common Issues

#### Trunk Shows as UNREACHABLE
1. Verify supplier IP is sending OPTIONS or REGISTER messages
2. Check firewall rules allow traffic from supplier IP
3. Confirm supplier has your IP (167.172.170.88) whitelisted
4. Test with: `asterisk -rx "sip show peer <trunkname>"`

#### Codec Negotiation Failure
1. Verify G.729 codec is installed (may require license)
2. Check with: `asterisk -rx "core show codecs"`
3. Install if needed: `apt-get install asterisk-g729` (or from Digium)

#### No Audio on Calls
1. Verify RTP ports (10000-20000) are open
2. Check NAT settings in sip.conf
3. Confirm external IP is correctly configured
4. Review with: `asterisk -rx "rtp set debug on"`

#### E.164 Number Format Issues
1. Verify Quintum trunk sends numbers with + prefix
2. Check dialplan pattern matching with: `asterisk -rx "dialplan show from-trunk-e164"`
3. Monitor with: `asterisk -rvvv` while receiving test calls

### Testing Inbound Calls

1. Request test call from each supplier
2. Monitor Asterisk console: `asterisk -rvvv`
3. Verify caller ID and number format
4. Test IVR menu options
5. Check call is logged in database

### Call Flow Verification

When a call arrives:
1. Asterisk receives INVITE from supplier IP
2. Matches to configured trunk based on IP
3. Routes to appropriate context (from-trunk or from-trunk-e164)
4. Sets tracking variables (IVR_CALL_ID, IVR_SUPPLIER)
5. Answers call and routes to IVR menu
6. Backend AMI captures events and stores in database

## Supplier Contact Information

### Supplier Group 1
- IPs: 108.61.70.46, 157.90.193.196, 51.77.77.223, 95.217.90.212
- Protocol: SIP
- Codecs: All supported

### Supplier Group 2 (AWS-based)
- IPs: 52.28.165.40, 52.57.172.184, 35.156.119.128
- Protocol: SIP
- Port: 5060
- Primary Codec: G.729
- Authentication: IP-based with username format `SIP_username_IP`

### Supplier Group 3 (Quintum)
- IP: 149.12.160.10
- Protocol: SIP, H323
- Codecs: G.729, G.711 (ulaw/alaw)
- Number Format: E.164 International

## Capacity Planning

Current configuration supports:
- **8 SIP trunks** (simultaneous suppliers)
- **Unlimited concurrent calls** (limited by server resources)
- **4 codec types** (ulaw, alaw, gsm, g729)

Recommended server specifications:
- **CPU**: 2+ cores (4+ for high volume)
- **RAM**: 4GB minimum (8GB recommended)
- **Network**: 1Gbps port, low latency (<50ms)
- **Concurrent Calls**: ~100 calls per CPU core

## Maintenance Schedule

### Daily
- Monitor trunk status
- Review call logs for errors
- Check system resources (CPU, memory, disk)

### Weekly
- Test each trunk with sample call
- Review codec usage statistics
- Verify firewall rules are active

### Monthly
- Update Asterisk if security patches available
- Review and rotate logs
- Test disaster recovery procedures
- Verify supplier IP addresses haven't changed

## Support

For configuration issues:
- Asterisk Logs: `/var/log/asterisk/full`
- SIP Debug: `asterisk -rx "sip set debug on"`
- Dialplan Debug: `asterisk -rx "dialplan set debug on"`

For application support:
- Backend Logs: Check PM2 logs
- Database: MongoDB connection status
- WebSocket: Browser console for connectivity

## Change Log

### 2026-02-07
- Initial trunk configuration
- Added 8 supplier trunks (4 + 3 + 1)
- Configured multi-codec support
- Added E.164 number format handling
- Created monitoring and troubleshooting guides