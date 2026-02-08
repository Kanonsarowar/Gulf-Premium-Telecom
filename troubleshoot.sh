#!/bin/bash
#============================================================================
# Asterisk IPRN Troubleshooting Script
# Gulf Premium Telecom
#
# Purpose: Automated diagnostics for inbound call issues
# Usage: sudo ./troubleshoot.sh
#============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}ERROR: Please run as root (use sudo)${NC}"
    exit 1
fi

echo "============================================================================"
echo "  Gulf Premium Telecom - Asterisk IPRN Troubleshooting"
echo "  $(date)"
echo "============================================================================"
echo ""

#============================================================================
# 1. CHECK ASTERISK STATUS
#============================================================================
echo -e "${BLUE}[1/10] Checking Asterisk Status...${NC}"

if systemctl is-active --quiet asterisk; then
    echo -e "${GREEN}✓ Asterisk is running${NC}"
    ASTERISK_PID=$(pgrep asterisk)
    echo "  PID: $ASTERISK_PID"
    UPTIME=$(asterisk -rx "core show uptime" 2>/dev/null | grep "System uptime")
    echo "  $UPTIME"
else
    echo -e "${RED}✗ Asterisk is NOT running${NC}"
    echo "  Attempting to start..."
    systemctl start asterisk
    sleep 3
    if systemctl is-active --quiet asterisk; then
        echo -e "${GREEN}✓ Asterisk started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start Asterisk${NC}"
        echo "  Check: journalctl -xeu asterisk.service"
        exit 1
    fi
fi
echo ""

#============================================================================
# 2. CHECK NETWORK CONNECTIVITY
#============================================================================
echo -e "${BLUE}[2/10] Checking Network Connectivity...${NC}"

# Get primary IP
PRIMARY_IP=$(ip route get 8.8.8.8 | awk '{print $7}' | head -1)
echo "  Primary IP: $PRIMARY_IP"

# Check if IP is valid
if [[ $PRIMARY_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${GREEN}✓ Valid IP address${NC}"
else
    echo -e "${RED}✗ No valid IP address found${NC}"
fi

# Check internet connectivity
if ping -c 1 -W 2 8.8.8.8 &> /dev/null; then
    echo -e "${GREEN}✓ Internet connectivity OK${NC}"
else
    echo -e "${YELLOW}⚠ No internet connectivity (may be OK if isolated network)${NC}"
fi
echo ""

#============================================================================
# 3. CHECK SIP PORT (5060)
#============================================================================
echo -e "${BLUE}[3/10] Checking SIP Port (5060/UDP)...${NC}"

if netstat -ulnp | grep -q ":5060.*asterisk"; then
    echo -e "${GREEN}✓ Asterisk listening on port 5060${NC}"
    netstat -ulnp | grep ":5060" | head -1
else
    echo -e "${RED}✗ Asterisk NOT listening on port 5060${NC}"
    echo "  This will prevent inbound calls!"
    echo "  Check: asterisk -rx 'pjsip show transports'"
fi
echo ""

#============================================================================
# 4. CHECK RTP PORTS (10000-20000)
#============================================================================
echo -e "${BLUE}[4/10] Checking RTP Port Range...${NC}"

RTP_PORTS=$(netstat -ulnp 2>/dev/null | grep asterisk | grep -E ":(1[0-9]{4})" | wc -l)
echo "  Active RTP ports: $RTP_PORTS"

if [ $RTP_PORTS -gt 0 ]; then
    echo -e "${GREEN}✓ RTP ports are being used (active calls)${NC}"
else
    echo -e "${YELLOW}⚠ No active RTP ports (no active calls or no RTP)${NC}"
fi
echo ""

#============================================================================
# 5. CHECK FIREWALL
#============================================================================
echo -e "${BLUE}[5/10] Checking Firewall...${NC}"

# Check UFW (Ubuntu/Debian)
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo "  UFW is active"
        if ufw status | grep -q "5060/udp"; then
            echo -e "${GREEN}✓ SIP port 5060/udp is allowed${NC}"
        else
            echo -e "${RED}✗ SIP port 5060/udp is NOT allowed${NC}"
            echo "  Fix: sudo ufw allow 5060/udp"
        fi
        
        if ufw status | grep -q "10000:20000/udp"; then
            echo -e "${GREEN}✓ RTP ports 10000:20000/udp are allowed${NC}"
        else
            echo -e "${RED}✗ RTP ports 10000:20000/udp are NOT allowed${NC}"
            echo "  Fix: sudo ufw allow 10000:20000/udp"
        fi
    else
        echo -e "${YELLOW}⚠ UFW is not active${NC}"
    fi
fi

# Check firewalld (CentOS/RHEL)
if command -v firewall-cmd &> /dev/null; then
    if systemctl is-active --quiet firewalld; then
        echo "  firewalld is active"
        if firewall-cmd --list-ports | grep -q "5060/udp"; then
            echo -e "${GREEN}✓ SIP port 5060/udp is allowed${NC}"
        else
            echo -e "${RED}✗ SIP port 5060/udp is NOT allowed${NC}"
            echo "  Fix: sudo firewall-cmd --permanent --add-port=5060/udp"
        fi
        
        if firewall-cmd --list-ports | grep -q "10000-20000/udp"; then
            echo -e "${GREEN}✓ RTP ports are allowed${NC}"
        else
            echo -e "${RED}✗ RTP ports are NOT allowed${NC}"
            echo "  Fix: sudo firewall-cmd --permanent --add-port=10000-20000/udp"
        fi
    else
        echo -e "${YELLOW}⚠ firewalld is not active${NC}"
    fi
fi

# Check iptables
if command -v iptables &> /dev/null; then
    IPTABLES_RULES=$(iptables -L -n | grep -E "5060|10000:20000")
    if [ -n "$IPTABLES_RULES" ]; then
        echo "  iptables rules found for SIP/RTP"
    fi
fi

echo ""

#============================================================================
# 6. CHECK PJSIP CONFIGURATION
#============================================================================
echo -e "${BLUE}[6/10] Checking PJSIP Configuration...${NC}"

# Check transports
TRANSPORT_STATUS=$(asterisk -rx "pjsip show transports" 2>/dev/null | grep "transport-udp")
if [ -n "$TRANSPORT_STATUS" ]; then
    echo -e "${GREEN}✓ PJSIP transport configured${NC}"
    echo "  $TRANSPORT_STATUS"
else
    echo -e "${RED}✗ PJSIP transport NOT configured${NC}"
    echo "  Check /etc/asterisk/pjsip.conf"
fi

# Check endpoints
ENDPOINT_COUNT=$(asterisk -rx "pjsip show endpoints" 2>/dev/null | grep -c "upstream-provider")
echo "  Upstream endpoints configured: $ENDPOINT_COUNT"

if [ $ENDPOINT_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Upstream endpoints found${NC}"
    asterisk -rx "pjsip show endpoints" 2>/dev/null | grep "upstream-provider" | head -5
else
    echo -e "${YELLOW}⚠ No upstream endpoints configured${NC}"
    echo "  Check /etc/asterisk/pjsip.conf"
fi
echo ""

#============================================================================
# 7. CHECK DIALPLAN
#============================================================================
echo -e "${BLUE}[7/10] Checking Dialplan Configuration...${NC}"

# Check from-upstream context
DIALPLAN_CHECK=$(asterisk -rx "dialplan show from-upstream" 2>/dev/null | grep -c "Extension")
if [ $DIALPLAN_CHECK -gt 0 ]; then
    echo -e "${GREEN}✓ Dialplan 'from-upstream' context configured${NC}"
    echo "  Extensions: $DIALPLAN_CHECK"
else
    echo -e "${RED}✗ Dialplan 'from-upstream' context NOT found${NC}"
    echo "  Check /etc/asterisk/extensions.conf"
fi

# Check did-routing context
DID_ROUTING_CHECK=$(asterisk -rx "dialplan show did-routing" 2>/dev/null | grep -c "Extension")
if [ $DID_ROUTING_CHECK -gt 0 ]; then
    echo -e "${GREEN}✓ Dialplan 'did-routing' context configured${NC}"
    echo "  Extensions: $DID_ROUTING_CHECK"
else
    echo -e "${YELLOW}⚠ Dialplan 'did-routing' context may not be configured${NC}"
fi
echo ""

#============================================================================
# 8. CHECK ACTIVE CALLS
#============================================================================
echo -e "${BLUE}[8/10] Checking Active Calls...${NC}"

ACTIVE_CALLS=$(asterisk -rx "core show channels" 2>/dev/null | tail -1)
echo "  $ACTIVE_CALLS"

CHANNEL_COUNT=$(asterisk -rx "core show channels concise" 2>/dev/null | wc -l)
if [ $CHANNEL_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Active calls in progress${NC}"
    asterisk -rx "core show channels verbose" 2>/dev/null | head -10
else
    echo -e "${YELLOW}⚠ No active calls${NC}"
fi
echo ""

#============================================================================
# 9. CHECK RECENT ERRORS
#============================================================================
echo -e "${BLUE}[9/10] Checking Recent Errors...${NC}"

if [ -f /var/log/asterisk/full ]; then
    ERROR_COUNT=$(grep -c "ERROR" /var/log/asterisk/full 2>/dev/null | tail -100)
    echo "  Recent errors in log: checking last 100 lines..."
    
    RECENT_ERRORS=$(grep "ERROR\|WARNING" /var/log/asterisk/full 2>/dev/null | tail -5)
    if [ -n "$RECENT_ERRORS" ]; then
        echo -e "${YELLOW}⚠ Recent errors/warnings found:${NC}"
        echo "$RECENT_ERRORS" | while read line; do
            echo "  $line"
        done
    else
        echo -e "${GREEN}✓ No recent errors${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Log file not found: /var/log/asterisk/full${NC}"
fi
echo ""

#============================================================================
# 10. CHECK SYSTEM RESOURCES
#============================================================================
echo -e "${BLUE}[10/10] Checking System Resources...${NC}"

# CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
echo "  CPU Usage: ${CPU_USAGE}%"

# Memory
MEMORY_INFO=$(free -h | grep Mem)
echo "  Memory: $MEMORY_INFO"

# Disk
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}')
echo "  Disk Usage (root): $DISK_USAGE"

# Asterisk memory
if [ -n "$ASTERISK_PID" ]; then
    ASTERISK_MEM=$(ps -p $ASTERISK_PID -o rss= | awk '{print $1/1024 " MB"}')
    echo "  Asterisk Memory: $ASTERISK_MEM"
fi

# Check if system is under load
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
echo "  Load Average:$LOAD_AVG"

echo ""

#============================================================================
# SUMMARY AND RECOMMENDATIONS
#============================================================================
echo "============================================================================"
echo -e "${BLUE}SUMMARY AND RECOMMENDATIONS${NC}"
echo "============================================================================"

# Generate recommendations
RECOMMENDATIONS=()

# Check 1: Asterisk running
if ! systemctl is-active --quiet asterisk; then
    RECOMMENDATIONS+=("${RED}CRITICAL: Start Asterisk - systemctl start asterisk${NC}")
fi

# Check 2: SIP port listening
if ! netstat -ulnp | grep -q ":5060.*asterisk"; then
    RECOMMENDATIONS+=("${RED}CRITICAL: SIP port not listening - check pjsip.conf${NC}")
fi

# Check 3: Endpoints configured
if [ $ENDPOINT_COUNT -eq 0 ]; then
    RECOMMENDATIONS+=("${YELLOW}WARNING: No upstream endpoints - configure pjsip.conf${NC}")
fi

# Check 4: Dialplan configured
if [ $DIALPLAN_CHECK -eq 0 ]; then
    RECOMMENDATIONS+=("${RED}CRITICAL: No dialplan - configure extensions.conf${NC}")
fi

# Check 5: Firewall
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        if ! ufw status | grep -q "5060/udp"; then
            RECOMMENDATIONS+=("${YELLOW}WARNING: Open firewall port - ufw allow 5060/udp${NC}")
        fi
        if ! ufw status | grep -q "10000:20000/udp"; then
            RECOMMENDATIONS+=("${YELLOW}WARNING: Open RTP ports - ufw allow 10000:20000/udp${NC}")
        fi
    fi
fi

# Display recommendations
if [ ${#RECOMMENDATIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ No critical issues found!${NC}"
    echo ""
    echo "System appears to be configured correctly for inbound calls."
    echo ""
    echo "Next steps:"
    echo "1. Verify upstream provider IPs in /etc/asterisk/pjsip.conf"
    echo "2. Test inbound call from upstream"
    echo "3. Monitor logs: tail -f /var/log/asterisk/full"
else
    echo -e "${YELLOW}Issues found that need attention:${NC}"
    echo ""
    for rec in "${RECOMMENDATIONS[@]}"; do
        echo -e "  • $rec"
    done
fi

echo ""
echo "============================================================================"
echo "DEBUGGING COMMANDS"
echo "============================================================================"
echo ""
echo "Connect to Asterisk console:"
echo "  asterisk -rvvv"
echo ""
echo "Enable PJSIP debugging:"
echo "  asterisk -rx 'pjsip set logger on'"
echo ""
echo "Enable RTP debugging:"
echo "  asterisk -rx 'rtp set debug on'"
echo ""
echo "Watch for incoming SIP traffic:"
echo "  tcpdump -i any -n port 5060 -A"
echo ""
echo "Watch for RTP traffic:"
echo "  tcpdump -i any -n udp portrange 10000-20000"
echo ""
echo "View real-time log:"
echo "  tail -f /var/log/asterisk/full"
echo ""
echo "Check endpoint status:"
echo "  asterisk -rx 'pjsip show endpoints'"
echo ""
echo "Check active calls:"
echo "  asterisk -rx 'core show channels verbose'"
echo ""
echo "============================================================================"
echo "Troubleshooting complete. $(date)"
echo "============================================================================"
