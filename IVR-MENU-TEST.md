# IVR Menu Testing Guide

## Overview
This document provides commands to test the expanded IVR menu with options 1-6.

## IVR Menu Structure

The main IVR menu (`ivr-main` context) now supports the following options:

| Option | Description | Queue Destination |
|--------|-------------|-------------------|
| **1** | Sales Department | `queue-sales` |
| **2** | Technical Support | `queue-support` |
| **3** | Billing Department | `queue-billing` |
| **4** | VIP Support | `queue-vip` |
| **5** | Account Management | `queue-account-management` |
| **6** | Emergency Support | `queue-emergency` |
| **0** | Operator/Receptionist | `queue-operator` |
| **9** | Directory Access | Directory application |

## Testing Commands

### 1. Validate Asterisk Configuration Syntax

Before testing, ensure the configuration syntax is valid:

```bash
# Check extensions.conf syntax
sudo asterisk -rx "dialplan reload"
```

Expected output: `Dialplan reloaded.` with no errors.

### 2. View IVR Menu Dialplan

```bash
sudo asterisk -rx "dialplan show ivr-main"
```

This should show all extensions (s, 0, 1, 2, 3, 4, 5, 6, 9, i, t) in the ivr-main context.

### 3. Verify Queue Contexts Exist

```bash
# Check all queue contexts
sudo asterisk -rx "dialplan show queue-sales"
sudo asterisk -rx "dialplan show queue-support"
sudo asterisk -rx "dialplan show queue-billing"
sudo asterisk -rx "dialplan show queue-vip"
sudo asterisk -rx "dialplan show queue-account-management"
sudo asterisk -rx "dialplan show queue-emergency"
sudo asterisk -rx "dialplan show queue-operator"
```

Each command should return the dialplan for that specific queue context.

### 4. Verify Queues Are Configured

```bash
sudo asterisk -rx "queue show"
```

Expected output should show all queues: sales, support, billing, operator, and vip.

### 5. Test Call Flow (Simulated)

To simulate a call through the IVR menu:

```bash
# Enter Asterisk console
sudo asterisk -rvvv

# Then run originate commands to test each option
# Option 1 - Sales
originate Local/1@ivr-main extension 1000@internal-extensions

# Option 2 - Support
originate Local/2@ivr-main extension 1000@internal-extensions

# Option 3 - Billing
originate Local/3@ivr-main extension 1000@internal-extensions

# Option 4 - VIP Support
originate Local/4@ivr-main extension 1000@internal-extensions

# Option 5 - Account Management
originate Local/5@ivr-main extension 1000@internal-extensions

# Option 6 - Emergency Support
originate Local/6@ivr-main extension 1000@internal-extensions

# Option 0 - Operator
originate Local/0@ivr-main extension 1000@internal-extensions
```

### 6. Monitor Call Flow in Real-Time

```bash
# In Asterisk CLI, enable verbose logging
sudo asterisk -rvvv

# Watch for NoOp messages showing which option was selected
# You should see messages like:
# - "Sales selected"
# - "Support selected"
# - "VIP Support selected"
# - "Account Management selected"
# - "Emergency Support selected"
```

### 7. Test With Real SIP Call

If you have a SIP phone or softphone configured:

1. Call your DID number
2. When the IVR menu plays, press digits 1-6, 0, or 9
3. Verify you are routed to the correct queue

Monitor in Asterisk CLI:
```bash
sudo asterisk -rvvv
# Then watch the console output as the call progresses
```

## Troubleshooting

### Issue: "Extension not found"

If you see errors like `pbx.c: The extension '4' does not exist`, verify:

1. Configuration was reloaded:
   ```bash
   sudo asterisk -rx "dialplan reload"
   ```

2. Check for syntax errors:
   ```bash
   sudo asterisk -rx "dialplan show ivr-main"
   ```

### Issue: Calls not routing to queues

If calls don't route properly:

1. Verify queues exist:
   ```bash
   sudo asterisk -rx "queue show"
   ```

2. Check queue contexts:
   ```bash
   sudo asterisk -rx "dialplan show queue-vip"
   sudo asterisk -rx "dialplan show queue-account-management"
   sudo asterisk -rx "dialplan show queue-emergency"
   ```

### Issue: No audio prompts

If you don't hear the menu prompts:

1. Verify sound files exist:
   ```bash
   ls -la /var/lib/asterisk/sounds/en/
   ```

2. Check for files like: `press-1.wav`, `press-2.wav`, etc.

3. If missing, install Asterisk sound files:
   ```bash
   sudo apt-get install asterisk-core-sounds-en-wav
   ```

## Expected Behavior

When a caller reaches the IVR menu:

1. **Hears welcome message**: "Welcome to Gulf Premium Telecom"
2. **Hears menu options**: "Press 1 for Sales, Press 2 for Support..." etc.
3. **Presses a digit** (1-6, 0, or 9)
4. **Gets routed** to the appropriate queue or service
5. **Hears hold music** while waiting in queue
6. **Gets connected** to an available agent

## Validation Checklist

- [ ] All 7 queue contexts are defined (vip, account-management, emergency, plus existing)
- [ ] IVR menu announces options 1-6, 0, and 9
- [ ] Each option routes to the correct queue context
- [ ] Queues have proper timeout and error handling
- [ ] Configuration syntax validates without errors
- [ ] Documentation is updated with new options

## Summary

The IVR menu now provides comprehensive call routing with 9 distinct options, giving callers clear paths to reach the appropriate department or service. All new options (4, 5, 6) are fully integrated with proper queue handling and fallback mechanisms.
