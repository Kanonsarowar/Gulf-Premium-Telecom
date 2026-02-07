# Gulf Premium Telecom - Quick Start Guide

Get up and running with Gulf Premium Telecom in under 10 minutes!

## Prerequisites Check

Before starting, ensure you have:
- [ ] Linux/Mac OS (or WSL on Windows)
- [ ] Node.js v16 or higher
- [ ] MongoDB v4.4 or higher
- [ ] Asterisk v16 or higher (optional for development)
- [ ] 2GB+ RAM available

## 5-Minute Quick Start (Development)

### Step 1: Clone and Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom

# Run automated setup
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Check prerequisites
- ✅ Install all dependencies
- ✅ Create .env configuration file

### Step 2: Configure Environment (1 minute)

Edit `.env` file with your settings:

```bash
nano .env
```

**Minimum required configuration:**
```env
ASTERISK_HOST=localhost
ASTERISK_PORT=5038
ASTERISK_USERNAME=admin
ASTERISK_PASSWORD=amp111
MONGODB_URI=mongodb://localhost:27017/gulf_premium_telecom
```

### Step 3: Start Services (1 minute)

```bash
# Start MongoDB (if not already running)
sudo systemctl start mongod

# Start Asterisk (if not already running)
sudo systemctl start asterisk

# Start the application
npm run dev
```

### Step 4: Access Dashboard (1 minute)

Open your browser to:
```
http://localhost:3000
```

You should see:
- ✅ Gulf Premium Telecom dashboard
- ✅ Connection status indicator
- ✅ Empty dashboard (waiting for calls)

## Simulating Calls (Optional)

If you want to test the system without real calls:

### Option 1: Mock Data Script

Create a test script to simulate calls:

```javascript
// test-call.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected to WebSocket');
  
  // Simulate a new call
  const mockCall = {
    type: 'call_new',
    data: {
      callId: 'test-' + Date.now(),
      channelId: 'SIP/test-12345',
      callerNumber: '+1234567890',
      callerName: 'Test Caller',
      status: 'ringing',
      direction: 'inbound',
      startTime: new Date(),
      events: []
    }
  };
  
  // This won't work directly as the server broadcasts to clients
  // But you can use the REST API to create test data
  console.log('Mock call created:', mockCall);
});
```

### Option 2: Use Asterisk Test Call

```bash
# From Asterisk CLI
sudo asterisk -rvvv
> originate SIP/1000 application Playback demo-thanks
```

### Option 3: Configure a SIP Softphone

1. Download a SIP softphone (e.g., Zoiper, Linphone)
2. Configure with extension 1000/1001
3. Make test calls between extensions

## Verification Checklist

After setup, verify everything is working:

### Backend Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Gulf Premium Telecom Server is running",
  "asterisk": "connected"
}
```

### Frontend Access

```bash
curl http://localhost:3000
```

Should return HTML content (Next.js page)

### WebSocket Connection

Open browser console on http://localhost:3000 and look for:
```
WebSocket connected
WebSocket connection confirmed
```

### Database Connection

```bash
mongo gulf_premium_telecom --eval "db.calls.count()"
```

Should return a number (0 if no calls yet)

## Common Quick Start Issues

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start if not running
sudo systemctl start mongod

# Verify connection
mongo --eval "db.version()"
```

### Issue: "Cannot connect to Asterisk"

**Solutions:**

1. **Asterisk not installed?**
   - The app will run but won't receive calls
   - Install Asterisk: `sudo apt-get install asterisk`

2. **AMI not enabled?**
   ```bash
   # Check AMI configuration
   sudo cat /etc/asterisk/manager.conf
   
   # Should have [general] enabled=yes
   ```

3. **Wrong credentials?**
   - Verify ASTERISK_USERNAME and ASTERISK_PASSWORD in .env
   - Match with /etc/asterisk/manager.conf

### Issue: "Port already in use"

**Solution:**
```bash
# Find process using port 3001
sudo lsof -i :3001

# Kill process or change PORT in .env
```

### Issue: "npm run dev fails"

**Solutions:**

1. **Missing dependencies:**
   ```bash
   rm -rf node_modules client/node_modules
   npm install
   cd client && npm install
   ```

2. **Wrong Node version:**
   ```bash
   node --version  # Should be v16+
   # Install correct version if needed
   ```

## Next Steps

Now that you're up and running:

1. **Configure Asterisk** - See INSTALLATION.md for detailed Asterisk setup
2. **Customize IVR** - Edit `asterisk-config/extensions.conf`
3. **Add SIP Trunk** - Configure your SIP provider in `sip.conf`
4. **Make Test Calls** - Test the complete call flow
5. **Explore Dashboard** - Monitor calls in real-time
6. **Check Documentation** - Read API.md and ARCHITECTURE.md

## Quick Reference

### Start/Stop Commands

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start

# Using PM2 (recommended for production)
pm2 start server/index.js --name gulf-backend
cd client && pm2 start npm --name gulf-frontend -- start
```

### View Logs

```bash
# Backend logs (development)
# Check terminal where you ran npm run dev

# PM2 logs (production)
pm2 logs

# Asterisk logs
sudo tail -f /var/log/asterisk/full

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Quick Configuration

```bash
# Backend configuration
nano .env

# Asterisk configuration
sudo nano /etc/asterisk/manager.conf
sudo nano /etc/asterisk/sip.conf
sudo nano /etc/asterisk/extensions.conf

# Reload Asterisk after changes
sudo asterisk -rx "module reload"
```

## Development Tips

### Hot Reload

Both frontend and backend support hot reload in development mode:
- **Backend**: Uses nodemon to reload on file changes
- **Frontend**: Uses Next.js Fast Refresh

### Debug Mode

Enable detailed logging:

```javascript
// In server/index.js, add:
const DEBUG = true;

// Or set environment variable:
DEBUG=* npm run dev
```

### Browser DevTools

- **Console**: View WebSocket messages and errors
- **Network**: Monitor API requests
- **Application**: Check WebSocket connection

## Production Deployment

For production deployment, see DEPLOYMENT.md for:
- SSL/TLS configuration
- Nginx reverse proxy setup
- PM2 process management
- Security hardening
- Monitoring setup

## Get Help

- **Documentation**: Check README.md, INSTALLATION.md, API.md
- **Issues**: https://github.com/Kanonsarowar/Gulf-Premium-Telecom/issues
- **Email**: support@gulfpremiumtelecom.com

## Success Indicators

You know everything is working when:
- ✅ Backend health check returns "connected"
- ✅ Frontend loads without errors
- ✅ WebSocket shows "Connected" status
- ✅ Incoming calls appear in real-time
- ✅ Revenue updates automatically
- ✅ Call history saves to database

**Congratulations! You're now running Gulf Premium Telecom! 🎉**