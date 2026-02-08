# QUICK REFERENCE GUIDE
# Gulf Premium Telecom - Asterisk IPRN

## Emergency Commands

### Restart Asterisk
```bash
sudo systemctl restart asterisk
```

### Stop Asterisk Gracefully
```bash
sudo asterisk -rx "core stop gracefully"
```

### Force Stop
```bash
sudo systemctl stop asterisk
```

### Check Status
```bash
sudo systemctl status asterisk
```

## Most Common Issues and Fixes

### Issue: No Inbound Calls

**Quick Diagnostic:**
```bash
# 1. Check if Asterisk is running
sudo systemctl status asterisk

# 2. Check if port 5060 is listening
sudo netstat -ulnp | grep 5060

# 3. Check if upstream IPs are configured
sudo asterisk -rx "pjsip show endpoints"

# 4. Watch for incoming SIP traffic
sudo tcpdump -i any -n port 5060 | grep INVITE
```

**Most Common Fixes:**
1. Add upstream IP to `/etc/asterisk/pjsip.conf`:
   ```ini
   [upstream-provider-1-identify]
   match=UPSTREAM_IP_ADDRESS
   ```
   Then reload: `sudo asterisk -rx "module reload res_pjsip.so"`

2. Check firewall:
   ```bash
   sudo ufw allow 5060/udp
   sudo ufw allow 10000:20000/udp
   ```

### Issue: One-Way Audio (Can't Hear or Can't Be Heard)

**Quick Fix:**
Edit `/etc/asterisk/pjsip.conf`:
```ini
[transport-udp]
external_media_address=YOUR_PUBLIC_IP
external_signaling_address=YOUR_PUBLIC_IP
```

Then reload:
```bash
sudo asterisk -rx "module reload res_pjsip.so"
```

**Verify RTP Ports:**
```bash
sudo ufw allow 10000:20000/udp
```

### Issue: Calls Rejected (403 Forbidden)

**Fix:** Upstream IP not whitelisted.

Edit `/etc/asterisk/pjsip.conf` and add:
```ini
[upstream-provider-X-identify]
match=UPSTREAM_IP
```

Reload:
```bash
sudo asterisk -rx "module reload res_pjsip.so"
```

### Issue: Calls Rejected (404 Not Found)

**Fix:** DID not configured in dialplan.

Edit `/etc/asterisk/extensions.conf`:
```ini
[did-routing]
exten => _YOUR_DID,1,NoOp(New DID)
same => n,Goto(ivr-main,s,1)
```

Reload:
```bash
sudo asterisk -rx "dialplan reload"
```

## Essential CLI Commands

### Connect to Asterisk Console
```bash
sudo asterisk -rvvv
```

### Show Active Calls
```bash
asterisk -rx "core show channels verbose"
```

### Show Endpoints
```bash
asterisk -rx "pjsip show endpoints"
```

### Show Specific Endpoint Details
```bash
asterisk -rx "pjsip show endpoint upstream-provider-1"
```

### Show Transports
```bash
asterisk -rx "pjsip show transports"
```

### Show Queues
```bash
asterisk -rx "queue show"
```

### Enable PJSIP Debugging
```bash
asterisk -rx "pjsip set logger on"
```

### Disable PJSIP Debugging
```bash
asterisk -rx "pjsip set logger off"
```

### Enable RTP Debugging
```bash
asterisk -rx "rtp set debug on"
```

### Disable RTP Debugging
```bash
asterisk -rx "rtp set debug off"
```

### Reload Dialplan
```bash
asterisk -rx "dialplan reload"
```

### Reload PJSIP Configuration
```bash
asterisk -rx "module reload res_pjsip.so"
```

### Reload All Modules
```bash
asterisk -rx "module reload"
```

### Show Dialplan for Context
```bash
asterisk -rx "dialplan show from-upstream"
asterisk -rx "dialplan show did-routing"
```

### Check Module Status
```bash
asterisk -rx "module show like pjsip"
```

### Show System Uptime
```bash
asterisk -rx "core show uptime"
```

### Exit Console
```
exit
```
or
```
quit
```
or press `Ctrl+C`

## Log Files

### View Full Log (Real-time)
```bash
sudo tail -f /var/log/asterisk/full
```

### View Messages Log
```bash
sudo tail -f /var/log/asterisk/messages
```

### View CDR (Call Detail Records)
```bash
sudo tail -f /var/log/asterisk/cdr-csv/Master.csv
```

### View Queue Log
```bash
sudo tail -f /var/log/asterisk/queue_log
```

### Search for Errors
```bash
sudo grep -i error /var/log/asterisk/full | tail -20
```

### Search for Specific DID
```bash
sudo grep "966501234567" /var/log/asterisk/full
```

### View Systemd Journal
```bash
sudo journalctl -xeu asterisk.service -f
```

## Network Debugging

### Watch SIP Traffic
```bash
sudo tcpdump -i any -n port 5060 -A
```

### Watch SIP Traffic (Save to File)
```bash
sudo tcpdump -i any -n port 5060 -w /tmp/sip-capture.pcap
```

### Watch RTP Traffic
```bash
sudo tcpdump -i any -n udp portrange 10000-20000
```

### Check Open Ports
```bash
sudo netstat -ulnp | grep asterisk
```

### Check Connections
```bash
sudo netstat -anp | grep asterisk
```

## Configuration File Locations

| File | Path |
|------|------|
| PJSIP | `/etc/asterisk/pjsip.conf` |
| Dialplan | `/etc/asterisk/extensions.conf` |
| Modules | `/etc/asterisk/modules.conf` |
| RTP | `/etc/asterisk/rtp.conf` |
| Logger | `/etc/asterisk/logger.conf` |
| Queues | `/etc/asterisk/queues.conf` |
| Manager (AMI) | `/etc/asterisk/manager.conf` |
| CDR | `/etc/asterisk/cdr.conf` |
| Music on Hold | `/etc/asterisk/musiconhold.conf` |
| Main Config | `/etc/asterisk/asterisk.conf` |

## Quick Edits

### Edit PJSIP Config
```bash
sudo nano /etc/asterisk/pjsip.conf
```

### Edit Dialplan
```bash
sudo nano /etc/asterisk/extensions.conf
```

### Edit Logger Config
```bash
sudo nano /etc/asterisk/logger.conf
```

After editing, always reload:
```bash
sudo asterisk -rx "module reload"
# or for dialplan only:
sudo asterisk -rx "dialplan reload"
```

## Performance Monitoring

### Check CPU Usage
```bash
top -p $(pgrep asterisk)
```

### Check Memory Usage
```bash
ps aux | grep asterisk
```

### Check Disk Usage
```bash
df -h
```

### Check Log File Sizes
```bash
sudo du -sh /var/log/asterisk/*
```

### Count Active Calls
```bash
asterisk -rx "core show channels" | grep "active call"
```

## Firewall Quick Commands

### Ubuntu/Debian (UFW)
```bash
# Allow SIP
sudo ufw allow 5060/udp

# Allow RTP
sudo ufw allow 10000:20000/udp

# Check status
sudo ufw status verbose
```

### CentOS/RHEL (firewalld)
```bash
# Allow SIP
sudo firewall-cmd --permanent --add-port=5060/udp

# Allow RTP
sudo firewall-cmd --permanent --add-port=10000-20000/udp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## Backup and Restore

### Quick Backup
```bash
sudo tar -czf /backup/asterisk-config-$(date +%Y%m%d).tar.gz /etc/asterisk/
```

### Quick Restore
```bash
sudo systemctl stop asterisk
sudo tar -xzf /backup/asterisk-config-YYYYMMDD.tar.gz -C /
sudo chown -R asterisk:asterisk /etc/asterisk
sudo systemctl start asterisk
```

## Testing Commands

### Test Call (Echo Test)
From dialplan, route to:
```ini
exten => 600,1,Answer()
same => n,Echo()
```

### Test Playback
From dialplan:
```ini
exten => 601,1,Answer()
same => n,Playback(demo-congrats)
same => n,Hangup()
```

### Test MixMonitor Recording
From dialplan:
```ini
exten => 602,1,Answer()
same => n,MixMonitor(/tmp/test-${UNIQUEID}.wav)
same => n,Playback(demo-echotest)
same => n,Echo()
same => n,StopMixMonitor()
same => n,Hangup()
```

## Troubleshooting Script

Run automated diagnostics:
```bash
sudo ./troubleshoot.sh
```

This will check:
- Asterisk status
- Network connectivity
- Firewall configuration
- PJSIP endpoints
- Dialplan configuration
- Active calls
- Recent errors
- System resources

## Emergency Contacts

### Asterisk Resources
- Documentation: https://wiki.asterisk.org/
- Community Forum: https://community.asterisk.org/
- PJSIP Guide: https://wiki.asterisk.org/wiki/display/AST/PJSIP

### System Support
- Gulf Premium Telecom Support: [Your support contact]
- Escalation: [Your escalation contact]

## Key Configuration Values

### RTP Port Range
Default: 10000-20000  
Location: `/etc/asterisk/rtp.conf`

### SIP Port
Default: 5060 (UDP)  
Location: `/etc/asterisk/pjsip.conf` -> [transport-udp]

### AMI Port
Default: 5038 (TCP)  
Location: `/etc/asterisk/manager.conf`

### Asterisk User
Default: asterisk  
Group: asterisk

### Important Directories
- Config: `/etc/asterisk/`
- Logs: `/var/log/asterisk/`
- Recordings: `/var/spool/asterisk/monitor/`
- MOH: `/var/lib/asterisk/moh/`
- Sounds: `/var/lib/asterisk/sounds/`

## Daily Maintenance Checklist

- [ ] Check Asterisk is running
- [ ] Review error logs
- [ ] Check disk space
- [ ] Verify active calls count
- [ ] Check CDR logging
- [ ] Monitor system resources

## Weekly Maintenance Checklist

- [ ] Review all logs for patterns
- [ ] Check log file rotation
- [ ] Backup configuration files
- [ ] Review CDR statistics
- [ ] Check for Asterisk updates
- [ ] Test backup restoration

## Monthly Maintenance Checklist

- [ ] Full system backup
- [ ] Security audit (passwords, ACLs)
- [ ] Performance review
- [ ] Capacity planning review
- [ ] Update documentation
- [ ] Test disaster recovery

---

**Version**: 1.0  
**Last Updated**: 2024  
**Quick Reference for**: Gulf Premium Telecom Asterisk IPRN
