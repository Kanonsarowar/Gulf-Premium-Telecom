# Asterisk Troubleshooting Guide
## Gulf Premium Telecom

This guide covers common issues and their resolutions for the Asterisk PBX configuration.

---

## Table of Contents
1. [No Audio / One-Way Audio](#no-audio--one-way-audio)
2. [Calls Not Coming In](#calls-not-coming-in)
3. [Twilio Connection Issues](#twilio-connection-issues)
4. [IVR Problems](#ivr-problems)
5. [DTMF Issues](#dtmf-issues)
6. [High Call Volume Issues](#high-call-volume-issues)
7. [NAT and Firewall Issues](#nat-and-firewall-issues)
8. [CDR Not Recording](#cdr-not-recording)

---

## No Audio / One-Way Audio

### Symptoms
- Caller can't hear you, but you can hear them (or vice versa)
- No audio at all on either side
- Choppy or robotic audio

### Diagnosis

#### Step 1: Check RTP Debug
```bash
sudo asterisk -rvvv
*CLI> rtp set debug on
# Make a test call
*CLI> rtp set debug off
```

Look for:
- RTP packets being sent/received
- "Sent RTP packet to" and "Got RTP packet from" messages
- Any error messages about ports or addresses

#### Step 2: Verify Firewall
```bash
# Check if RTP ports are open
sudo ufw status | grep "10000:20000"

# Check if ports are listening
sudo netstat -tulpn | grep asterisk
```

Should see:
```
udp    0.0.0.0:5060    asterisk
udp    0.0.0.0:10000   asterisk
udp    0.0.0.0:10001   asterisk
...
```

#### Step 3: Check NAT Configuration
```bash
sudo nano /etc/asterisk/pjsip.conf
```

Verify these settings:
```ini
external_media_address=YOUR_PUBLIC_IP
external_signaling_address=YOUR_PUBLIC_IP
rtp_symmetric=yes
force_rport=yes
rewrite_contact=yes
```

### Solutions

#### Solution 1: Fix Public IP Configuration
```bash
# Get your public IP
curl -s ifconfig.me

# Update pjsip.conf
sudo nano /etc/asterisk/pjsip.conf
# Change YOUR_PUBLIC_IP to actual IP address

# Reload
sudo asterisk -rx "pjsip reload"
```

#### Solution 2: Open Firewall Ports
```bash
# Open SIP signaling
sudo ufw allow 5060/udp
sudo ufw allow 5060/tcp

# Open RTP media
sudo ufw allow 10000:20000/udp

# Reload firewall
sudo ufw reload
```

#### Solution 3: Check RTP Configuration
```bash
sudo nano /etc/asterisk/rtp.conf
```

Ensure:
```ini
rtpstart=10000
rtpend=20000
rtpchecksums=yes
rtptimeout=60
```

#### Solution 4: Disable Direct Media
In pjsip.conf, ensure:
```ini
direct_media=no
```

This forces RTP through Asterisk, solving many NAT issues.

---

## Calls Not Coming In

### Symptoms
- No incoming calls from carriers
- Calls are rejected or timeout
- Asterisk shows no activity

### Diagnosis

#### Step 1: Enable PJSIP Debugging
```bash
sudo asterisk -rvvv
*CLI> pjsip set logger on
```

Have carrier send a test call and watch for:
- INVITE messages
- Authentication attempts
- Error responses (403, 404, 503, etc.)

#### Step 2: Check Endpoint Configuration
```bash
*CLI> pjsip show endpoints
```

Should show your carrier trunks:
```
Endpoint:  carrier1-trunk/anonymous    Unavailable    0
```

#### Step 3: Verify IP Matching
```bash
*CLI> pjsip show identifies
```

Should show:
```
Identify:  carrier1-identify
    Endpoint:  carrier1-trunk
    Match:     203.0.113.0/24
```

### Solutions

#### Solution 1: Fix IP Address in ACL
```bash
sudo nano /etc/asterisk/pjsip.conf
```

Update carrier IP in three places:

1. ACL section:
```ini
[acl-carrier1]
type=acl
deny=0.0.0.0/0
permit=ACTUAL_CARRIER_IP/24
```

2. Identify section:
```ini
[carrier1-identify]
type=identify
endpoint=carrier1-trunk
match=ACTUAL_CARRIER_IP/24
```

Reload:
```bash
sudo asterisk -rx "pjsip reload"
```

#### Solution 2: Check Firewall
```bash
# Check if carrier IP is blocked
sudo iptables -L -n | grep DROP

# Allow carrier IP specifically
sudo ufw allow from CARRIER_IP to any port 5060
```

#### Solution 3: Verify SIP Port
```bash
# Check if Asterisk is listening
sudo netstat -tulpn | grep 5060
```

Should show:
```
udp    0.0.0.0:5060    0.0.0.0:*    asterisk
```

If not:
```bash
sudo systemctl restart asterisk
```

#### Solution 4: Check Asterisk Status
```bash
sudo systemctl status asterisk
```

If not running:
```bash
sudo systemctl start asterisk
```

Check logs:
```bash
sudo tail -f /var/log/asterisk/messages
```

---

## Twilio Connection Issues

### Symptoms
- Can't make outbound calls via Twilio
- "503 Service Unavailable" errors
- Authentication failures

### Diagnosis

#### Step 1: Test Twilio Credentials
```bash
# From Asterisk CLI
*CLI> pjsip show auths
```

Verify twilio-auth is present:
```
Auth:  twilio-auth
  Username:  YOUR_USERNAME
  Password:  <hidden>
```

#### Step 2: Test Connectivity
```bash
# Ping Twilio
ping YOUR_DOMAIN.pstn.twilio.com

# Check DNS resolution
nslookup YOUR_DOMAIN.pstn.twilio.com
```

#### Step 3: Test Outbound Call
```bash
# From Asterisk CLI
*CLI> channel originate PJSIP/+1234567890@twilio-trunk application Playback demo-congrats
```

### Solutions

#### Solution 1: Verify Twilio Credentials
1. Log into [Twilio Console](https://console.twilio.com/)
2. Go to Elastic SIP Trunking → Your Trunk
3. Note the SIP URI, Username, and Password
4. Update `/etc/asterisk/pjsip.conf`:

```ini
from_user=YOUR_ACTUAL_USERNAME
from_domain=YOUR_ACTUAL_DOMAIN.pstn.twilio.com

[twilio-auth]
type=auth
auth_type=userpass
username=YOUR_ACTUAL_USERNAME
password=YOUR_ACTUAL_PASSWORD

[twilio-trunk]
type=aor
contact=sip:YOUR_ACTUAL_DOMAIN.pstn.twilio.com
```

Reload:
```bash
sudo asterisk -rx "pjsip reload"
```

#### Solution 2: Add Asterisk IP to Twilio
1. In Twilio Console → Elastic SIP Trunking → Termination
2. Add your Asterisk server's public IP to "IP Access Control List"
3. Save changes
4. Test call again

#### Solution 3: Check Twilio IP ACL
In `/etc/asterisk/pjsip.conf`, ensure Twilio IPs are correct:

```ini
[acl-twilio]
type=acl
deny=0.0.0.0/0
```

Add all Twilio IPs for your region from:
https://www.twilio.com/docs/sip-trunking/ip-addresses

#### Solution 4: Enable Registration (if required)
Some Twilio setups require registration:

```ini
[twilio-registration]
type=registration
outbound_auth=twilio-auth
server_uri=sip:YOUR_DOMAIN.pstn.twilio.com
client_uri=sip:YOUR_USERNAME@YOUR_DOMAIN.pstn.twilio.com
retry_interval=60
```

Check registration status:
```bash
*CLI> pjsip show registrations
```

---

## IVR Problems

### Symptoms
- IVR doesn't play audio
- DTMF keys don't work
- Calls go straight to voicemail
- "File not found" errors

### Diagnosis

#### Step 1: Check Audio Files
```bash
ls -la /var/lib/asterisk/sounds/custom/
```

Should show:
```
welcome.wav
ivr-menu.wav
invalid-option.wav
timeout.wav
```

#### Step 2: Test Audio File
```bash
*CLI> file convert /var/lib/asterisk/sounds/custom/welcome.wav /tmp/test.wav
```

#### Step 3: Check Dialplan
```bash
*CLI> dialplan show ivr-main
```

Should show the IVR context with all options.

### Solutions

#### Solution 1: Create Missing Audio Files
```bash
# Install text-to-speech
sudo apt install -y festival

cd /var/lib/asterisk/sounds/custom/

# Create files
echo "Welcome to Gulf Premium Telecom" | text2wave -o welcome.wav
echo "Press 1 for Sales, Press 2 for Support, Press 3 for Billing, Press 0 for Operator" | text2wave -o ivr-menu.wav
echo "Invalid option. Please try again" | text2wave -o invalid-option.wav
echo "No input received. Goodbye" | text2wave -o timeout.wav

# Fix permissions
sudo chown asterisk:asterisk *.wav
```

#### Solution 2: Fix Audio Format
Asterisk prefers specific formats:

```bash
cd /var/lib/asterisk/sounds/custom/

# Convert to correct format (8kHz, 16-bit, mono)
for file in *.wav; do
    sox "$file" -r 8000 -c 1 -b 16 "converted_$file"
    mv "converted_$file" "$file"
done
```

#### Solution 3: Check IVR Routing
```bash
sudo nano /etc/asterisk/extensions.conf
```

Ensure calls route to IVR:
```ini
[from-carriers]
exten => _X.,n,Goto(ivr-main,s,1)
```

Reload:
```bash
sudo asterisk -rx "dialplan reload"
```

#### Solution 4: Enable DTMF Debugging
```bash
*CLI> core set debug 5
*CLI> core set verbose 5
```

Make test call and press keys. Look for DTMF messages.

---

## DTMF Issues

### Symptoms
- IVR doesn't respond to key presses
- Keys work intermittently
- Wrong keys registered

### Diagnosis

#### Step 1: Check DTMF Mode
```bash
*CLI> pjsip show endpoint carrier1-trunk
```

Look for:
```
dtmf_mode: rfc4733
```

#### Step 2: Enable DTMF Debug
```bash
*CLI> core set debug dtmf 5
```

### Solutions

#### Solution 1: Set Correct DTMF Mode
In `/etc/asterisk/pjsip.conf`:

```ini
dtmf_mode=rfc4733
```

Try alternatives if RFC4733 doesn't work:
- `inband` - DTMF tones in audio
- `info` - SIP INFO messages
- `auto` - Auto-detect

#### Solution 2: Increase Timeout
In `/etc/asterisk/extensions.conf`:

```ini
same => n,Set(TIMEOUT(digit)=5)
same => n,Set(TIMEOUT(response)=10)
```

---

## High Call Volume Issues

### Symptoms
- Calls dropping under load
- "Too many open files" errors
- Asterisk becomes unresponsive
- Poor audio quality during peak times

### Solutions

#### Solution 1: Increase File Descriptors
```bash
sudo nano /etc/security/limits.conf
```

Add:
```
asterisk soft nofile 65535
asterisk hard nofile 65535
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart asterisk
```

#### Solution 2: Expand RTP Port Range
```bash
sudo nano /etc/asterisk/rtp.conf
```

```ini
rtpstart=10000
rtpend=30000
```

Open firewall:
```bash
sudo ufw allow 10000:30000/udp
```

#### Solution 3: Enable High Priority
Already configured in `asterisk.conf`:
```ini
highpriority=yes
```

#### Solution 4: Optimize System
```bash
# Increase kernel parameters
sudo nano /etc/sysctl.conf
```

Add:
```
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.udp_mem=65536 131072 262144
```

Apply:
```bash
sudo sysctl -p
```

---

## NAT and Firewall Issues

### Symptoms
- Calls work internally but not externally
- One-way audio from specific locations
- SIP messages not reaching Asterisk

### Solutions

#### Solution 1: Configure NAT Properly
```bash
sudo nano /etc/asterisk/pjsip.conf
```

```ini
[transport-udp]
external_media_address=YOUR_PUBLIC_IP
external_signaling_address=YOUR_PUBLIC_IP
local_net=192.168.0.0/16
local_net=10.0.0.0/8
```

#### Solution 2: Port Forwarding
On your router/firewall:
- Forward UDP 5060 → Asterisk server
- Forward UDP 10000-20000 → Asterisk server

#### Solution 3: Use STUN
```bash
sudo nano /etc/asterisk/rtp.conf
```

```ini
stunaddr=stun.l.google.com:19302
```

---

## CDR Not Recording

### Symptoms
- No CDR files generated
- Empty CDR directory
- Missing call records

### Solutions

#### Solution 1: Check CDR Module
```bash
*CLI> module show like cdr
*CLI> cdr show status
```

If not loaded:
```bash
*CLI> module load cdr_csv.so
*CLI> module load cdr_custom.so
```

#### Solution 2: Check CDR Configuration
```bash
sudo nano /etc/asterisk/cdr.conf
```

Ensure:
```ini
[general]
enable=yes
```

Reload:
```bash
*CLI> module reload cdr
```

#### Solution 3: Check Permissions
```bash
sudo ls -la /var/log/asterisk/cdr-csv/
sudo chown -R asterisk:asterisk /var/log/asterisk/
```

#### Solution 4: Enable CDR in Dialplan
```ini
exten => _X.,n,Set(CDR(accountcode)=carrier)
```

---

## Getting Help

### Useful CLI Commands
```bash
# Show active channels
core show channels verbose

# Show PJSIP status
pjsip show endpoints
pjsip show transports
pjsip show auths

# Show dialplan
dialplan show

# Debugging
pjsip set logger on
rtp set debug on
core set debug 5
core set verbose 5

# Turn off debugging
pjsip set logger off
rtp set debug off
core set debug 0
```

### Log Files
```bash
# Main log
tail -f /var/log/asterisk/full

# Messages
tail -f /var/log/asterisk/messages

# CDR
tail -f /var/log/asterisk/cdr-csv/Master.csv
```

### Community Resources
- [Asterisk Forums](https://community.asterisk.org/)
- [Asterisk Wiki](https://wiki.asterisk.org/)
- [PJSIP Troubleshooting](https://wiki.asterisk.org/wiki/display/AST/PJSIP+Troubleshooting)

---

**Note:** Always test configuration changes in a non-production environment first.
