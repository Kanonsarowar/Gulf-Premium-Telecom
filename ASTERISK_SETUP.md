# Asterisk PBX Configuration Guide

## Overview
Complete Asterisk configuration for Gulf Premium Telecom IPRN system handling IP-to-IP inbound calls with DID routing.

## Version Requirements
- **Asterisk:** 18.x, 19.x, or 20.x (LTS versions)
- **OS:** Ubuntu 22.04 LTS or Debian 12
- **PostgreSQL:** 14+ for CDR storage
- **Node.js:** 20+ for AGI server

## System Requirements

### Minimum (Up to 100 concurrent calls):
- CPU: 4 cores
- RAM: 8GB
- Disk: 100GB SSD
- Network: 100Mbps

### Recommended (Up to 1000 concurrent calls):
- CPU: 16 cores
- RAM: 32GB
- Disk: 500GB NVMe SSD
- Network: 1Gbps

## Installation Steps

### 1. Install Asterisk from Source

```bash
#!/bin/bash
# install_asterisk.sh

# Update system
apt-get update && apt-get upgrade -y

# Install dependencies
apt-get install -y \
    build-essential \
    git \
    wget \
    libssl-dev \
    libncurses5-dev \
    libnewt-dev \
    libxml2-dev \
    linux-headers-$(uname -r) \
    libsqlite3-dev \
    uuid-dev \
    libjansson-dev \
    libedit-dev \
    libpq-dev \
    postgresql-client

# Download Asterisk 20 LTS
cd /usr/src
wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
tar xvf asterisk-20-current.tar.gz
cd asterisk-20*/

# Install prerequisites
contrib/scripts/install_prereq install

# Configure build
./configure --with-pjproject-bundled --with-jansson-bundled

# Select modules (run menuselect)
make menuselect.makeopts
menuselect/menuselect \
    --enable res_pjsip \
    --enable res_pjsip_session \
    --enable res_pjsip_nat \
    --enable res_pjsip_acl \
    --enable cdr_pgsql \
    --enable cel_pgsql \
    --enable res_agi \
    --enable app_queue \
    --enable app_dial \
    --enable app_playback \
    --enable app_mixmonitor \
    --disable chan_sip \
    menuselect.makeopts

# Compile and install
make -j$(nproc)
make install
make samples  # Optional: install sample configs
make config   # Install systemd service

# Install additional sounds
make install-sounds

# Create asterisk user
useradd -r -d /var/lib/asterisk -s /bin/bash asterisk
chown -R asterisk:asterisk /var/lib/asterisk
chown -R asterisk:asterisk /var/spool/asterisk
chown -R asterisk:asterisk /var/log/asterisk
chown -R asterisk:asterisk /etc/asterisk

# Configure Asterisk to run as asterisk user
sed -i 's/#AST_USER="asterisk"/AST_USER="asterisk"/' /etc/default/asterisk
sed -i 's/#AST_GROUP="asterisk"/AST_GROUP="asterisk"/' /etc/default/asterisk

# Start Asterisk
systemctl enable asterisk
systemctl start asterisk

echo "Asterisk installation complete!"
asterisk -rx "core show version"
```

## Configuration Files

### 1. pjsip.conf - SIP Trunk Configuration

```ini
; /etc/asterisk/pjsip.conf
; Gulf Premium Telecom - PJSIP Configuration

;===============================================
; TRANSPORT CONFIGURATION
;===============================================

[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060
external_media_address=YOUR_PUBLIC_IP_HERE
external_signaling_address=YOUR_PUBLIC_IP_HERE
local_net=10.0.0.0/8
local_net=172.16.0.0/12
local_net=192.168.0.0/16

; Enable TLS transport (optional, for secure signaling)
[transport-tls]
type=transport
protocol=tls
bind=0.0.0.0:5061
cert_file=/etc/asterisk/keys/asterisk.pem
priv_key_file=/etc/asterisk/keys/asterisk.key
method=tlsv1_2

;===============================================
; ACL CONFIGURATION (Carrier IP Whitelist)
;===============================================

[acl]
type=acl
deny=0.0.0.0/0.0.0.0
; Add your carrier IPs here
permit=203.0.113.0/24
permit=198.51.100.0/24
permit=192.0.2.10/32

;===============================================
; INBOUND TRUNK TEMPLATES
;===============================================

[trunk-defaults](!)
type=endpoint
context=from-trunk
dtmf_mode=rfc4733
disallow=all
allow=ulaw
allow=alaw
allow=g729
rtp_symmetric=yes
force_rport=yes
rewrite_contact=yes
direct_media=no
trust_id_inbound=yes
send_pai=yes
media_encryption=no
ice_support=no

[trunk-auth](!)
type=identify
match_header=From

;===============================================
; PREMIUM TRUNK - HIGH QUALITY (Saudi Arabia)
;===============================================

[premium-ksa-trunk](trunk-defaults)
aors=premium-ksa-trunk
acl=acl

[premium-ksa-trunk]
type=aor
contact=sip:203.0.113.10:5060
qualify_frequency=60

[premium-ksa-trunk]
type=identify
endpoint=premium-ksa-trunk
match=203.0.113.0/24

;===============================================
; STANDARD TRUNK - ECONOMY ROUTES
;===============================================

[standard-trunk](trunk-defaults)
aors=standard-trunk
acl=acl

[standard-trunk]
type=aor
contact=sip:198.51.100.20:5060
qualify_frequency=60

[standard-trunk]
type=identify
endpoint=standard-trunk
match=198.51.100.0/24

;===============================================
; ASIA/MENA TRUNK
;===============================================

[asia-trunk](trunk-defaults)
aors=asia-trunk
acl=acl

[asia-trunk]
type=aor
contact=sip:192.0.2.30:5060
qualify_frequency=60

[asia-trunk]
type=identify
endpoint=asia-trunk
match=192.0.2.0/24

;===============================================
; OUTBOUND TRUNK FOR ROUTING
;===============================================

[outbound-provider](trunk-defaults)
type=endpoint
context=from-internal
aors=outbound-provider
outbound_auth=outbound-provider-auth

[outbound-provider]
type=aor
contact=sip:provider.example.com:5060

[outbound-provider-auth]
type=auth
auth_type=userpass
username=your_username
password=your_password

[outbound-provider]
type=identify
endpoint=outbound-provider
match=provider.example.com
```

### 2. extensions.conf - Dialplan Configuration

```ini
; /etc/asterisk/extensions.conf
; Gulf Premium Telecom - Dialplan Configuration

[general]
static=yes
writeprotect=no
clearglobalvars=no

;===============================================
; GLOBAL VARIABLES
;===============================================

[globals]
; AGI Server
AGI_SERVER=127.0.0.1
AGI_PORT=4573

; Recording path
RECORDING_PATH=/var/spool/asterisk/monitor

; Timeouts
RING_TIMEOUT=30
QUEUE_TIMEOUT=300

;===============================================
; INBOUND FROM TRUNK (Main Entry Point)
;===============================================

[from-trunk]
exten => _X.,1,NoOp(=== Inbound Call from ${CALLERID(all)} to ${EXTEN} ===)
    same => n,Set(DID=${EXTEN})
    same => n,Set(CALLERID_NUM=${CALLERID(num)})
    same => n,Set(UNIQUEID=${UNIQUEID})
    same => n,Set(CHANNEL_NAME=${CHANNEL})
    
    ; Log call details
    same => n,NoOp(DID: ${DID}, Caller: ${CALLERID_NUM}, UniqueID: ${UNIQUEID})
    
    ; Answer the call
    same => n,Answer()
    same => n,Wait(1)
    
    ; Call AGI script for routing decision
    same => n,AGI(agi://127.0.0.1:4573,routing)
    same => n,NoOp(AGI Result - Action: ${ROUTING_ACTION}, Destination: ${ROUTING_DESTINATION})
    
    ; Check AGI result
    same => n,GotoIf($["${ROUTING_ACTION}" = ""]?no-route)
    
    ; Route based on action
    same => n,GotoIf($["${ROUTING_ACTION}" = "dial"]?action-dial)
    same => n,GotoIf($["${ROUTING_ACTION}" = "queue"]?action-queue)
    same => n,GotoIf($["${ROUTING_ACTION}" = "ivr"]?action-ivr)
    same => n,GotoIf($["${ROUTING_ACTION}" = "voicemail"]?action-voicemail)
    same => n,GotoIf($["${ROUTING_ACTION}" = "hangup"]?action-hangup)
    
    ; Default: no valid action
    same => n(no-route),NoOp(No routing found for DID ${DID})
    same => n,Playback(ss-noservice)
    same => n,Hangup(1)

;===============================================
; ROUTING ACTIONS
;===============================================

; Direct Dial
same => n(action-dial),NoOp(=== Direct Dial to ${ROUTING_DESTINATION} ===)
    same => n,Set(CALLED_NUMBER=${ROUTING_DESTINATION})
    same => n,MixMonitor(${RECORDING_PATH}/${UNIQUEID}.wav,b)
    same => n,Dial(PJSIP/${CALLED_NUMBER}@outbound-provider,${RING_TIMEOUT},tT)
    same => n,NoOp(Dial Status: ${DIALSTATUS})
    same => n,GotoIf($["${DIALSTATUS}" = "ANSWER"]?dial-answered:dial-failed)
    same => n(dial-answered),Hangup(16)
    same => n(dial-failed),Playback(ss-noservice)
    same => n,Hangup(1)

; Queue Routing
same => n(action-queue),NoOp(=== Queue Call to ${ROUTING_DESTINATION} ===)
    same => n,Set(QUEUE_NAME=${ROUTING_DESTINATION})
    same => n,MixMonitor(${RECORDING_PATH}/${UNIQUEID}.wav,b)
    same => n,Queue(${QUEUE_NAME},tT,,,${QUEUE_TIMEOUT})
    same => n,NoOp(Queue Status: ${QUEUESTATUS})
    same => n,GotoIf($["${QUEUESTATUS}" = "TIMEOUT"]?queue-timeout:queue-other)
    same => n(queue-timeout),Playback(queue-thankyou)
    same => n,Voicemail(${QUEUE_NAME}@default,u)
    same => n,Hangup(16)
    same => n(queue-other),Hangup(16)

; IVR Routing
same => n(action-ivr),NoOp(=== IVR Menu ${ROUTING_DESTINATION} ===)
    same => n,Set(IVR_MENU=${ROUTING_DESTINATION})
    same => n,Goto(ivr-${IVR_MENU},s,1)

; Voicemail
same => n(action-voicemail),NoOp(=== Voicemail ${ROUTING_DESTINATION} ===)
    same => n,Set(VM_BOX=${ROUTING_DESTINATION})
    same => n,Voicemail(${VM_BOX}@default,u)
    same => n,Hangup(16)

; Hangup
same => n(action-hangup),NoOp(=== Hangup per routing rule ===)
    same => n,Playback(ss-noservice)
    same => n,Hangup(1)

;===============================================
; IVR MENUS
;===============================================

[ivr-main]
exten => s,1,NoOp(=== Main IVR Menu ===)
    same => n,Answer()
    same => n,Wait(1)
    same => n,Set(IVR_RETRIES=0)
    same => n(ivr-start),Background(custom/welcome)
    same => n,Background(custom/press-1-for-sales)
    same => n,Background(custom/press-2-for-support)
    same => n,Background(custom/press-3-for-billing)
    same => n,WaitExten(10)

exten => 1,1,NoOp(Sales selected)
    same => n,Queue(sales,tT,,,${QUEUE_TIMEOUT})
    same => n,Hangup(16)

exten => 2,1,NoOp(Support selected)
    same => n,Queue(support,tT,,,${QUEUE_TIMEOUT})
    same => n,Hangup(16)

exten => 3,1,NoOp(Billing selected)
    same => n,Queue(billing,tT,,,${QUEUE_TIMEOUT})
    same => n,Hangup(16)

exten => i,1,NoOp(Invalid input)
    same => n,Set(IVR_RETRIES=$[${IVR_RETRIES} + 1])
    same => n,GotoIf($[${IVR_RETRIES} > 2]?ivr-timeout:ivr-retry)
    same => n(ivr-retry),Playback(invalid)
    same => n,Goto(s,ivr-start)
    same => n(ivr-timeout),Playback(goodbye)
    same => n,Hangup(1)

exten => t,1,NoOp(Timeout)
    same => n,Playback(goodbye)
    same => n,Hangup(1)

;===============================================
; OUTBOUND FROM INTERNAL (for testing)
;===============================================

[from-internal]
exten => _+X.,1,NoOp(=== Outbound Call to ${EXTEN} ===)
    same => n,Set(CALLERID(num)=+966501234567)
    same => n,Dial(PJSIP/${EXTEN}@outbound-provider,60,tT)
    same => n,Hangup(16)

;===============================================
; HANGUP HANDLER
;===============================================

[hangup-handler]
exten => h,1,NoOp(=== Call Ended ===)
    same => n,NoOp(Duration: ${CDR(duration)}, Billsec: ${CDR(billsec)})
    same => n,NoOp(Disposition: ${CDR(disposition)})
    same => n,Return()
```

### 3. queues.conf - Call Queue Configuration

```ini
; /etc/asterisk/queues.conf
; Gulf Premium Telecom - Queue Configuration

[general]
persistentmembers=yes
autofill=yes
monitor-type=MixMonitor
updatecdr=yes

;===============================================
; QUEUE STRATEGIES
;===============================================
; ringall - ring all available members
; leastrecent - ring member which was least recently called
; fewestcalls - ring member with fewest completed calls
; random - ring random member
; rrmemory - round robin with memory

;===============================================
; SALES QUEUE
;===============================================

[sales]
strategy=ringall
timeout=30
retry=5
maxlen=50
announce=custom/sales-welcome
announce-frequency=45
announce-holdtime=yes
announce-position=yes
periodic-announce=custom/please-hold
periodic-announce-frequency=60
musicclass=default
joinempty=yes
leavewhenempty=no
ringinuse=no
memberdelay=0
weight=0
wrapuptime=10
autofill=yes
autopause=yes
autopausedelay=10

; Static members (SIP phones or external numbers)
; member => PJSIP/1001,0,Sales Agent 1,hint:1001@default
; member => PJSIP/1002,0,Sales Agent 2,hint:1002@default

;===============================================
; SUPPORT QUEUE
;===============================================

[support]
strategy=leastrecent
timeout=30
retry=5
maxlen=100
announce=custom/support-welcome
announce-frequency=45
announce-holdtime=yes
announce-position=yes
periodic-announce=custom/please-hold
periodic-announce-frequency=60
musicclass=default
joinempty=yes
leavewhenempty=no
ringinuse=no
memberdelay=0
weight=0
wrapuptime=15
autofill=yes
autopause=yes
autopausedelay=10

;===============================================
; BILLING QUEUE
;===============================================

[billing]
strategy=fewestcalls
timeout=30
retry=5
maxlen=20
announce=custom/billing-welcome
announce-frequency=60
announce-holdtime=yes
announce-position=yes
periodic-announce=custom/please-hold
periodic-announce-frequency=60
musicclass=default
joinempty=yes
leavewhenempty=no
ringinuse=no
memberdelay=0
weight=0
wrapuptime=20
autofill=yes
autopause=yes
autopausedelay=10
```

### 4. cdr_pgsql.conf - CDR Database Configuration

```ini
; /etc/asterisk/cdr_pgsql.conf
; Gulf Premium Telecom - PostgreSQL CDR Configuration

[global]
hostname=localhost
port=5432
dbname=gulf_premium_telecom
user=asterisk_cdr
password=SECURE_PASSWORD_HERE
table=call_detail_records

; Connection settings
connect_timeout=10
max_connections=10

; Encoding
encoding=UTF8

; Enable CDR
enabled=yes
```

### 5. manager.conf - AMI Configuration (for Asternic)

```ini
; /etc/asterisk/manager.conf
; Gulf Premium Telecom - Asterisk Manager Interface

[general]
enabled=yes
port=5038
bindaddr=127.0.0.1
displayconnects=no
timestampevents=yes
webenabled=yes

;===============================================
; AMI USERS
;===============================================

[admin]
secret=STRONG_PASSWORD_HERE
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.0
permit=10.0.0.0/255.0.0.0
read=system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
write=system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
writetimeout=5000

[asternic]
secret=ASTERNIC_PASSWORD_HERE
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.0
read=system,call,log,agent,user,cdr,reporting
write=system,call,agent,user
writetimeout=5000
```

### 6. rtp.conf - RTP Media Configuration

```ini
; /etc/asterisk/rtp.conf
; Gulf Premium Telecom - RTP Configuration

[general]
; RTP port range (adjust firewall accordingly)
rtpstart=10000
rtpend=20000

; Enable RTCP
rtcpenable=yes
rtcpinterval=5000

; STUN server for NAT (optional)
; stunaddr=stun.example.com:3478
; stunrefresh=30

; RTP keepalive
rtpkeepalive=5

; DTMF mode
dtmfmode=rfc2833

; ICE support (disable for better performance)
icesupport=no

; Enable strict RTP learning (security)
strictrtp=yes
```

### 7. modules.conf - Module Loading

```ini
; /etc/asterisk/modules.conf
; Gulf Premium Telecom - Module Configuration

[modules]
autoload=yes

; Don't load deprecated chan_sip
noload => chan_sip.so

; Load essential modules
require = res_pjsip.so
require = res_pjsip_session.so
require = cdr_pgsql.so
require = res_agi.so
require = app_queue.so
require = app_dial.so
require = app_mixmonitor.so
```

## Firewall Configuration

```bash
#!/bin/bash
# firewall_setup.sh

# Allow SSH
ufw allow 22/tcp

# Allow SIP signaling
ufw allow 5060/udp
ufw allow 5060/tcp

# Allow TLS SIP (optional)
ufw allow 5061/tcp

# Allow RTP media
ufw allow 10000:20000/udp

# Allow AMI (localhost only, use SSH tunnel for remote)
# ufw allow from 127.0.0.1 to any port 5038

# Enable firewall
ufw --force enable

echo "Firewall configured!"
ufw status verbose
```

## System Optimization

```bash
#!/bin/bash
# system_optimization.sh

# Increase file descriptors
echo "asterisk soft nofile 100000" >> /etc/security/limits.conf
echo "asterisk hard nofile 100000" >> /etc/security/limits.conf

# Network optimizations
cat >> /etc/sysctl.conf <<EOF

# Network performance tuning for VoIP
net.core.rmem_max=16777216
net.core.wmem_max=16777216
net.core.rmem_default=262144
net.core.wmem_default=262144
net.ipv4.tcp_rmem=4096 87380 16777216
net.ipv4.tcp_wmem=4096 65536 16777216
net.core.netdev_max_backlog=5000
net.ipv4.ip_local_port_range=1024 65535

# Disable IPv6 (if not used)
net.ipv6.conf.all.disable_ipv6=1
net.ipv6.conf.default.disable_ipv6=1
EOF

sysctl -p

echo "System optimization complete!"
```

## Asterisk CLI Commands for Troubleshooting

```bash
# Check PJSIP endpoints
asterisk -rx "pjsip show endpoints"

# Check PJSIP transports
asterisk -rx "pjsip show transports"

# Check active channels
asterisk -rx "core show channels verbose"

# Check queue status
asterisk -rx "queue show"

# Enable SIP debugging
asterisk -rx "pjsip set logger on"

# Enable RTP debugging
asterisk -rx "rtp set debug on"

# Check CDR status
asterisk -rx "cdr show status"

# Show call statistics
asterisk -rx "core show calls"

# Check module status
asterisk -rx "module show like pjsip"

# Reload dialplan
asterisk -rx "dialplan reload"

# Reload PJSIP
asterisk -rx "module reload res_pjsip.so"
```

## Testing the Configuration

```bash
#!/bin/bash
# test_asterisk.sh

echo "=== Testing Asterisk Configuration ==="

# Test configuration syntax
echo "1. Testing configuration syntax..."
asterisk -rx "core show settings" | head -20

# Test PJSIP endpoints
echo "2. Testing PJSIP endpoints..."
asterisk -rx "pjsip show endpoints" | grep "Endpoint:"

# Test database connection
echo "3. Testing CDR database..."
asterisk -rx "cdr show status"

# Test queues
echo "4. Testing queues..."
asterisk -rx "queue show" | grep "^[a-z]"

# Test dialplan
echo "5. Testing dialplan..."
asterisk -rx "dialplan show from-trunk"

echo "=== Test Complete ==="
```

## Monitoring and Maintenance

### Daily checks:
```bash
# Check for errors in logs
tail -100 /var/log/asterisk/messages | grep -i error

# Check active calls
asterisk -rx "core show calls"

# Check trunk status
asterisk -rx "pjsip show endpoints" | grep -A2 "Endpoint:"
```

### Weekly maintenance:
```bash
# Rotate logs
logrotate /etc/logrotate.d/asterisk

# Check disk space
df -h /var/spool/asterisk/monitor

# Archive old recordings
find /var/spool/asterisk/monitor -name "*.wav" -mtime +30 -exec gzip {} \;
```

## Next Steps

1. **Install Node.js AGI Server** (see AGI_SERVER.md)
2. **Configure PostgreSQL Database** (see DATABASE_SCHEMA.md)
3. **Test inbound call flow**
4. **Set up Asternic Call Center**
5. **Configure monitoring and alerting**
6. **Load test with SIPp**

## Support and Troubleshooting

### Common Issues:

**One-way audio:**
- Check NAT configuration in pjsip.conf
- Verify external_media_address is set correctly
- Ensure firewall allows RTP ports (10000-20000)

**Calls not routing:**
- Check AGI server is running
- Verify database connectivity
- Check dialplan syntax: `asterisk -rx "dialplan show from-trunk"`

**High CPU usage:**
- Reduce transcoding (use same codec end-to-end)
- Check for excessive logging
- Monitor with `top` and `asterisk -rx "core show cpu"`

**No inbound calls:**
- Verify PJSIP endpoints are registered
- Check ACL whitelist includes carrier IPs
- Enable debug: `asterisk -rx "pjsip set logger on"`
