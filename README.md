# Gulf Premium Telecom - IP Routing Network (IPRN)

Carrier-grade Asterisk PBX configuration for IP-to-IP VoIP routing.

## Overview

This repository contains configuration and documentation for Gulf Premium Telecom's IPRN infrastructure, supporting high-volume VoIP traffic routing between Saudi Arabia, Asia, and MENA regions.

## Infrastructure

### Primary Server
- **IP Address**: 167.172.170.88
- **SIP Port**: 5060 (UDP)
- **RTP Port Range**: 10000-20000 (UDP)

### Supported Codecs
- G.711 μ-law (ulaw) - 64kbps
- G.711 A-law (alaw) - 64kbps
- G.729 - 8kbps (bandwidth-efficient)
- G.722 - 64kbps (HD audio)

## Repository Structure

```
├── config/
│   └── sip-trunks/
│       ├── ip-suppliers.conf    # PJSIP supplier configurations
│       └── README.md            # Detailed configuration guide
├── docs/                        # Additional documentation
└── README.md                    # This file
```

## Quick Start

### Configuration Files

The main configuration file is located at:
```
config/sip-trunks/ip-suppliers.conf
```

This file includes:
- Gulf Premium Telecom endpoint configuration (167.172.170.88)
- IP supplier templates
- Codec priorities and port configurations
- Production deployment guidelines

### Include in Asterisk

Add to your `/etc/asterisk/pjsip.conf`:
```ini
#include /path/to/config/sip-trunks/ip-suppliers.conf
```

### Required Firewall Rules

```bash
# SIP signaling
iptables -A INPUT -p udp --dport 5060 -j ACCEPT
iptables -A OUTPUT -p udp --sport 5060 -j ACCEPT

# RTP media
iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT
iptables -A OUTPUT -p udp --sport 10000:20000 -j ACCEPT
```

## System Requirements

- **Asterisk Version**: 16, 18, or 20
- **Protocol**: PJSIP (SIP over UDP)
- **OS**: Linux (Ubuntu/Debian recommended)
- **Network**: Public IP or SBC in front
- **Traffic Profile**: High CPS, carrier-grade routes

## Features

- **IP-to-IP Routing**: No SIP registration required
- **Media Anchoring**: RTP forced through Asterisk
- **NAT Traversal**: Symmetric RTP and contact rewriting
- **Codec Flexibility**: Support for premium (G.711) and standard (G.729) routes
- **High Availability**: Designed for 24/7 uptime
- **CDR/CEL Integration**: Full call logging for billing and analytics

## Documentation

Detailed documentation is available in:
- [`config/sip-trunks/README.md`](config/sip-trunks/README.md) - Complete configuration guide
- [`docs/`](docs/) - Additional operational documentation

## Monitoring & Troubleshooting

### Essential CLI Commands

```bash
# Check endpoints
asterisk -rx "pjsip show endpoints"

# Monitor SIP traffic
asterisk -rx "pjsip set logger on"

# Debug RTP issues
asterisk -rx "rtp set debug on"

# View active calls
asterisk -rx "core show channels verbose"

# Check call queues
asterisk -rx "queue show"
```

### Common Issues

- **One-Way Audio**: Check firewall RTP ports, verify NAT settings
- **No Audio**: Verify codec compatibility, check RTP port range
- **Call Routing Failures**: Verify endpoint configuration, check dialplan context
- **High Latency**: Check network connectivity, consider route optimization

## Adding New Suppliers

To add a new IP supplier:

1. Edit `config/sip-trunks/ip-suppliers.conf`
2. Copy the template section
3. Replace placeholders with supplier details
4. Reload PJSIP: `asterisk -rx "pjsip reload"`
5. Test with: `asterisk -rx "pjsip show endpoint <name>"`

See [`config/sip-trunks/README.md`](config/sip-trunks/README.md) for detailed instructions.

## Testing

Run tests to verify configuration:
```bash
# Run test suite (if available)
npm test

# Validate PJSIP configuration
asterisk -rx "pjsip show endpoints"
asterisk -rx "pjsip show transports"
```

## Production Deployment

1. **Pre-deployment Checklist**:
   - [ ] Firewall rules configured
   - [ ] RTP port range set (10000-20000)
   - [ ] PJSIP transport configured
   - [ ] Endpoints tested
   - [ ] CDR/CEL logging enabled
   - [ ] Monitoring tools configured (Asternic if used)

2. **Deployment**:
   ```bash
   # Copy configuration
   cp config/sip-trunks/ip-suppliers.conf /etc/asterisk/sip-trunks/
   
   # Update pjsip.conf
   echo "#include sip-trunks/ip-suppliers.conf" >> /etc/asterisk/pjsip.conf
   
   # Reload (safe during live traffic)
   asterisk -rx "pjsip reload"
   ```

3. **Post-deployment Verification**:
   - Verify endpoints: `pjsip show endpoints`
   - Test inbound call routing
   - Monitor RTP flow
   - Check CDR entries

## Security

- IP-based authentication (no username/password)
- Supplier IP whitelisting via `identify_by=ip`
- Rate limiting recommended for production
- Regular security updates for Asterisk
- Fail2ban recommended for SIP attack prevention

## Support & Maintenance

For production support:
- Monitor `/var/log/asterisk/messages` for errors
- Use `pjsip set logger on` for detailed SIP debugging
- Check system resources: CPU, memory, network bandwidth
- Ensure Asterisk service is running: `systemctl status asterisk`

## License

[Add your license information here]

## Contact

Gulf Premium Telecom  
IP Routing Network Division

---

**Note**: This is a carrier-grade VoIP infrastructure. Always test changes in a non-production environment before deploying to live traffic.
