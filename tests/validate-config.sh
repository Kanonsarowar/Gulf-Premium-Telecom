#!/bin/bash
# Configuration Validation Test Script
# Tests the IP supplier configuration for Gulf Premium Telecom

set -euo pipefail

echo "=================================="
echo "Gulf Premium Telecom Config Tests"
echo "=================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}/../config/sip-trunks"
CONFIG_FILE="${CONFIG_DIR}/ip-suppliers.conf"

# Test 1: Configuration file exists
echo "Test 1: Checking if configuration file exists..."
if [ -f "$CONFIG_FILE" ]; then
    echo "✓ PASS: Configuration file exists at $CONFIG_FILE"
else
    echo "✗ FAIL: Configuration file not found"
    exit 1
fi
echo ""

# Test 2: Validate our IP address is present
echo "Test 2: Validating Gulf Premium Telecom IP address (167.172.170.88)..."
if grep -q "167.172.170.88" "$CONFIG_FILE"; then
    echo "✓ PASS: IP address 167.172.170.88 found in configuration"
else
    echo "✗ FAIL: IP address 167.172.170.88 not found"
    exit 1
fi
echo ""

# Test 3: Validate SIP port configuration
echo "Test 3: Checking SIP port (5060) configuration..."
if grep -q "5060" "$CONFIG_FILE"; then
    echo "✓ PASS: SIP port 5060 found in configuration"
else
    echo "✗ FAIL: SIP port 5060 not found"
    exit 1
fi
echo ""

# Test 4: Validate codecs are configured
echo "Test 4: Validating codec configuration..."
codecs=("ulaw" "alaw" "g729" "g722")
all_codecs_found=true

for codec in "${codecs[@]}"; do
    if grep -q "allow=$codec" "$CONFIG_FILE"; then
        echo "  ✓ Codec $codec configured"
    else
        echo "  ✗ Codec $codec not found"
        all_codecs_found=false
    fi
done

if [ "$all_codecs_found" = true ]; then
    echo "✓ PASS: All required codecs are configured"
else
    echo "✗ FAIL: Some codecs are missing"
    exit 1
fi
echo ""

# Test 5: Validate PJSIP endpoint structure
echo "Test 5: Validating PJSIP endpoint structure..."
required_sections=("gpt-trunk-endpoint" "gpt-trunk-aor" "gpt-trunk-identify")
all_sections_found=true

for section in "${required_sections[@]}"; do
    if grep -q "\[$section\]" "$CONFIG_FILE"; then
        echo "  ✓ Section [$section] found"
    else
        echo "  ✗ Section [$section] not found"
        all_sections_found=false
    fi
done

if [ "$all_sections_found" = true ]; then
    echo "✓ PASS: All required PJSIP sections are configured"
else
    echo "✗ FAIL: Some PJSIP sections are missing"
    exit 1
fi
echo ""

# Test 6: Validate essential PJSIP parameters
echo "Test 6: Validating essential PJSIP parameters..."
essential_params=("type=endpoint" "type=aor" "type=identify" "rtp_symmetric=yes" "direct_media=no" "rewrite_contact=yes")
all_params_found=true

for param in "${essential_params[@]}"; do
    if grep -q "$param" "$CONFIG_FILE"; then
        echo "  ✓ Parameter '$param' found"
    else
        echo "  ✗ Parameter '$param' not found"
        all_params_found=false
    fi
done

if [ "$all_params_found" = true ]; then
    echo "✓ PASS: All essential PJSIP parameters are configured"
else
    echo "✗ FAIL: Some essential parameters are missing"
    exit 1
fi
echo ""

# Test 7: Validate RTP port range is documented
echo "Test 7: Validating RTP port range documentation..."
if grep -q "10000" "$CONFIG_FILE" && grep -q "20000" "$CONFIG_FILE"; then
    echo "✓ PASS: RTP port range (10000-20000) is documented"
else
    echo "✗ FAIL: RTP port range not documented"
    exit 1
fi
echo ""

# Test 8: Check for supplier template
echo "Test 8: Checking for IP supplier template..."
if grep -q "Template for adding new suppliers" "$CONFIG_FILE"; then
    echo "✓ PASS: Supplier template found in configuration"
else
    echo "✗ FAIL: Supplier template not found"
    exit 1
fi
echo ""

# Test 9: Validate README exists
echo "Test 9: Checking for documentation README..."
README_FILE="${CONFIG_DIR}/README.md"
if [ -f "$README_FILE" ]; then
    echo "✓ PASS: README documentation exists at $README_FILE"
else
    echo "✗ FAIL: README documentation not found"
    exit 1
fi
echo ""

# Test 10: Validate README contains key information
echo "Test 10: Validating README content..."
readme_checks=("167.172.170.88" "5060" "10000-20000" "ulaw" "alaw" "g729")
all_readme_checks_passed=true

for check in "${readme_checks[@]}"; do
    if grep -q "$check" "$README_FILE"; then
        echo "  ✓ '$check' found in README"
    else
        echo "  ✗ '$check' not found in README"
        all_readme_checks_passed=false
    fi
done

if [ "$all_readme_checks_passed" = true ]; then
    echo "✓ PASS: README contains all key information"
else
    echo "✗ FAIL: README is missing some key information"
    exit 1
fi
echo ""

# Test 11: Configuration file syntax check (basic)
echo "Test 11: Basic configuration syntax check..."
# Check for balanced brackets
open_brackets=$(grep -o '\[' "$CONFIG_FILE" | wc -l)
close_brackets=$(grep -o '\]' "$CONFIG_FILE" | wc -l)

if [ "$open_brackets" -eq "$close_brackets" ]; then
    echo "✓ PASS: Configuration brackets are balanced ($open_brackets sections)"
else
    echo "✗ FAIL: Configuration brackets are not balanced (open: $open_brackets, close: $close_brackets)"
    exit 1
fi
echo ""

# Test 12: Check for NAT traversal configuration
echo "Test 12: Validating NAT traversal settings..."
nat_params=("rtp_symmetric=yes" "rewrite_contact=yes")
all_nat_params_found=true

for param in "${nat_params[@]}"; do
    if grep -q "$param" "$CONFIG_FILE"; then
        echo "  ✓ NAT parameter '$param' configured"
    else
        echo "  ✗ NAT parameter '$param' not found"
        all_nat_params_found=false
    fi
done

if [ "$all_nat_params_found" = true ]; then
    echo "✓ PASS: NAT traversal is properly configured"
else
    echo "✗ FAIL: NAT traversal configuration incomplete"
    exit 1
fi
echo ""

echo "=================================="
echo "All tests passed successfully! ✓"
echo "=================================="
echo ""
echo "Configuration Summary:"
echo "  - IP Address: 167.172.170.88"
echo "  - SIP Port: 5060"
echo "  - RTP Ports: 10000-20000"
echo "  - Codecs: ulaw, alaw, g729, g722"
echo "  - Protocol: PJSIP (IP-to-IP)"
echo "  - NAT: Enabled with symmetric RTP"
echo ""
echo "Next steps:"
echo "  1. Include config in /etc/asterisk/pjsip.conf"
echo "  2. Configure firewall rules for UDP 5060 and 10000-20000"
echo "  3. Reload PJSIP: asterisk -rx 'pjsip reload'"
echo "  4. Verify: asterisk -rx 'pjsip show endpoints'"
echo ""

exit 0
