#!/bin/bash
# ============================================================================
# Gulf Premium Telecom - Quick Setup Script
# ============================================================================
# This script assists with the initial setup of Asterisk configuration
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Gulf Premium Telecom${NC}"
echo -e "${GREEN}Asterisk PBX Setup Script${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root${NC}"
    echo "Please run: sudo $0"
    exit 1
fi

# Check if Asterisk is installed
if ! command -v asterisk &> /dev/null; then
    echo -e "${YELLOW}Warning: Asterisk is not installed${NC}"
    echo "Please install Asterisk first. See README.md for instructions."
    exit 1
fi

echo -e "${GREEN}Step 1: Backing up existing configuration${NC}"
if [ -d "/etc/asterisk" ]; then
    BACKUP_DIR="/etc/asterisk.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r /etc/asterisk "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
else
    mkdir -p /etc/asterisk
    echo -e "${GREEN}✓ Created /etc/asterisk directory${NC}"
fi

echo ""
echo -e "${GREEN}Step 2: Copying configuration files${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_DIR="$SCRIPT_DIR/../conf"

if [ ! -d "$CONFIG_DIR" ]; then
    echo -e "${RED}Error: Configuration directory not found: $CONFIG_DIR${NC}"
    exit 1
fi

cp "$CONFIG_DIR"/*.conf /etc/asterisk/
echo -e "${GREEN}✓ Configuration files copied${NC}"

echo ""
echo -e "${GREEN}Step 3: Creating required directories${NC}"
mkdir -p /var/spool/asterisk/monitor
mkdir -p /var/lib/asterisk/sounds/custom
echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo -e "${GREEN}Step 4: Setting permissions${NC}"
chown -R asterisk:asterisk /etc/asterisk
chown -R asterisk:asterisk /var/spool/asterisk/monitor
chown -R asterisk:asterisk /var/lib/asterisk/sounds/custom
chmod 640 /etc/asterisk/*.conf
echo -e "${GREEN}✓ Permissions set${NC}"

echo ""
echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}Configuration Setup Required${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""
echo "You must now configure the following files:"
echo ""
echo "1. /etc/asterisk/pjsip.conf"
echo "   - Update YOUR_PUBLIC_IP (lines 19-20)"
echo "   - Update carrier IP addresses in ACL sections"
echo "   - Update Twilio credentials (username, password, domain)"
echo ""
echo "2. /etc/asterisk/extensions.conf"
echo "   - Update TWILIO_CALLER_ID (line 20)"
echo "   - Update destination phone numbers"
echo ""
echo "3. Create IVR audio files in /var/lib/asterisk/sounds/custom/"
echo "   - welcome.wav"
echo "   - ivr-menu.wav"
echo "   - invalid-option.wav"
echo "   - timeout.wav"
echo ""
echo -e "${YELLOW}See README.md for detailed instructions${NC}"
echo ""

read -p "Do you want to configure pjsip.conf now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Prompt for configuration
    echo ""
    echo "Enter your configuration details:"
    echo ""
    
    read -p "Public IP Address: " PUBLIC_IP
    read -p "Carrier 1 IP/CIDR (e.g., 203.0.113.0/24): " CARRIER1_IP
    read -p "Carrier 2 IP/CIDR (or leave blank): " CARRIER2_IP
    read -p "Twilio SIP Domain (e.g., yourname.pstn.twilio.com): " TWILIO_DOMAIN
    read -p "Twilio Username: " TWILIO_USER
    read -sp "Twilio Password: " TWILIO_PASS
    echo ""
    
    # Update pjsip.conf
    sed -i "s/YOUR_PUBLIC_IP/$PUBLIC_IP/g" /etc/asterisk/pjsip.conf
    
    if [ ! -z "$CARRIER1_IP" ]; then
        sed -i "s|permit=203.0.113.0/24|permit=$CARRIER1_IP|g" /etc/asterisk/pjsip.conf
        sed -i "s|match=203.0.113.0/24|match=$CARRIER1_IP|g" /etc/asterisk/pjsip.conf
    fi
    
    if [ ! -z "$CARRIER2_IP" ]; then
        sed -i "s|permit=198.51.100.0/24|permit=$CARRIER2_IP|g" /etc/asterisk/pjsip.conf
        sed -i "s|match=198.51.100.0/24|match=$CARRIER2_IP|g" /etc/asterisk/pjsip.conf
    fi
    
    sed -i "s/YOUR_TWILIO_DOMAIN/$TWILIO_DOMAIN/g" /etc/asterisk/pjsip.conf
    sed -i "s/YOUR_TWILIO_USERNAME/$TWILIO_USER/g" /etc/asterisk/pjsip.conf
    sed -i "s/YOUR_TWILIO_PASSWORD/$TWILIO_PASS/g" /etc/asterisk/pjsip.conf
    
    echo -e "${GREEN}✓ pjsip.conf configured${NC}"
    echo ""
fi

read -p "Do you want to configure extensions.conf now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Twilio Caller ID (verified number, e.g., +1234567890): " CALLER_ID
    
    sed -i "s/+1234567890/$CALLER_ID/g" /etc/asterisk/extensions.conf
    
    echo -e "${GREEN}✓ extensions.conf configured${NC}"
    echo ""
fi

echo ""
echo -e "${GREEN}Step 5: Configuring firewall${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 5060/udp comment 'Asterisk SIP'
    ufw allow 5060/tcp comment 'Asterisk SIP'
    ufw allow 10000:20000/udp comment 'Asterisk RTP'
    echo -e "${GREEN}✓ Firewall rules added${NC}"
else
    echo -e "${YELLOW}! UFW not found, please configure firewall manually${NC}"
    echo "  Allow UDP/TCP 5060 and UDP 10000-20000"
fi

echo ""
echo -e "${GREEN}Step 6: Restarting Asterisk${NC}"
systemctl restart asterisk

# Wait for Asterisk to start
sleep 3

if systemctl is-active --quiet asterisk; then
    echo -e "${GREEN}✓ Asterisk is running${NC}"
else
    echo -e "${RED}✗ Asterisk failed to start${NC}"
    echo "Check logs: tail -f /var/log/asterisk/messages"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Create IVR audio files (see README.md)"
echo "2. Test PJSIP endpoints: asterisk -rx 'pjsip show endpoints'"
echo "3. Send test call from carrier"
echo "4. Review logs: tail -f /var/log/asterisk/full"
echo ""
echo "For detailed configuration and testing, see:"
echo "  $SCRIPT_DIR/../README.md"
echo ""
