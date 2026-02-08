# Gulf Premium Telecom - Asterisk PBX Configuration

Production-ready Asterisk PBX configuration for carrier-grade VoIP operations with IP-based authentication, Twilio integration, and IVR system.

## Features

- **IP-Based Carrier Authentication**: Accept inbound calls from carriers without username/password
- **Twilio SIP Trunk Integration**: Outbound calling via Twilio
- **IVR System**: Customizable Interactive Voice Response menu
- **Call Detail Records**: Comprehensive CDR logging for billing and reporting
- **Security**: IP ACLs and firewall configuration
- **High Performance**: Optimized for high CPS and concurrent calls
- **Production Ready**: Tested configuration following Asterisk best practices

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/YOUR-ORG/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom

# 2. Run setup script
cd asterisk-config/scripts
sudo ./setup.sh

# 3. Configure your settings
sudo nano /etc/asterisk/pjsip.conf        # Update IPs and Twilio credentials
sudo nano /etc/asterisk/extensions.conf   # Update destination numbers

# 4. Start Asterisk
sudo systemctl start asterisk
```

## Documentation

Comprehensive documentation is available in the `asterisk-config` directory:

- **[Installation & Configuration Guide](asterisk-config/README.md)** - Complete setup instructions
- **[Troubleshooting Guide](asterisk-config/docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Sample Configurations](asterisk-config/samples/)** - Example configurations for various scenarios

## Architecture

```
Carriers (IP Auth) → Asterisk PBX (IVR + Routing) → Twilio SIP → Destinations
```

## Directory Structure

```
asterisk-config/
├── conf/              # Production configuration files
├── scripts/           # Setup and testing scripts
├── docs/             # Additional documentation
└── samples/          # Example configurations
```

## Requirements

- Ubuntu 20.04 LTS or newer (or Debian 10+)
- Asterisk 16, 18, or 20
- Public IP address or proper NAT configuration
- Twilio account with SIP trunk

## Support

For issues, questions, or contributions, please refer to the documentation or contact the Gulf Premium Telecom technical team.

## License

© 2024 Gulf Premium Telecom - All Rights Reserved

---

**Gulf Premium Telecom**  
*Premium Voice Services for Saudi Arabia, Asia & MENA*
