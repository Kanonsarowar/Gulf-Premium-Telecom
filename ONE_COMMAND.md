# 🚀 One Command Setup - Gulf Premium Telecom

## Quick Start - Everything in 1 Command!

Since you already have Asterisk installed and configured, you can start everything with just:

```bash
./start-all.sh
```

That's it! This single command will:
1. ✅ Check all prerequisites
2. ✅ Install backend dependencies (if needed)
3. ✅ Install frontend dependencies (if needed)
4. ✅ Setup environment configuration
5. ✅ Verify Asterisk is running
6. ✅ Check SIP trunks
7. ✅ Start backend server (Port 3001)
8. ✅ Start frontend dashboard (Port 3000)
9. ✅ Start WebSocket server

---

## Prerequisites

Before running `./start-all.sh`, make sure you have:

- ✅ **Asterisk** - Already installed and configured ✓
- ✅ **Node.js 16+** - `node -v`
- ✅ **npm** - `npm -v`
- ✅ **MongoDB** - Running locally or have remote connection

---

## First Time Setup (Automatic)

### Option 1: Fully Automated (Recommended)

```bash
# Just run this one command!
./start-all.sh
```

The script will:
- Install all dependencies automatically
- Create `.env` file from template
- Ask you to configure MongoDB URI
- Verify Asterisk is running
- Start all services

### Option 2: Manual Environment Setup First

If you prefer to configure `.env` before running:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit with your settings
nano .env

# 3. Start everything
./start-all.sh
```

---

## Environment Configuration

Edit `.env` file with your settings:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/gulf-telecom

# Asterisk AMI
AMI_HOST=127.0.0.1
AMI_PORT=5038
AMI_USERNAME=admin
AMI_SECRET=your_secret_password

# Server Configuration
PORT=3001
NODE_ENV=development

# Revenue Rate (per minute)
RATE_PER_MINUTE=0.10
```

---

## What Gets Started

When you run `./start-all.sh`:

### Backend Server (Port 3001)
- Express.js API server
- Asterisk AMI connection
- MongoDB connection
- WebSocket server
- Real-time call processing

### Frontend Dashboard (Port 3000)
- Next.js application
- Real-time dashboard
- Call monitoring
- Revenue analytics
- Call history

### Access Points

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health
- **WebSocket**: ws://localhost:3001

---

## Stopping Services

To stop all services:

```bash
# Press Ctrl+C in the terminal where start-all.sh is running
```

---

## Verification

After starting, verify everything is working:

### 1. Check Services Are Running

```bash
# Check if ports are listening
netstat -tuln | grep -E '3000|3001'

# Should show:
# tcp   0   0  0.0.0.0:3000   LISTEN  (Frontend)
# tcp   0   0  0.0.0.0:3001   LISTEN  (Backend)
```

### 2. Check Backend Health

```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok"}
```

### 3. Check Frontend

Open browser: http://localhost:3000

You should see the Gulf Premium Telecom dashboard.

### 4. Check Asterisk Connection

```bash
# View backend logs - should show:
# "Connected to Asterisk AMI"
# "MongoDB connected successfully"
```

### 5. Check SIP Trunks

```bash
asterisk -rx "sip show peers" | grep supplier

# Should show 8 trunks:
# supplier1-trunk1 through supplier1-trunk4
# supplier2-aws1 through supplier2-aws3
# supplier3-quintum
```

---

## Troubleshooting

### Script won't run

```bash
# Make sure it's executable
chmod +x start-all.sh

# Run it
./start-all.sh
```

### Dependencies won't install

```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules
rm -rf client/node_modules
./start-all.sh
```

### MongoDB connection error

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Or update .env with remote MongoDB URI
nano .env
```

### Asterisk connection error

```bash
# Check if Asterisk is running
sudo asterisk -rx "core show version"

# Check AMI is enabled
sudo asterisk -rx "manager show users"

# Verify AMI credentials in .env match manager.conf
```

### Port already in use

```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :3001

# Kill the process or change ports in .env
```

### Frontend not loading

```bash
# Check if frontend is running
curl http://localhost:3000

# Check frontend logs in the terminal
# Or rebuild frontend
cd client
npm run build
cd ..
./start-all.sh
```

---

## Production Deployment

For production, use PM2 instead:

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start server/index.js --name gulf-backend

# Start frontend (after building)
cd client
npm run build
pm2 start npm --name gulf-frontend -- start

# Save PM2 configuration
pm2 save

# Auto-start on system boot
pm2 startup
```

---

## NPM Scripts Available

After dependencies are installed, you can also use:

```bash
# Start in development mode (same as start-all.sh)
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build frontend for production
npm run build

# Start backend in production mode
npm start
```

---

## File Structure

```
Gulf-Premium-Telecom/
├── start-all.sh           ← ONE COMMAND TO START EVERYTHING!
├── .env                   ← Your configuration (auto-created)
├── .env.example          ← Template
├── package.json          ← Backend dependencies
├── server/               ← Backend code
├── client/               ← Frontend code
│   └── package.json      ← Frontend dependencies
└── asterisk-config/      ← Asterisk configurations
```

---

## Quick Reference Card

| Command | Description |
|---------|-------------|
| `./start-all.sh` | **Start everything** (one command!) |
| `Ctrl+C` | Stop all services |
| `npm run dev` | Start in dev mode |
| `npm run server` | Backend only |
| `npm run client` | Frontend only |
| `asterisk -rvvv` | Connect to Asterisk console |
| `asterisk -rx "sip show peers"` | Show SIP trunks |

---

## Success! 🎉

If you see this in the terminal:

```
✓ Backend Server started on port 3001
✓ Frontend Dashboard started on port 3000
✓ WebSocket Server running
✓ Connected to Asterisk AMI
✓ MongoDB connected successfully
```

And you can access http://localhost:3000 - **You're ready to receive calls!**

---

## Next Steps

1. ✅ **Start services**: `./start-all.sh` ← You're here!
2. **Contact suppliers**: Give them your IP (167.172.170.88)
3. **Request test calls**: Have each supplier send test calls
4. **Monitor dashboard**: Watch calls appear in real-time
5. **Review data**: Check call history and revenue stats

---

## Support

- **Installation Issues**: See INSTALLATION.md
- **Configuration**: See SETUP_CHECKLIST.md
- **Trunk Setup**: See TRUNK_CONFIG.md
- **Common Questions**: See FAQ.md
- **Quick Commands**: See QUICK_REF.md

---

**Everything in one command: `./start-all.sh`** 🚀
