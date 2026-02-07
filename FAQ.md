# Frequently Asked Questions (FAQ)

## General Questions

### Q: What is Gulf Premium Telecom?

A: Gulf Premium Telecom is a complete telecommunications solution built on Asterisk PBX that provides:
- Inbound SIP call handling
- Interactive Voice Response (IVR) system
- Real-time call monitoring dashboard
- Automatic revenue tracking and analytics

### Q: What technologies does it use?

A: The system uses:
- **Asterisk** - Open source PBX for handling SIP calls
- **Node.js/Express** - Backend server and API
- **MongoDB** - Database for call records
- **Next.js/React** - Frontend dashboard
- **WebSocket** - Real-time updates

### Q: Is it free to use?

A: Yes, the software is open source (ISC License). However, you'll need:
- A server to run it on
- Asterisk PBX (free)
- A SIP trunk provider (usually has costs)

## Installation & Setup

### Q: What are the system requirements?

A: Minimum requirements:
- 2GB RAM (4GB recommended)
- 2 CPU cores
- 20GB storage
- Ubuntu 20.04/22.04 or similar Linux
- Node.js v16+
- MongoDB v4.4+
- Asterisk v16+

### Q: Can I run this on Windows?

A: Not directly. You have three options:
1. Use WSL2 (Windows Subsystem for Linux)
2. Use a virtual machine (VirtualBox, VMware)
3. Deploy to a Linux server

### Q: Do I need a SIP trunk provider?

A: Yes, to receive real inbound calls, you need:
- A SIP trunk provider (e.g., Twilio, Vonage, local provider)
- A phone number from the provider
- Provider credentials configured in Asterisk

For testing, you can use SIP softphones without a provider.

### Q: How long does installation take?

A: 
- Quick setup (development): 5-10 minutes
- Full production setup: 1-2 hours
- With Asterisk from source: 2-3 hours

### Q: Can I use an existing Asterisk installation?

A: Yes! Just:
1. Copy the configuration files to /etc/asterisk/
2. Adjust credentials in .env to match your Asterisk
3. Reload Asterisk configurations

## Configuration

### Q: How do I customize the IVR menu?

A: Edit `asterisk-config/extensions.conf`:

```
[ivr-main]
exten => 1,1,Set(IVR_OPTION=sales)
exten => 1,n,Dial(SIP/1000,30)

; Add new option
exten => 4,1,Set(IVR_OPTION=custom)
exten => 4,n,Playback(your-message)
exten => 4,n,Dial(SIP/1004,30)
```

Then: `sudo asterisk -rx "dialplan reload"`

### Q: How do I change the revenue rate?

A: Edit `.env`:
```
CALL_RATE_PER_MINUTE=0.15  # Change from 0.10 to 0.15
```

Restart backend: `pm2 restart gulf-backend`

### Q: Can I use a different database?

A: Currently, only MongoDB is supported. However, you can:
1. Fork the repository
2. Replace mongoose with your preferred ORM
3. Update the database connection logic

### Q: How do I add more extensions?

A: Edit `asterisk-config/sip.conf`:

```
[1002]
type=friend
context=internal
secret=password1002
host=dynamic
```

Then: `sudo asterisk -rx "sip reload"`

## Usage & Operations

### Q: How do I make a test call?

A: Three options:

1. **SIP Softphone**: Configure Zoiper/Linphone with extension 1000
2. **Asterisk CLI**: `originate SIP/1000 application Playback demo-thanks`
3. **Real trunk**: Call your DID number

### Q: Why don't I see any calls in the dashboard?

A: Check:
1. Is Asterisk connected? (Health check endpoint)
2. Is AMI configured correctly?
3. Are calls reaching Asterisk? (Check Asterisk CLI)
4. Is WebSocket connected? (Browser console)

### Q: How do I hangup a call remotely?

A: 
1. Go to "Active Calls" tab
2. Find the call
3. Click "Hangup" button

Or use API: `POST /api/calls/hangup/:channel`

### Q: Can I record calls?

A: Not by default. To add recording:
1. Add MixMonitor to dialplan
2. Create recording storage
3. Add playback functionality to dashboard

### Q: How far back is call history stored?

A: Indefinitely in MongoDB. To implement cleanup:

```javascript
// Delete calls older than 90 days
db.calls.deleteMany({
  startTime: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

## Technical Questions

### Q: How does the system connect to Asterisk?

A: Via Asterisk Manager Interface (AMI):
1. Backend connects to AMI port (5038)
2. Authenticates with username/password
3. Listens for events (Newchannel, Hangup, etc.)
4. Processes events and updates database/WebSocket

### Q: What happens if WebSocket disconnects?

A: The frontend automatically attempts to reconnect every 3 seconds. Call data is still saved to the database.

### Q: Is the system scalable?

A: Yes, with some modifications:
- Multiple backend instances with load balancer
- Redis for session management
- MongoDB replica set
- Separate Asterisk servers

See ARCHITECTURE.md for details.

### Q: What database indexes are created?

A: The system creates indexes on:
- `callId` (unique)
- `callerNumber`
- `startTime` (descending)
- `status` and `startTime` (compound)

### Q: How is revenue calculated?

A: Formula: `Revenue = (Duration in seconds / 60) × Rate per Minute`

Example: 150 seconds at $0.10/min = (150/60) × 0.10 = $0.25

### Q: Can I change the frontend port?

A: Yes, edit `client/package.json`:
```json
"scripts": {
  "dev": "next dev -p 3050"
}
```

## Troubleshooting

### Q: "Cannot connect to Asterisk" error

A: 
1. Check Asterisk is running: `sudo systemctl status asterisk`
2. Verify AMI is enabled in manager.conf
3. Test connection: `telnet localhost 5038`
4. Check credentials in .env match manager.conf
5. Check firewall: `sudo ufw status`

### Q: "MongoDB connection failed"

A:
1. Check MongoDB is running: `sudo systemctl status mongod`
2. Verify connection string in .env
3. Test: `mongo --eval "db.version()"`
4. Check logs: `sudo tail -f /var/log/mongodb/mongod.log`

### Q: Frontend shows "Disconnected"

A:
1. Check backend is running
2. Verify WebSocket URL in client configuration
3. Check browser console for errors
4. Test backend: `curl http://localhost:3001/health`

### Q: Calls aren't being saved to database

A:
1. Check MongoDB connection
2. Verify Asterisk is sending Hangup events
3. Check backend logs for errors
4. Test: `mongo gulf_premium_telecom --eval "db.calls.count()"`

### Q: IVR audio not playing

A:
1. Check audio files exist in /var/lib/asterisk/sounds/
2. Verify correct file format (WAV, GSM, or ulaw)
3. Check file permissions
4. Test: `asterisk -rx "core show sounds"`

## Performance & Limits

### Q: How many concurrent calls can it handle?

A: Depends on your server resources:
- Small server (2 CPU, 2GB RAM): ~20-30 calls
- Medium server (4 CPU, 8GB RAM): ~100-150 calls
- Large server (8 CPU, 16GB RAM): ~300-500 calls

Asterisk is typically the bottleneck, not the dashboard.

### Q: Does it slow down with lots of call history?

A: No, thanks to:
- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient MongoDB queries

### Q: How much storage do call records use?

A: Approximately:
- ~2KB per call record
- 1 million calls ≈ 2GB
- With audio recordings: add ~1MB per minute of audio

## Security

### Q: Is it secure for production use?

A: With proper configuration, yes. Required steps:
1. Change all default passwords
2. Enable MongoDB authentication
3. Use HTTPS/WSS
4. Implement API authentication
5. Configure firewall rules
6. Keep software updated

See DEPLOYMENT.md for details.

### Q: Should I expose AMI to the internet?

A: **NO!** Always restrict AMI to localhost or trusted IPs:
```
permit=127.0.0.1/255.255.255.255
deny=0.0.0.0/0.0.0.0
```

### Q: How do I add authentication to the API?

A: Implement JWT authentication:
1. Add passport.js or similar
2. Create login endpoint
3. Protect routes with middleware
4. Add token to frontend requests

## Customization

### Q: Can I change the UI design?

A: Yes! The frontend uses:
- Tailwind CSS for styling
- React components
- Modify `client/components/*.js` and `client/app/globals.css`

### Q: Can I add more analytics?

A: Yes! Add new aggregation queries in:
- `server/models/Call.js` (static methods)
- `server/routes/revenueRoutes.js` (new endpoints)
- `client/components/RevenueStats.js` (display)

### Q: Can I integrate with other systems?

A: Yes, via:
- REST API (documented in API.md)
- WebSocket events
- Direct MongoDB access
- Asterisk AMI events

### Q: Can I white-label this?

A: Yes! Change:
- Company name in UI components
- Logo in `client/public/`
- Branding colors in `client/tailwind.config.js`
- Footer text in `client/app/page.js`

## Billing & Revenue

### Q: Can it generate invoices?

A: Not currently. You can:
1. Export call data via API
2. Process with accounting software
3. Or add invoice generation feature

### Q: Does it support multiple currencies?

A: Not by default. To add:
1. Add currency field to Call model
2. Update revenue calculation
3. Modify UI to display currency

### Q: Can I set different rates for different numbers?

A: Yes, modify revenue calculation in `asteriskService.js`:

```javascript
const rates = {
  'international': 0.20,
  'domestic': 0.10,
  'tollfree': 0.05
};

const type = determineCallType(callerNumber);
const rate = rates[type];
callData.revenue = (duration / 60) * rate;
```

## Support & Community

### Q: Where can I get help?

A: 
- GitHub Issues: Report bugs and request features
- Documentation: README, INSTALLATION, API docs
- Email: support@gulfpremiumtelecom.com

### Q: Can I contribute?

A: Yes! Contributions welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Q: Is there commercial support available?

A: For enterprise support, custom development, or consulting:
- Email: enterprise@gulfpremiumtelecom.com

### Q: What's the license?

A: ISC License - free for commercial and personal use.

## Future Features

### Q: Is there a mobile app?

A: Not yet, but planned. The web dashboard is mobile-responsive.

### Q: Will you add outbound calling?

A: Planned for future release. You can implement it by:
1. Adding originate AMI commands
2. Creating outbound dialplan
3. Adding UI for dialer

### Q: Can it integrate with CRM systems?

A: Not built-in, but you can integrate via:
- REST API
- WebSocket events
- Direct database access
- Custom middleware

### Q: Will you add SMS support?

A: Planned. Asterisk supports SMS, integration would need:
1. SMS-capable trunk
2. Message handling in dialplan
3. SMS UI components
4. Database schema for messages