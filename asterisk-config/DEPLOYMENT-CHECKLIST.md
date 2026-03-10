# Deployment Checklist
## Gulf Premium Telecom - Asterisk PBX

Use this checklist to ensure a smooth deployment of the Asterisk PBX configuration.

---

## Pre-Deployment

### Environment Preparation
- [ ] Ubuntu 20.04 LTS or Debian 10+ installed
- [ ] System fully updated (`apt update && apt upgrade`)
- [ ] Server has public IP address
- [ ] DNS records configured (if needed)
- [ ] Server meets minimum requirements:
  - [ ] 4+ CPU cores
  - [ ] 8+ GB RAM
  - [ ] 100+ GB disk space
  - [ ] 1 Gbps network interface

### Dependencies
- [ ] Asterisk 16, 18, or 20 installed
- [ ] Required packages installed (see README.md)
- [ ] `asterisk` user and group created
- [ ] Proper permissions set on Asterisk directories

### Network
- [ ] Public IP address documented: `___________________`
- [ ] Firewall access available
- [ ] Network latency to carriers acceptable (<50ms)
- [ ] Network latency to Twilio acceptable (<100ms)

### Accounts & Credentials
- [ ] Twilio account created
- [ ] Twilio SIP trunk configured
- [ ] Twilio credentials obtained:
  - [ ] Domain: `___________________`
  - [ ] Username: `___________________`
  - [ ] Password: `___________________`
  - [ ] Verified caller ID number: `___________________`
- [ ] Carrier contact information available
- [ ] Carrier IP addresses documented (see below)

---

## Configuration

### Carrier Information
Document all carrier details:

**Carrier 1:**
- Name: `___________________`
- Contact: `___________________`
- IP Address(es): `___________________`
- Support Phone: `___________________`

**Carrier 2:**
- Name: `___________________`
- Contact: `___________________`
- IP Address(es): `___________________`
- Support Phone: `___________________`

**Carrier 3:**
- Name: `___________________`
- Contact: `___________________`
- IP Address(es): `___________________`
- Support Phone: `___________________`

### File Configuration

#### pjsip.conf
- [ ] Updated `YOUR_PUBLIC_IP` with actual public IP
- [ ] Updated `acl-carrier1` with actual carrier 1 IP(s)
- [ ] Updated `acl-carrier2` with actual carrier 2 IP(s)
- [ ] Added additional carriers if needed
- [ ] Updated `carrier1-identify` with matching IPs
- [ ] Updated `carrier2-identify` with matching IPs
- [ ] Updated Twilio domain in 3 places
- [ ] Updated Twilio username in 2 places
- [ ] Updated Twilio password
- [ ] Updated Twilio IP addresses in `acl-twilio`
- [ ] Saved and backed up changes

#### extensions.conf
- [ ] Updated `TWILIO_CALLER_ID` with verified number
- [ ] Updated destination numbers in extension 100 (Sales)
- [ ] Updated destination numbers in extension 200 (Support)
- [ ] Updated destination numbers in extension 300 (Billing)
- [ ] Updated destination numbers in extension 0 (Operator)
- [ ] Customized IVR menu as needed
- [ ] Saved and backed up changes

#### Other Configuration Files
- [ ] Reviewed `rtp.conf` settings
- [ ] Reviewed `cdr.conf` settings
- [ ] Reviewed `logger.conf` verbosity levels
- [ ] Reviewed `modules.conf` for required modules
- [ ] No changes needed to `asterisk.conf`
- [ ] No changes needed to `voicemail.conf` (or updated if needed)

### File Deployment
- [ ] Backed up existing `/etc/asterisk/` directory
- [ ] Copied all `.conf` files to `/etc/asterisk/`
- [ ] Set ownership: `chown -R asterisk:asterisk /etc/asterisk`
- [ ] Set permissions: `chmod 640 /etc/asterisk/*.conf`
- [ ] Verified all files copied correctly

### IVR Audio Files
- [ ] Created `/var/lib/asterisk/sounds/custom/` directory
- [ ] Created or uploaded `welcome.wav`
- [ ] Created or uploaded `ivr-menu.wav`
- [ ] Created or uploaded `invalid-option.wav`
- [ ] Created or uploaded `timeout.wav`
- [ ] Verified audio format (8kHz, 16-bit, mono, WAV)
- [ ] Set ownership: `chown asterisk:asterisk *.wav`
- [ ] Tested audio playback

### Firewall Configuration
- [ ] UFW or iptables installed
- [ ] Allowed UDP 5060 (SIP signaling)
- [ ] Allowed TCP 5060 (SIP signaling)
- [ ] Allowed UDP 10000-20000 (RTP media)
- [ ] Restricted SSH access to management IPs only
- [ ] Documented firewall rules
- [ ] Tested connectivity

---

## Security

### Access Control
- [ ] Changed all default passwords
- [ ] Created strong Twilio password
- [ ] Restricted configuration file permissions
- [ ] Disabled root SSH login (optional but recommended)
- [ ] Set up SSH key authentication (optional but recommended)

### IP Whitelisting
- [ ] Verified only known carrier IPs in ACLs
- [ ] No `permit=0.0.0.0/0` rules exist
- [ ] Added Twilio IP ranges to `acl-twilio`
- [ ] Documented all permitted IPs

### Fail2ban (Recommended)
- [ ] Installed fail2ban
- [ ] Created Asterisk filter (`/etc/fail2ban/filter.d/asterisk.conf`)
- [ ] Created Asterisk jail (`/etc/fail2ban/jail.d/asterisk.local`)
- [ ] Started and enabled fail2ban
- [ ] Verified fail2ban is monitoring

### Monitoring
- [ ] Configured log rotation
- [ ] Set up log monitoring (manual or automated)
- [ ] Documented monitoring procedures
- [ ] Configured alerts for critical errors (optional)

---

## Testing

### Pre-Launch Testing

#### System Tests
- [ ] Asterisk starts without errors: `systemctl status asterisk`
- [ ] Asterisk CLI accessible: `asterisk -rvvv`
- [ ] No errors in `/var/log/asterisk/messages`
- [ ] All modules loaded: `module show`
- [ ] PJSIP endpoints configured: `pjsip show endpoints`
- [ ] PJSIP transports active: `pjsip show transports`
- [ ] Dialplan loaded: `dialplan show`
- [ ] CDR enabled: `cdr show status`

#### Network Tests
- [ ] Server reachable from carrier networks
- [ ] Port 5060 open (test with telnet or nmap)
- [ ] RTP ports open (test during call)
- [ ] Public IP correctly configured
- [ ] NAT traversal working (if applicable)

#### Carrier Connectivity Tests
- [ ] Carrier 1 can send test call
- [ ] Call from Carrier 1 answers successfully
- [ ] IVR plays welcome message
- [ ] DTMF keys detected correctly
- [ ] Call routes to correct destination
- [ ] Audio quality is clear (both directions)
- [ ] No one-way audio issues
- [ ] Call hangs up cleanly
- [ ] CDR record created
- [ ] Repeat for Carrier 2
- [ ] Repeat for Carrier 3

#### Twilio Connectivity Tests
- [ ] Test outbound call: `channel originate PJSIP/+1234567890@twilio-trunk application Playback demo-congrats`
- [ ] Call connects successfully
- [ ] Audio is clear
- [ ] Caller ID displays correctly
- [ ] Call duration is accurate
- [ ] CDR record created

#### IVR Tests
- [ ] Welcome message plays
- [ ] Menu prompts play correctly
- [ ] Press 1 → Routes to Sales
- [ ] Press 2 → Routes to Support
- [ ] Press 3 → Routes to Billing
- [ ] Press 0 → Routes to Operator
- [ ] Press 9 → Repeats menu
- [ ] Invalid key → Plays error message
- [ ] Timeout → Plays timeout message
- [ ] Audio quality is clear

#### Voicemail Tests (if configured)
- [ ] Voicemail answers when no one available
- [ ] Can leave voicemail
- [ ] Voicemail is recorded
- [ ] Can retrieve voicemail
- [ ] Email notification works (if configured)

#### Load Tests (if needed)
- [ ] System handles expected concurrent calls
- [ ] No audio degradation under load
- [ ] CPU and memory usage acceptable
- [ ] No errors in logs during load test

---

## Launch

### Go-Live Checklist
- [ ] All testing completed successfully
- [ ] Operations team trained
- [ ] Emergency contacts documented
- [ ] Backup verified and tested
- [ ] Monitoring in place
- [ ] Rollback plan documented

### Carrier Notification
- [ ] Notified Carrier 1 of new IP/configuration
- [ ] Notified Carrier 2 of new IP/configuration
- [ ] Notified Carrier 3 of new IP/configuration
- [ ] Confirmed test call window with each carrier
- [ ] Received confirmation from each carrier

### Final Verification
- [ ] Production configuration deployed
- [ ] Asterisk restarted
- [ ] All endpoints online
- [ ] Test call from each carrier successful
- [ ] Test outbound call via Twilio successful
- [ ] CDR logging confirmed
- [ ] No errors in logs

### Documentation
- [ ] Updated with production IPs and settings
- [ ] Created runbook for common tasks
- [ ] Documented emergency procedures
- [ ] Shared documentation with team
- [ ] Stored credentials securely (password manager)

---

## Post-Launch

### First 24 Hours
- [ ] Monitor logs continuously: `tail -f /var/log/asterisk/full`
- [ ] Check for errors: `grep ERROR /var/log/asterisk/messages`
- [ ] Monitor call quality
- [ ] Verify CDR generation
- [ ] Check system resources: `top`, `htop`
- [ ] Verify no security incidents
- [ ] Document any issues and resolutions

### First Week
- [ ] Daily log review
- [ ] Check CDR for billing accuracy
- [ ] Monitor system performance
- [ ] Verify backup completion
- [ ] Check for security alerts
- [ ] Gather user feedback
- [ ] Make any necessary adjustments

### First Month
- [ ] Weekly log reviews
- [ ] Monthly security audit
- [ ] Review and optimize dialplan
- [ ] Check for Asterisk updates
- [ ] Review and update documentation
- [ ] Schedule quarterly penetration test

---

## Rollback Plan

If issues occur during deployment:

1. **Stop Asterisk**
   ```bash
   sudo systemctl stop asterisk
   ```

2. **Restore Previous Configuration**
   ```bash
   sudo rm -rf /etc/asterisk
   sudo cp -r /etc/asterisk.backup.YYYYMMDD /etc/asterisk
   ```

3. **Restart Asterisk**
   ```bash
   sudo systemctl start asterisk
   ```

4. **Verify Rollback**
   ```bash
   sudo asterisk -rvvv
   *CLI> pjsip show endpoints
   ```

5. **Notify Stakeholders**
   - Inform carriers
   - Inform operations team
   - Document issue for post-mortem

---

## Emergency Contacts

**Internal:**
- System Administrator: `___________________`
- Network Administrator: `___________________`
- Manager: `___________________`

**External:**
- Carrier 1 Support: `___________________`
- Carrier 2 Support: `___________________`
- Carrier 3 Support: `___________________`
- Twilio Support: https://support.twilio.com/

**Vendors:**
- Hosting Provider: `___________________`
- Network Provider: `___________________`

---

## Sign-Off

**Deployed By:**
- Name: `___________________`
- Date: `___________________`
- Signature: `___________________`

**Verified By:**
- Name: `___________________`
- Date: `___________________`
- Signature: `___________________`

**Approved By:**
- Name: `___________________`
- Date: `___________________`
- Signature: `___________________`

---

## Notes

Document any issues, changes, or important information during deployment:

```
_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________
```

---

**Deployment Status:** ☐ Not Started  ☐ In Progress  ☐ Complete  ☐ Rolled Back

© 2024 Gulf Premium Telecom - Internal Use Only
