# Automatic Asterisk Configuration Guide

## Overview

This system automatically configures Asterisk PBX when allocation numbers are added from the frontend. When you create an allocation number and link it to a destination, the system:

1. ✅ **Saves to database** - Allocation number stored in PostgreSQL
2. ✅ **Generates dialplan** - Creates Asterisk dialplan entry automatically
3. ✅ **Configures routing** - Sets up IP-to-IP routing based on destination type
4. ✅ **Reloads Asterisk** - Applies configuration without service restart

## How It Works

### Step 1: Create Inbound Destination

Navigate to **Destinations** page and create a destination:

```
Destination Number: +966112345678
Name: Sales Department
Routing Type: direct | queue | ivr | voicemail
Max Channels: 10
Status: active
```

### Step 2: Create Allocation Number

Navigate to **Allocations** page and create an allocation:

```
Allocated Number: +966501234567
Link to Destination: Sales Department (+966112345678)
Status: active
```

### Step 3: Automatic Configuration

The system automatically:

1. **Backend API** receives the allocation request
2. **Database** saves the allocation with link to destination
3. **Asterisk Manager** generates dialplan configuration:

```asterisk
; Auto-generated for DID: +966501234567
[from-trunk]
exten => 966501234567,1,NoOp(Incoming call to +966501234567)
 same => n,Set(CDR(did)=+966501234567)
 same => n,Dial(PJSIP/+966112345678,60,tT)
 same => n,Hangup()
```

4. **Configuration File** updated at `/etc/asterisk/extensions_custom.conf`
5. **Asterisk Reload** command executed: `asterisk -rx "dialplan reload"`
6. **Frontend Confirmation** shows success message

## Routing Types

### Direct Routing
Routes calls directly to a destination number via SIP:

```asterisk
exten => ${DID},1,NoOp(Incoming call to ${DID})
 same => n,Set(CDR(did)=${DID})
 same => n,Dial(PJSIP/${DESTINATION},60,tT)
 same => n,Hangup()
```

### Queue Routing
Places calls in a queue for agent distribution:

```asterisk
exten => ${DID},1,NoOp(Incoming call to ${DID})
 same => n,Set(CDR(did)=${DID})
 same => n,Answer()
 same => n,Queue(${QUEUE_NAME},tT,,,300)
 same => n,Hangup()
```

### IVR Routing
Plays IVR menu for caller selection:

```asterisk
exten => ${DID},1,NoOp(Incoming call to ${DID})
 same => n,Set(CDR(did)=${DID})
 same => n,Answer()
 same => n,Background(welcome)
 same => n,WaitExten(10)
 same => n,Hangup()
```

### Voicemail Routing
Sends calls directly to voicemail:

```asterisk
exten => ${DID},1,NoOp(Incoming call to ${DID})
 same => n,Set(CDR(did)=${DID})
 same => n,VoiceMail(${MAILBOX}@default,su)
 same => n,Hangup()
```

## IP-to-IP Routing

The system supports carrier-grade IP-to-IP routing:

### Configuration

1. **PJSIP Endpoint** configured in `pjsip.conf`:

```ini
[carrier-trunk-template](!)
type=endpoint
context=from-trunk
dtmf_mode=rfc4733
disallow=all
allow=ulaw,alaw,g729
direct_media=no
trust_id_inbound=yes
rtp_symmetric=yes

[carrier-1](carrier-trunk-template)
; Inherits from template

[carrier-1-identify](!)
type=identify
endpoint=carrier-1
match=203.0.113.1/32  ; Carrier IP address
```

2. **Dialplan Context** receives calls:

```asterisk
[from-trunk]
; Incoming calls from carrier
exten => _X.,1,NoOp(Incoming call to ${EXTEN})
 same => n,AGI(agi://127.0.0.1:4573)  ; AGI lookup
 same => n,Dial(PJSIP/${DESTINATION})
```

3. **AGI Server** performs database lookup:

```typescript
// Look up allocation in database
const allocation = await prisma.allocationNumber.findFirst({
  where: {
    allocatedNumber: didNumber,
    status: 'active',
  },
  include: { destination: true },
});

// Return routing info to Asterisk
return {
  destination: allocation.destination.destinationNumber,
  routingType: allocation.destination.routingType,
};
```

## API Endpoints

### System Status

Check Asterisk connectivity and system statistics:

```bash
GET /api/system/status

Response:
{
  "success": true,
  "data": {
    "asterisk": {
      "connected": true,
      "status": "online"
    },
    "database": {
      "connected": true,
      "status": "online"
    },
    "statistics": {
      "totalAllocations": 10,
      "activeAllocations": 8,
      "totalDestinations": 5
    }
  }
}
```

### Sync All to Asterisk

Manually sync all active allocations to Asterisk:

```bash
POST /api/system/sync-asterisk

Response:
{
  "success": true,
  "message": "Synced 8 allocations to Asterisk",
  "data": {
    "success": 8,
    "failed": 0,
    "errors": []
  }
}
```

## Call Flow Example

### Scenario: Incoming call to +966501234567

1. **Carrier** sends SIP INVITE to Asterisk:
   ```
   INVITE sip:+966501234567@your-asterisk.com SIP/2.0
   From: <sip:+1234567890@carrier.com>
   ```

2. **Asterisk** receives on `from-trunk` context:
   ```
   exten => 966501234567,1,NoOp(...)
   ```

3. **Dialplan** executes:
   - Sets CDR variables
   - Routes based on configuration (Direct/Queue/IVR/Voicemail)

4. **Call Connects** to destination

5. **CDR Logged** to PostgreSQL database

## Configuration Files

### Backend Environment

```env
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/gulf_telecom
PORT=3001
AGI_PORT=4573
ASTERISK_CONFIG_PATH=/etc/asterisk
NODE_ENV=production
```

### Asterisk Files Modified

- `/etc/asterisk/extensions_custom.conf` - Auto-generated dialplan entries
- `/etc/asterisk/pjsip_custom.conf` - Auto-generated PJSIP endpoints
- Configuration reloaded automatically via CLI commands

## Troubleshooting

### Asterisk Not Reloading

If Asterisk doesn't reload automatically:

```bash
# Check if Asterisk is running
asterisk -rx "core show version"

# Manually reload dialplan
asterisk -rx "dialplan reload"

# Check permissions
ls -l /etc/asterisk/extensions_custom.conf
```

### Configuration Not Applied

1. Check backend logs:
   ```bash
   cd backend
   npm run dev
   # Look for "✅ Asterisk configured for DID: ..." messages
   ```

2. Verify file was created:
   ```bash
   cat /etc/asterisk/extensions_custom.conf
   ```

3. Check Asterisk dialplan:
   ```bash
   asterisk -rx "dialplan show from-trunk"
   ```

### Development Without Asterisk

The system works without Asterisk installed:

- Allocations are saved to database
- API operations complete successfully
- Warning logged: "Could not reload Asterisk dialplan"
- No impact on database or frontend functionality

## Security Notes

- ✅ Asterisk configuration files created with secure permissions
- ✅ No passwords or secrets in dialplan files
- ✅ IP-based authentication for carrier trunks
- ✅ Input sanitization for DID numbers
- ✅ SQL injection prevention via Prisma ORM
- ✅ XSS protection in frontend forms

## Summary

The automatic Asterisk configuration feature provides:

1. **Zero-touch provisioning** - Create numbers from UI, Asterisk configures automatically
2. **IP-to-IP routing** - Carrier-grade call routing without registration
3. **Multiple routing types** - Direct, Queue, IVR, Voicemail supported
4. **Real-time updates** - Changes applied immediately
5. **Graceful degradation** - Works without Asterisk for testing
6. **Production ready** - Secure, scalable, maintainable

Your allocation numbers are now automatically configured in Asterisk for seamless IP-to-IP call routing! 🎉📞
