# Gulf Premium Telecom - Asterisk PBX Configuration

## Overview

This is a complete, production-ready Asterisk PBX configuration designed for carrier-grade VoIP operations with the following features:

- **IP-based carrier trunk authentication** (no username/password required)
- **Twilio SIP trunk integration** for outbound calling
- **IVR (Interactive Voice Response)** system with customizable menu
- **Call Detail Records (CDR)** for billing and reporting
- **Security through IP ACLs**
- **Support for high CPS (Calls Per Second)** and concurrent calls

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Carrier 1  │────────>│                  │────────>│  Twilio SIP │
│  (IP Auth)  │   SIP   │  Asterisk PBX    │   SIP   │    Trunk    │
└─────────────┘         │                  │         └─────────────┘
                        │  - IVR System    │
┌─────────────┐         │  - Call Routing  │         ┌─────────────┐
│  Carrier 2  │────────>│  - CDR Logging   │────────>│ Destinations│
│  (IP Auth)  │         │                  │         │  (via Twilio)│
└─────────────┘         └──────────────────┘         └─────────────┘
```

## Directory Structure

```
asterisk-config/
├── conf/                      # Configuration files
│   ├── pjsip.conf            # SIP/PJSIP trunk configuration
│   ├── extensions.conf       # Dialplan and IVR
│   ├── rtp.conf              # RTP media configuration
│   ├── cdr.conf              # CDR settings
│   ├── cdr_custom.conf       # Custom CDR formats
│   ├── logger.conf           # Logging configuration
│   ├── modules.conf          # Module loading
│   ├── asterisk.conf         # Main Asterisk settings
│   ├── musiconhold.conf      # Music on hold
│   └── voicemail.conf        # Voicemail settings
├── scripts/                   # Utility scripts
├── docs/                      # Additional documentation
└── samples/                   # Sample files and templates
```

## Quick Start Guide

### Prerequisites

- Ubuntu 20.04 LTS or newer (or Debian 10+)
- Asterisk 16, 18, or 20 installed
- Public IP address or proper NAT configuration
- Firewall access to configure ports
- Twilio account with SIP trunk configured

### Installation Steps

#### 1. Install Asterisk

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y build-essential wget libssl-dev libncurses5-dev \
    libnewt-dev libxml2-dev linux-headers-$(uname -r) libsqlite3-dev \
    uuid-dev libjansson-dev

# Download Asterisk 20 (latest LTS)
cd /usr/src
sudo wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
sudo tar -xvf asterisk-20-current.tar.gz
cd asterisk-20*/

# Install MP3 support (optional)
sudo contrib/scripts/get_mp3_source.sh

# Configure and compile
sudo ./configure --with-jansson-bundled
sudo make menuselect  # Select required modules
sudo make -j$(nproc)
sudo make install
sudo make samples  # Optional: install sample configs
sudo make config
sudo make install-logrotate
```

#### 2. Create Asterisk User

```bash
sudo groupadd asterisk
sudo useradd -r -d /var/lib/asterisk -g asterisk asterisk
sudo usermod -aG audio,dialout asterisk
sudo chown -R asterisk:asterisk /etc/asterisk
sudo chown -R asterisk:asterisk /var/{lib,log,spool}/asterisk
sudo chown -R asterisk:asterisk /usr/lib/asterisk
```

#### 3. Deploy Configuration Files

```bash
# Backup existing configuration (if any)
sudo cp -r /etc/asterisk /etc/asterisk.backup.$(date +%Y%m%d)

# Copy configuration files from this repository
sudo cp asterisk-config/conf/* /etc/asterisk/

# Set proper permissions
sudo chown -R asterisk:asterisk /etc/asterisk
sudo chmod 640 /etc/asterisk/*.conf
```

#### 4. Configure Your Settings

Edit the following files to match your environment:

##### 4.1 Update pjsip.conf

```bash
sudo nano /etc/asterisk/pjsip.conf
```

**Critical settings to update:**

1. **Public IP Address** (lines 19-20):
   ```ini
   external_media_address=YOUR_PUBLIC_IP
   external_signaling_address=YOUR_PUBLIC_IP
   ```

2. **Carrier IP Addresses** (lines 37-58):
   ```ini
   [acl-carrier1]
   type=acl
   deny=0.0.0.0/0
   permit=203.0.113.0/24    # Replace with actual carrier IP
   ```

3. **Twilio Credentials** (lines 119, 145-147):
   ```ini
   from_user=YOUR_TWILIO_USERNAME
   from_domain=YOUR_TWILIO_DOMAIN.pstn.twilio.com
   
   [twilio-auth]
   username=YOUR_TWILIO_USERNAME
   password=YOUR_TWILIO_PASSWORD
   ```

4. **Twilio SIP Domain** (line 132):
   ```ini
   contact=sip:YOUR_TWILIO_DOMAIN.pstn.twilio.com
   ```

##### 4.2 Update extensions.conf

```bash
sudo nano /etc/asterisk/extensions.conf
```

**Update these settings:**

1. **Twilio Caller ID** (line 20):
   ```ini
   TWILIO_CALLER_ID=+1234567890    # Your Twilio verified number
   ```

2. **Destination Numbers** (lines 141, 155, 169, 183):
   ```ini
   same => n,Dial(PJSIP/+1234567100@${TWILIO_TRUNK},60,t)
   ```
   Replace `+1234567100` with actual destination numbers.

#### 5. Configure Firewall

```bash
# Allow SIP signaling
sudo ufw allow 5060/udp
sudo ufw allow 5060/tcp

# Allow RTP media
sudo ufw allow 10000:20000/udp

# Enable firewall
sudo ufw enable
```

#### 6. Create Required Directories

```bash
# Create directories for recordings and custom sounds
sudo mkdir -p /var/spool/asterisk/monitor
sudo mkdir -p /var/lib/asterisk/sounds/custom

# Set permissions
sudo chown -R asterisk:asterisk /var/spool/asterisk/monitor
sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom
```

#### 7. Add IVR Audio Files

You need to create or upload the following audio files to `/var/lib/asterisk/sounds/custom/`:

- `welcome.wav` - Welcome greeting
- `ivr-menu.wav` - IVR menu options
- `invalid-option.wav` - Invalid selection message
- `timeout.wav` - Timeout message

**Creating sample audio files:**

```bash
# Install text-to-speech (optional)
sudo apt install -y festival

# Generate sample audio (adjust as needed)
cd /var/lib/asterisk/sounds/custom/
echo "Welcome to Gulf Premium Telecom" | text2wave -o welcome.wav
echo "Press 1 for Sales, Press 2 for Support, Press 3 for Billing, Press 0 for Operator" | text2wave -o ivr-menu.wav
echo "Invalid option. Please try again" | text2wave -o invalid-option.wav
echo "No input received. Goodbye" | text2wave -o timeout.wav

sudo chown asterisk:asterisk *.wav
```

#### 8. Start Asterisk

```bash
# Start Asterisk
sudo systemctl start asterisk

# Enable on boot
sudo systemctl enable asterisk

# Check status
sudo systemctl status asterisk
```

#### 9. Verify Configuration

```bash
# Connect to Asterisk CLI
sudo asterisk -rvvv

# Test commands:
pjsip show endpoints       # Should show carrier and Twilio trunks
pjsip show transports      # Should show UDP transport
core show channels         # Shows active calls
dialplan show from-carriers # Shows carrier inbound context
```

## Configuration Details

### Carrier Trunk Configuration

The system accepts calls from carrier IPs without username/password authentication using PJSIP identify sections.

**How it works:**
1. Carrier sends INVITE to your Asterisk server
2. PJSIP checks source IP against `[carrier1-identify]` or `[carrier2-identify]`
3. If IP matches, call is accepted and routed to `from-carriers` context
4. No SIP authentication required

**Adding more carriers:**

```ini
; In pjsip.conf

[acl-carrier3]
type=acl
deny=0.0.0.0/0
permit=192.0.2.0/24

[carrier3-trunk]
type=endpoint
(carrier-endpoint-template)
acl=acl-carrier3
set_var=CARRIER=CARRIER3

[carrier3-identify]
type=identify
endpoint=carrier3-trunk
match=192.0.2.0/24
```

### Twilio Trunk Configuration

**Obtaining Twilio SIP Credentials:**

1. Log into [Twilio Console](https://console.twilio.com/)
2. Navigate to **Elastic SIP Trunking** → **Trunks**
3. Create a new trunk or select existing
4. Note down:
   - **SIP URI**: `your-domain.pstn.twilio.com`
   - **Username**: Usually your Twilio Account SID
   - **Password**: Usually your Auth Token
5. Configure **Origination URI**: Point to your Asterisk server IP
6. Configure **Termination**: Add your Asterisk server IP to allowed list

**Update pjsip.conf with Twilio details:**
- Lines 119, 132, 145-147

### IVR Customization

The IVR menu is defined in `extensions.conf` in the `[ivr-main]` context.

**Current menu options:**
- **1** → Sales Department (routes to extension 100)
- **2** → Support Department (routes to extension 200)
- **3** → Billing Department (routes to extension 300)
- **0** → Operator
- **9** → Repeat menu

**To modify IVR menu:**

1. Edit `/etc/asterisk/extensions.conf`
2. Locate `[ivr-main]` context
3. Modify the audio prompts and menu options
4. Update the destination extensions in `[internal-extensions]`
5. Reload dialplan: `asterisk -rx "dialplan reload"`

**Example: Adding option 4 for Technical Support:**

```ini
; In [ivr-main] context
exten => 4,1,NoOp(Selected: Technical Support)
 same => n,Playback(pls-wait-connect-call)
 same => n,Goto(internal-extensions,400,1)

; In [internal-extensions] context
exten => 400,1,NoOp(Routing to Technical Support)
 same => n,Set(CALLERID(num)=${TWILIO_CALLER_ID})
 same => n,Dial(PJSIP/+1234567400@${TWILIO_TRUNK},60,t)
 same => n,Voicemail(400@default,u)
 same => n,Hangup()
```

### Call Flow

```
Inbound Call → [from-carriers] → Answer → IVR → User Selection → Route to Department → Dial via Twilio
```

### CDR (Call Detail Records)

CDRs are automatically logged to:
- `/var/log/asterisk/cdr-csv/Master.csv` - Detailed format
- `/var/log/asterisk/cdr-csv/Simple.csv` - Simplified format

**CDR Fields:**
- Call start/end time
- Source/destination numbers
- Call duration and billable seconds
- Call disposition (ANSWERED, NO ANSWER, BUSY, etc.)
- Carrier information

**Viewing CDRs:**
```bash
tail -f /var/log/asterisk/cdr-csv/Master.csv
```

## Testing

### Test 1: Verify PJSIP Configuration

```bash
sudo asterisk -rvvv
```

```
*CLI> pjsip show endpoints

 Endpoint:  <Endpoint/CID.....................................>  <State.....>  <Channels.>
==========================================================================================
 carrier1-trunk/anonymous                                       Unavailable            0
 carrier2-trunk/anonymous                                       Unavailable            0
 twilio-trunk/YOUR_TWILIO_USERNAME                             Unavailable            0

Objects found: 3
```

### Test 2: Send Test Call from Carrier

1. Configure your carrier to send a test call to your Asterisk server
2. Monitor Asterisk console:
   ```bash
   sudo asterisk -rvvv
   ```
3. Enable PJSIP debug:
   ```
   *CLI> pjsip set logger on
   ```
4. Send test call
5. Check logs in console

### Test 3: Test Outbound via Twilio

From Asterisk CLI:
```
*CLI> channel originate PJSIP/+1234567890@twilio-trunk application Playback demo-congrats
```

This will call the number via Twilio and play an audio file.

### Test 4: IVR Echo Test

Configure a test DID to route to extension 600 (echo test):

```ini
; In extensions.conf [from-carriers]
exten => YOUR_TEST_DID,1,Goto(testing,600,1)
```

Call the DID and follow the echo test.

## Troubleshooting

### Issue: No Audio (One-Way Audio)

**Symptoms:** You can hear the caller but they can't hear you (or vice versa).

**Solutions:**

1. **Check RTP ports in firewall:**
   ```bash
   sudo ufw status
   # Ensure 10000:20000/udp is open
   ```

2. **Verify NAT settings in pjsip.conf:**
   ```ini
   external_media_address=YOUR_PUBLIC_IP
   rtp_symmetric=yes
   force_rport=yes
   ```

3. **Enable RTP debug:**
   ```
   *CLI> rtp set debug on
   ```

4. **Check for firewall/NAT between parties**

### Issue: Calls Not Coming In

**Solutions:**

1. **Verify carrier IP is permitted:**
   ```
   *CLI> pjsip show endpoints
   *CLI> pjsip show acl
   ```

2. **Check if carrier IP matches identify section:**
   ```ini
   [carrier1-identify]
   match=203.0.113.0/24    # Must match carrier's actual IP
   ```

3. **Enable SIP debug:**
   ```
   *CLI> pjsip set logger on
   ```

4. **Check firewall:**
   ```bash
   sudo ufw status
   sudo netstat -tulpn | grep 5060
   ```

### Issue: Twilio Calls Failing

**Solutions:**

1. **Verify Twilio credentials:**
   - Check username/password in pjsip.conf
   - Ensure they match Twilio console

2. **Check Twilio ACL:**
   - Verify Twilio IP addresses in `[acl-twilio]`
   - Get latest IPs from: https://www.twilio.com/docs/sip-trunking/ip-addresses

3. **Test connectivity:**
   ```bash
   ping YOUR_TWILIO_DOMAIN.pstn.twilio.com
   ```

4. **Check Twilio trunk configuration:**
   - Ensure your Asterisk server IP is in Twilio's termination list
   - Verify origination URI points to your server

### Issue: IVR Not Working

**Solutions:**

1. **Verify audio files exist:**
   ```bash
   ls -la /var/lib/asterisk/sounds/custom/
   ```

2. **Check dialplan:**
   ```
   *CLI> dialplan show ivr-main
   ```

3. **Enable DTMF debugging:**
   ```
   *CLI> core set debug 5
   ```

4. **Test audio file:**
   ```
   *CLI> file convert /var/lib/asterisk/sounds/custom/welcome.wav /tmp/test.wav
   ```

### Common CLI Commands

```bash
# Reload configurations
asterisk -rx "pjsip reload"
asterisk -rx "dialplan reload"
asterisk -rx "core reload"

# Show active channels
asterisk -rx "core show channels"

# Show PJSIP endpoints
asterisk -rx "pjsip show endpoints"

# Enable debugging
asterisk -rx "pjsip set logger on"
asterisk -rx "rtp set debug on"
asterisk -rx "core set debug 5"

# Disable debugging
asterisk -rx "pjsip set logger off"
asterisk -rx "rtp set debug off"
asterisk -rx "core set debug 0"

# Show registrations (if using)
asterisk -rx "pjsip show registrations"

# Restart Asterisk
sudo systemctl restart asterisk
```

## Security Best Practices

1. **IP Whitelisting:** Only allow known carrier IPs in ACLs
2. **Firewall:** Use UFW or iptables to restrict access
3. **Fail2ban:** Install fail2ban to prevent brute force attacks
4. **Regular Updates:** Keep Asterisk updated with security patches
5. **Strong Passwords:** Use strong passwords for Twilio and any extensions
6. **Disable Unused Services:** Only load required modules
7. **Monitor Logs:** Regularly review logs for suspicious activity
8. **Rate Limiting:** Implement rate limiting to prevent abuse

### Install Fail2ban

```bash
sudo apt install -y fail2ban

# Create Asterisk filter
sudo nano /etc/fail2ban/filter.d/asterisk.conf
```

Add:
```ini
[Definition]
failregex = NOTICE.* .*: Registration from '.*' failed for '<HOST>:.*' - Wrong password
            NOTICE.* .*: Registration from '.*' failed for '<HOST>:.*' - No matching peer found
            NOTICE.* .*: Registration from '.*' failed for '<HOST>:.*' - Username/auth name mismatch
            NOTICE.* <HOST> failed to authenticate as '.*'$
            NOTICE.* .*: No registration for peer '.*' \(from <HOST>\)
            NOTICE.* .*: Host <HOST> failed MD5 authentication for '.*' (.*)
            NOTICE.* .*: Failed to authenticate user .*@<HOST>.*
ignoreregex =
```

Enable:
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Performance Tuning

For high-volume environments:

### 1. Increase File Descriptors

```bash
sudo nano /etc/security/limits.conf
```

Add:
```
asterisk soft nofile 10000
asterisk hard nofile 10000
```

### 2. Adjust RTP Port Range

For very high concurrent calls, expand RTP range in `rtp.conf`:
```ini
rtpstart=10000
rtpend=30000
```

### 3. Enable Realtime Priority

Already enabled in `asterisk.conf`:
```ini
highpriority = yes
```

### 4. Database Optimization

For high CDR volume, consider using MySQL/PostgreSQL instead of CSV:

```bash
sudo apt install -y asterisk-modules-mysql
```

Configure `cdr_mysql.conf` accordingly.

## Monitoring

### View Live Calls

```bash
watch -n 1 "asterisk -rx 'core show channels concise'"
```

### Monitor CDR

```bash
tail -f /var/log/asterisk/cdr-csv/Master.csv
```

### System Resources

```bash
htop
# Filter for 'asterisk' processes
```

### Asterisk Statistics

```
*CLI> core show uptime
*CLI> core show channels
*CLI> pjsip show endpoints
*CLI> core show calls
```

## Integration with Asternic Call Center

This configuration supports Asternic Call Center Stats through:
- Queue logging enabled in `logger.conf`
- AMI (Asterisk Manager Interface) - requires additional configuration
- CDR logging

To enable AMI for Asternic, create `/etc/asterisk/manager.conf`:

```ini
[general]
enabled = yes
port = 5038
bindaddr = 127.0.0.1

[asternic]
secret = YOUR_STRONG_PASSWORD
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.255
read = system,call,log,verbose,command,agent,user,dtmf
write = system,call,log,verbose,command,agent,user,dtmf
```

## Backup and Restore

### Backup Configuration

```bash
#!/bin/bash
BACKUP_DIR="/backup/asterisk"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/asterisk-config-$DATE.tar.gz /etc/asterisk/
tar -czf $BACKUP_DIR/asterisk-sounds-$DATE.tar.gz /var/lib/asterisk/sounds/custom/
echo "Backup completed: $BACKUP_DIR/asterisk-config-$DATE.tar.gz"
```

### Restore Configuration

```bash
#!/bin/bash
BACKUP_FILE="/backup/asterisk/asterisk-config-20240101_120000.tar.gz"

sudo systemctl stop asterisk
sudo tar -xzf $BACKUP_FILE -C /
sudo chown -R asterisk:asterisk /etc/asterisk
sudo systemctl start asterisk
```

## Support and Maintenance

### Log Locations

- **Full Log:** `/var/log/asterisk/full`
- **Messages:** `/var/log/asterisk/messages`
- **CDR:** `/var/log/asterisk/cdr-csv/`
- **Queue Log:** `/var/log/asterisk/queue_log`

### Regular Maintenance Tasks

1. **Rotate Logs** (automatic with logrotate)
2. **Monitor Disk Space:** CDR and recordings can grow large
3. **Update Asterisk:** Check for security updates monthly
4. **Review CDR:** Monitor for unusual patterns
5. **Test Trunks:** Regular test calls to verify connectivity
6. **Backup Configuration:** Weekly backups recommended

## Additional Resources

- [Asterisk Documentation](https://www.asterisk.org/docs/)
- [PJSIP Configuration](https://wiki.asterisk.org/wiki/display/AST/Configuring+res_pjsip)
- [Twilio SIP Trunking](https://www.twilio.com/docs/sip-trunking)
- [Asterisk Community](https://community.asterisk.org/)

## License

This configuration is provided as-is for Gulf Premium Telecom operations.

## Version History

- **v1.0.0** (2024-02-08): Initial production release
  - IP-based carrier trunk support
  - Twilio integration
  - IVR system
  - CDR logging
  - Security hardening

---

**Gulf Premium Telecom**  
*Premium Voice Services for Saudi Arabia, Asia & MENA*
