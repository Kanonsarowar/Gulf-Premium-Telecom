#!/bin/bash
# Quick Setup Script for SIP Trunk Configuration
# Gulf Premium Telecom - Trunk Configuration

echo "=========================================="
echo "Gulf Premium Telecom - Trunk Setup"
echo "=========================================="
echo ""
echo "Your Server IP: 167.172.170.88"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Backup existing configuration
echo "1. Backing up existing configuration..."
cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup.$(date +%Y%m%d_%H%M%S)
cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✓ Backups created"

# Copy new configuration
echo ""
echo "2. Installing new trunk configuration..."
cp asterisk-config/sip.conf /etc/asterisk/
cp asterisk-config/extensions.conf /etc/asterisk/
chown asterisk:asterisk /etc/asterisk/sip.conf
chown asterisk:asterisk /etc/asterisk/extensions.conf
echo "   ✓ Configuration files installed"

# Configure firewall (using UFW)
echo ""
echo "3. Configuring firewall rules..."
echo "   Adding supplier IPs to firewall..."

# Supplier Group 1
ufw allow from 108.61.70.46 to any port 5060 proto udp comment "Supplier1-Trunk1"
ufw allow from 157.90.193.196 to any port 5060 proto udp comment "Supplier1-Trunk2"
ufw allow from 51.77.77.223 to any port 5060 proto udp comment "Supplier1-Trunk3"
ufw allow from 95.217.90.212 to any port 5060 proto udp comment "Supplier1-Trunk4"

# Supplier Group 2 (AWS)
ufw allow from 52.28.165.40 to any port 5060 proto udp comment "Supplier2-AWS1"
ufw allow from 52.57.172.184 to any port 5060 proto udp comment "Supplier2-AWS2"
ufw allow from 35.156.119.128 to any port 5060 proto udp comment "Supplier2-AWS3"

# Supplier Group 3 (Quintum)
ufw allow from 149.12.160.10 to any port 5060 proto udp comment "Supplier3-Quintum"

echo "   ✓ Firewall rules added"

# Reload Asterisk
echo ""
echo "4. Reloading Asterisk configuration..."
asterisk -rx "sip reload"
asterisk -rx "dialplan reload"
echo "   ✓ Asterisk reloaded"

# Show trunk status
echo ""
echo "5. Verifying trunk configuration..."
echo ""
asterisk -rx "sip show peers" | grep -E "supplier|Name"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Configured Trunks:"
echo "  • Supplier Group 1: 4 trunks"
echo "  • Supplier Group 2 (AWS): 3 trunks"
echo "  • Supplier Group 3 (Quintum): 1 trunk"
echo "  • Total: 8 SIP trunks"
echo ""
echo "Next Steps:"
echo "1. Contact each supplier to confirm your IP (167.172.170.88) is whitelisted"
echo "2. Request test calls from each trunk"
echo "3. Monitor with: asterisk -rvvv"
echo "4. Check trunk status: asterisk -rx 'sip show peers'"
echo ""
echo "For detailed information, see TRUNK_CONFIG.md"
echo ""
