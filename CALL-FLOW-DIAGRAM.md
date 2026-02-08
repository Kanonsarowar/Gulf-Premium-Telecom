# Call Flow Diagram - IVR Menu Options 1-6

## Complete Inbound Call Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Upstream SIP Provider                           │
│                   (Sends SIP INVITE to 5060)                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         [from-upstream]                             │
│                  • Validate caller & DID                            │
│                  • Log call details                                 │
│                  • Answer call                                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         [did-routing]                               │
│                  • Route based on DID number                        │
│                  • Send to IVR or direct queue                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          [ivr-main]                                 │
│                                                                     │
│         "Welcome to Gulf Premium Telecom"                          │
│         "Press 1 for Sales"                                        │
│         "Press 2 for Support"                                      │
│         "Press 3 for Billing"                                      │
│         "Press 4 for VIP Support"                                  │
│         "Press 5 for Account Management"                           │
│         "Press 6 for Emergency Support"                            │
│         "Press 0 for Operator"                                     │
│         "Press 9 for Directory"                                    │
│                                                                     │
└────┬────┬────┬────┬────┬────┬────┬────┬──────────────────────────┘
     │    │    │    │    │    │    │    │
     1    2    3    4    5    6    0    9
     │    │    │    │    │    │    │    │
     ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
   ┌─────────────────────────────────────────────────────────┐
   │  Sales  Support Billing  VIP   Acct  Emerg  Oper  Dir   │
   │  Queue   Queue   Queue  Queue  Mgmt  Queue Queue       │
   │                                Queue                     │
   └─────────────────────────────────────────────────────────┘
```

## Detailed Option Flows

### Option 1: Sales Department
```
Caller presses 1
    ↓
[queue-sales]
    ↓
Queue: sales (strategy: rrmemory)
    ↓
Available Agent? ─Yes→ Connect Call
    │
    No
    ↓
Wait in queue (max 300s)
    ↓
Timeout? ─Yes→ Voicemail (sales@default)
    │
    No → Continue waiting
```

### Option 2: Technical Support
```
Caller presses 2
    ↓
[queue-support]
    ↓
Queue: support (strategy: rrmemory)
    ↓
Available Agent? ─Yes→ Connect Call
    │
    No
    ↓
Wait in queue
    ↓
Timeout? ─Yes→ Voicemail (support@default)
```

### Option 3: Billing Department
```
Caller presses 3
    ↓
[queue-billing]
    ↓
Queue: billing (strategy: rrmemory)
    ↓
Available Agent? ─Yes→ Connect Call
    │
    No → Wait in queue → Timeout → Hangup
```

### Option 4: VIP Support ⭐ NEW
```
Caller presses 4
    ↓
[queue-vip]
    ↓
Queue: vip (strategy: ringall, high priority)
    ↓
Available Agent? ─Yes→ Connect Call
    │
    No
    ↓
Queue Full? ─Yes→ "Queue full" → Hangup
    │
    No
    ↓
Wait in queue
    ↓
Timeout? ─Yes→ Voicemail (vip@default)
```

### Option 5: Account Management ⭐ NEW
```
Caller presses 5
    ↓
[queue-account-management]
    ↓
Queue: support (shared with support team)
    ↓
Available Agent? ─Yes→ Connect Call
    │
    No
    ↓
Wait in queue
    ↓
Timeout? ─Yes→ Voicemail (support@default)
```

### Option 6: Emergency Support ⭐ NEW
```
Caller presses 6
    ↓
[queue-emergency]
    ↓
Queue: support (priority handling)
    ↓
Available Agent? ─Yes→ Connect Call
    │
    No
    ↓
Wait in queue
    ↓
Timeout? ─Yes→ Voicemail (support@default)
```

### Option 0: Operator
```
Caller presses 0
    ↓
[queue-operator]
    ↓
Queue: operator (strategy: rrmemory)
    ↓
Available Agent? ─Yes→ Connect Call
    │
    No → Wait in queue → Hangup
```

### Option 9: Directory
```
Caller presses 9
    ↓
Directory Application
    ↓
Search by name/extension
    ↓
Found? ─Yes→ Dial extension
    │
    No → Return to IVR
```

## Queue Configuration Summary

| Queue | Strategy | Priority | Timeout | Features |
|-------|----------|----------|---------|----------|
| sales | rrmemory | Normal | 300s | Voicemail on timeout |
| support | rrmemory | Normal | 300s | Voicemail on timeout |
| billing | rrmemory | Normal | 300s | Hangup on timeout |
| **vip** | **ringall** | **High** | **300s** | **VIP handling, Voicemail** |
| operator | rrmemory | Normal | 300s | Hangup on timeout |

**Note**: Account Management and Emergency Support use the support queue but with different contexts for tracking and potential future customization.

## Call Status Codes

During call routing, you'll see these NoOp log messages:

```
INBOUND CALL from 192.168.1.100
Sales selected           → Option 1 pressed
Support selected         → Option 2 pressed
Billing selected         → Option 3 pressed
VIP Support selected     → Option 4 pressed ⭐ NEW
Account Management selected → Option 5 pressed ⭐ NEW
Emergency Support selected  → Option 6 pressed ⭐ NEW
Operator requested       → Option 0 pressed
Directory access         → Option 9 pressed
```

## Error Handling

### Invalid Option
```
Caller presses invalid digit (e.g., 7, 8, *)
    ↓
Play: "Invalid option"
    ↓
Return to IVR menu start
    ↓
Retry count < 3? ─Yes→ Replay menu
    │
    No
    ↓
Play: "Goodbye" → Hangup
```

### Timeout (No Input)
```
No digit pressed within 10 seconds
    ↓
IVR_RETRIES counter increments
    ↓
Retries < 3? ─Yes→ Replay menu
    │
    No
    ↓
Play: "Goodbye" → Hangup
```

## Architecture Overview

```
                    ┌─────────────────┐
                    │  Asterisk IPRN  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌─────────┐         ┌─────────┐        ┌─────────┐
   │ Queue 1 │         │ Queue 2 │        │ Queue N │
   │ sales   │         │ support │        │  vip    │
   └────┬────┘         └────┬────┘        └────┬────┘
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐         ┌─────────┐        ┌─────────┐
   │ Agent   │         │ Agent   │        │ Agent   │
   │ 1001    │         │ 1101    │        │ VIP001  │
   └─────────┘         └─────────┘        └─────────┘
```

## Summary

The IVR menu now provides **9 distinct options** for comprehensive call routing:

✅ **Options 1-3**: Core departments (Sales, Support, Billing)  
✅ **Options 4-6**: Premium services (VIP, Account Mgmt, Emergency) ⭐ **NEW**  
✅ **Option 0**: Operator/Receptionist  
✅ **Option 9**: Directory access  

All options include:
- Professional call handling
- Queue management
- Timeout handling
- Voicemail fallback (where applicable)
- Comprehensive logging
- Error recovery
