# IP Supplier Configuration Documentation

## Overview

This directory contains PJSIP configuration for IP-based SIP trunk suppliers used in the Gulf Premium Telecom IPRN (IP Routing Network).

## Our Infrastructure

### Primary IP Address
- **IP**: 167.172.170.88
- **SIP Port**: 5060 (UDP)
- **RTP Port Range**: 10000-20000 (UDP)

### Supported Codecs (Priority Order)
1. **G.711 μ-law (ulaw)** - North American standard, 64kbps, highest quality
2. **G.711 A-law (alaw)** - European/MENA standard, 64kbps, highest quality
3. **G.729 (g729)** - Compressed codec, 8kbps, bandwidth-efficient for carrier networks
4. **G.722** - HD audio codec, 64kbps, wideband audio

## Configuration Files

### `ip-suppliers.conf`
Main configuration file containing:
- Gulf Premium Telecom endpoint configuration
- IP supplier endpoint templates
- Codec and port specifications
- Production deployment notes

## Network Requirements

### Firewall Rules
Ensure the following ports are open:
```
UDP 5060        - SIP signaling (inbound/outbound)
UDP 10000-20000 - RTP media (inbound/outbound)
```

### NAT Considerations
For deployments behind NAT or SBC:
- Configure `external_media_address` in PJSIP transport
- Configure `external_signaling_address` in PJSIP transport
- Enable `rtp_symmetric=yes` (already configured)
- Enable `rewrite_contact=yes` (already configured)

## Adding New IP Suppliers

To add a new supplier:

1. Copy the template from `ip-suppliers.conf`
2. Replace placeholders:
   - `supplier-name` → actual supplier name
   - `SUPPLIER_IP` → supplier's IP address
   - `PORT` → supplier's SIP port (usually 5060)
3. Adjust codec list if supplier has specific requirements
4. Reload PJSIP: `asterisk -rx "pjsip reload"`

## Testing and Verification

### CLI Commands
```bash
# Verify endpoint configuration
asterisk -rx "pjsip show endpoints"

# Check specific endpoint
asterisk -rx "pjsip show endpoint gpt-trunk-endpoint"

# Monitor SIP signaling
asterisk -rx "pjsip set logger on"

# Monitor RTP media
asterisk -rx "rtp set debug on"

# Check active channels
asterisk -rx "core show channels verbose"

# Verify transport binding
asterisk -rx "pjsip show transports"
```

### SIP Test Call
1. Ensure supplier IP is whitelisted
2. Send test SIP INVITE to 167.172.170.88:5060
3. Verify codec negotiation in SIP 200 OK
4. Check RTP flow with `rtp set debug on`
5. Verify two-way audio

## Troubleshooting

### One-Way Audio
- Check firewall rules for RTP ports
- Verify `rtp_symmetric=yes` is enabled
- Check NAT configuration
- Verify external_media_address if behind NAT

### No Audio (Silence)
- Check codec mismatch
- Verify RTP ports are not blocked
- Check `rtp set debug on` for packet flow
- Verify media anchoring with `direct_media=no`

### SIP Registration Issues
- This is IP-to-IP routing (no registration required)
- If supplier requires registration, add registration section
- Check `identify_by=ip` configuration

### Call Routing Failures
- Verify context `from-supplier` exists in dialplan
- Check `pjsip show endpoints` for endpoint status
- Review CLI logs for SIP response codes
- Check qualify status: `pjsip show aors`

## Integration with Asterisk

### Include in Main Configuration
Add to `/etc/asterisk/pjsip.conf`:
```ini
#include /path/to/config/sip-trunks/ip-suppliers.conf
```

### Required Transport Configuration
Ensure PJSIP transport is configured in `pjsip.conf`:
```ini
[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060
external_media_address=YOUR_PUBLIC_IP
external_signaling_address=YOUR_PUBLIC_IP
```

### RTP Configuration
Ensure `/etc/asterisk/rtp.conf` contains:
```ini
[general]
rtpstart=10000
rtpend=20000
rtcpinterval=5000    ; RTCP interval in milliseconds (recommended for monitoring)
strictrtp=yes        ; Enable strict RTP for security (drop unexpected RTP packets)
```

## High-Volume Considerations

For carrier-grade deployments handling high CPS:
- Monitor system resources (CPU, network bandwidth)
- Consider SBC deployment for media anchoring
- Use `qualify_frequency=60` for health checks
- Implement proper CDR/CEL logging for billing
- Set up monitoring for queue metrics if using Asternic
- Consider load balancing for multiple Asterisk instances

## Security Best Practices

1. **IP Whitelisting**: Only allow known supplier IPs
2. **Fail2ban**: Monitor for SIP scanning attempts
3. **Rate Limiting**: Implement CPS limits if needed
4. **Secure Codecs**: Disable unnecessary codecs
5. **Logging**: Enable detailed SIP/RTP logging for audit trails
6. **Regular Updates**: Keep Asterisk patched and updated

## Support

For issues or questions:
- Review Asterisk logs: `/var/log/asterisk/messages`
- Check PJSIP logger output
- Consult Asterisk CLI help: `core show help`
- Reference: https://wiki.asterisk.org/wiki/display/AST/PJSIP
