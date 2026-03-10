#!/bin/bash
# ============================================================================
# Gulf Premium Telecom - Asterisk Testing Script
# ============================================================================
# This script performs basic health checks on Asterisk configuration
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Asterisk Configuration Test${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Check if Asterisk is running
echo -n "Checking if Asterisk is running... "
if pgrep -x "asterisk" > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "Start Asterisk: sudo systemctl start asterisk"
    exit 1
fi

# Test Asterisk CLI connectivity
echo -n "Testing Asterisk CLI connectivity... "
if asterisk -rx "core show version" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
    VERSION=$(asterisk -rx "core show version" | head -n 1)
    echo "  $VERSION"
else
    echo -e "${RED}✗ Cannot connect${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}PJSIP Configuration:${NC}"
echo "----------------------------------------"

# Check PJSIP transports
echo -n "Checking PJSIP transports... "
TRANSPORTS=$(asterisk -rx "pjsip show transports" | grep -E "transport-udp|transport-tcp" | wc -l)
if [ $TRANSPORTS -gt 0 ]; then
    echo -e "${GREEN}✓ $TRANSPORTS transport(s) configured${NC}"
    asterisk -rx "pjsip show transports" | grep -E "Transport:|udp|tcp" | head -n 10
else
    echo -e "${RED}✗ No transports found${NC}"
fi

echo ""
echo -n "Checking PJSIP endpoints... "
ENDPOINTS=$(asterisk -rx "pjsip show endpoints" | grep "Endpoint:" | wc -l)
if [ $ENDPOINTS -gt 1 ]; then
    echo -e "${GREEN}✓ $((ENDPOINTS-1)) endpoint(s) configured${NC}"
    asterisk -rx "pjsip show endpoints" | head -n 10
else
    echo -e "${YELLOW}! No endpoints found${NC}"
fi

echo ""
echo -n "Checking PJSIP ACLs... "
ACLS=$(asterisk -rx "pjsip show acls" 2>/dev/null | grep "ACL:" | wc -l)
if [ $ACLS -gt 0 ]; then
    echo -e "${GREEN}✓ $ACLS ACL(s) configured${NC}"
else
    echo -e "${YELLOW}! No ACLs found${NC}"
fi

echo ""
echo -e "${YELLOW}Dialplan Configuration:${NC}"
echo "----------------------------------------"

# Check dialplan contexts
echo -n "Checking dialplan contexts... "
CONTEXTS=$(asterisk -rx "dialplan show" | grep "Context" | wc -l)
if [ $CONTEXTS -gt 0 ]; then
    echo -e "${GREEN}✓ $CONTEXTS context(s) loaded${NC}"
    echo ""
    echo "Key contexts:"
    asterisk -rx "dialplan show" | grep -E "Context 'from-carriers'|Context 'ivr-main'|Context 'internal-extensions'|Context 'outbound-twilio'"
else
    echo -e "${RED}✗ No contexts found${NC}"
fi

echo ""
echo -e "${YELLOW}RTP Configuration:${NC}"
echo "----------------------------------------"

# Check RTP settings
echo "RTP port range:"
grep -E "rtpstart|rtpend" /etc/asterisk/rtp.conf | head -n 2

echo ""
echo -e "${YELLOW}Module Status:${NC}"
echo "----------------------------------------"

# Check critical modules
MODULES=("res_pjsip.so" "chan_pjsip.so" "res_rtp_asterisk.so" "pbx_config.so")
for module in "${MODULES[@]}"; do
    echo -n "  $module ... "
    if asterisk -rx "module show like $module" | grep -q "$module"; then
        echo -e "${GREEN}✓ Loaded${NC}"
    else
        echo -e "${RED}✗ Not loaded${NC}"
    fi
done

echo ""
echo -e "${YELLOW}File System Checks:${NC}"
echo "----------------------------------------"

# Check directories
DIRS=("/etc/asterisk" "/var/lib/asterisk/sounds/custom" "/var/spool/asterisk/monitor")
for dir in "${DIRS[@]}"; do
    echo -n "  $dir ... "
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ Exists${NC}"
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
done

# Check IVR audio files
echo ""
echo -n "Checking IVR audio files... "
AUDIO_FILES=("welcome.wav" "ivr-menu.wav" "invalid-option.wav" "timeout.wav")
FOUND=0
for file in "${AUDIO_FILES[@]}"; do
    if [ -f "/var/lib/asterisk/sounds/custom/$file" ]; then
        ((FOUND++))
    fi
done

if [ $FOUND -eq 4 ]; then
    echo -e "${GREEN}✓ All files present${NC}"
elif [ $FOUND -gt 0 ]; then
    echo -e "${YELLOW}! $FOUND/4 files found${NC}"
    echo "  Missing files:"
    for file in "${AUDIO_FILES[@]}"; do
        if [ ! -f "/var/lib/asterisk/sounds/custom/$file" ]; then
            echo "    - $file"
        fi
    done
else
    echo -e "${RED}✗ No audio files found${NC}"
    echo "  Create audio files in /var/lib/asterisk/sounds/custom/"
fi

echo ""
echo -e "${YELLOW}Network Configuration:${NC}"
echo "----------------------------------------"

# Check firewall rules
echo "Firewall status (UFW):"
if command -v ufw &> /dev/null; then
    ufw status | grep -E "5060|10000:20000" || echo -e "${YELLOW}  No Asterisk rules found${NC}"
else
    echo "  UFW not installed"
fi

echo ""
echo "Listening ports:"
netstat -tulpn 2>/dev/null | grep asterisk | head -n 5 || ss -tulpn | grep asterisk | head -n 5

echo ""
echo -e "${YELLOW}Configuration File Status:${NC}"
echo "----------------------------------------"

CONFIG_FILES=("pjsip.conf" "extensions.conf" "rtp.conf" "cdr.conf" "logger.conf" "modules.conf")
for file in "${CONFIG_FILES[@]}"; do
    echo -n "  $file ... "
    if [ -f "/etc/asterisk/$file" ]; then
        # Check if file has placeholders
        if grep -q "YOUR_" "/etc/asterisk/$file" 2>/dev/null; then
            echo -e "${YELLOW}✓ Exists (contains placeholders)${NC}"
        else
            echo -e "${GREEN}✓ Configured${NC}"
        fi
    else
        echo -e "${RED}✗ Missing${NC}"
    fi
done

echo ""
echo -e "${YELLOW}Active Channels:${NC}"
echo "----------------------------------------"
CHANNELS=$(asterisk -rx "core show channels" | grep "active call" | awk '{print $1}')
echo "Active channels: $CHANNELS"

echo ""
echo -e "${YELLOW}Recent Logs (last 5 lines):${NC}"
echo "----------------------------------------"
if [ -f "/var/log/asterisk/messages" ]; then
    tail -n 5 /var/log/asterisk/messages
else
    echo "Log file not found"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Test Complete${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "To test further:"
echo "  1. asterisk -rvvv                          # Connect to CLI"
echo "  2. pjsip show endpoints                    # Show all endpoints"
echo "  3. pjsip set logger on                     # Enable SIP debugging"
echo "  4. dialplan show from-carriers             # Show dialplan"
echo "  5. rtp set debug on                        # Enable RTP debugging"
echo ""
