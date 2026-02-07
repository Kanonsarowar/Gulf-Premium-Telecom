# Quick Reference - SIP Trunk Configuration

## Your Server
- **IP**: 167.172.170.88
- **SIP Port**: 5060
- **RTP Ports**: 10000-20000

## Configured Trunks (8 Total)

### Group 1 - General (4)
| Name | IP | Codecs |
|------|-----|--------|
| supplier1-trunk1 | 108.61.70.46 | ulaw, alaw, gsm, g729 |
| supplier1-trunk2 | 157.90.193.196 | ulaw, alaw, gsm, g729 |
| supplier1-trunk3 | 51.77.77.223 | ulaw, alaw, gsm, g729 |
| supplier1-trunk4 | 95.217.90.212 | ulaw, alaw, gsm, g729 |

### Group 2 - AWS (3)
| Name | IP | Primary Codec |
|------|-----|---------------|
| supplier2-aws1 | 52.28.165.40 | G.729 |
| supplier2-aws2 | 52.57.172.184 | G.729 |
| supplier2-aws3 | 35.156.119.128 | G.729 |

### Group 3 - Quintum (1)
| Name | IP | Format |
|------|-----|--------|
| supplier3-quintum | 149.12.160.10 | E.164 |

## Quick Commands

### Check Status
```bash
asterisk -rx "sip show peers"           # All trunks
asterisk -rx "core show channels"       # Active calls
asterisk -rx "sip show peer supplier1-trunk1"  # Specific trunk
```

### Monitoring
```bash
asterisk -rvvv                          # Connect to console
sip set debug on                        # Enable SIP debug
dialplan set debug on                   # Enable dialplan debug
```

### Reload Config
```bash
asterisk -rx "sip reload"               # Reload SIP
asterisk -rx "dialplan reload"          # Reload dialplan
```

## Installation

### Option 1: Automated
```bash
sudo ./setup-trunks.sh
```

### Option 2: Manual
```bash
sudo cp asterisk-config/sip.conf /etc/asterisk/
sudo cp asterisk-config/extensions.conf /etc/asterisk/
sudo asterisk -rx "sip reload"
sudo asterisk -rx "dialplan reload"
```

## Firewall (Quick)
```bash
# All supplier IPs
for ip in 108.61.70.46 157.90.193.196 51.77.77.223 95.217.90.212 \
          52.28.165.40 52.57.172.184 35.156.119.128 149.12.160.10; do
  sudo ufw allow from $ip to any port 5060 proto udp
done

# RTP
sudo ufw allow 10000:20000/udp
```

## Test Calls
1. Contact each supplier
2. Provide IP: 167.172.170.88
3. Request test call
4. Monitor: `asterisk -rvvv`
5. Verify IVR menu works

## Troubleshooting

### Trunk Shows UNREACHABLE
- Check firewall allows supplier IP
- Verify supplier has whitelisted 167.172.170.88
- Check with: `asterisk -rx "sip show peer <name>"`

### No Audio
- Check RTP ports 10000-20000 are open
- Verify NAT settings
- Test: `asterisk -rx "rtp set debug on"`

### Codec Issues
- Check G.729 installed: `asterisk -rx "core show codecs"`
- May need license for G.729

## Documentation
- **TRUNK_CONFIG.md** - Complete guide
- **SETUP_CHECKLIST.md** - Verify your setup
- **setup-trunks.sh** - Auto install
