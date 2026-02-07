# VPS Setup Guide - Gulf Premium Telecom

Complete step-by-step guide to deploy Gulf Premium Telecom on your VPS (167.172.170.88).

## Quick Setup (Copy & Paste)

### Option 1: Asterisk Already Installed (Recommended - Fast!)

If Asterisk is already installed on your VPS, use the quick installer:

```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/main/vps-install-quick.sh | sudo bash
```

**Time:** 5-10 minutes  
**Installs:** Node.js, MongoDB, Application, Nginx, Services

### Option 2: Fresh VPS (Complete Installation)

If you need to install everything including Asterisk:

```bash
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/Gulf-Premium-Telecom/main/vps-install.sh | sudo bash
```

**Time:** 20-30 minutes  
**Installs:** Node.js, MongoDB, Asterisk (compiled), Application, Nginx, Services

### Option 3: Manual Installation

Follow the detailed manual steps below if you prefer step-by-step control.

---

## Prerequisites

- Ubuntu 20.04 or 22.04 LTS (recommended)
- Root or sudo access
- At least 2GB RAM
- 20GB disk space
- Your VPS IP: **167.172.170.88**

---

## Step-by-Step VPS Setup

### Step 1: Connect to Your VPS

```bash
# From your local machine
ssh root@167.172.170.88

# Or if using a specific user
ssh your-username@167.172.170.88
```

### Step 2: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Prerequisites

#### 3.1 Install Node.js 18.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

#### 3.2 Install MongoDB

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### 3.3 Install Asterisk

```bash
# Install Asterisk dependencies
sudo apt install -y build-essential wget libssl-dev libncurses5-dev libnewt-dev libxml2-dev linux-headers-$(uname -r) libsqlite3-dev uuid-dev libjansson-dev

# Download Asterisk (using 18.x LTS)
cd /usr/src
sudo wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-18-current.tar.gz

# Extract
sudo tar -xvf asterisk-18-current.tar.gz
cd asterisk-18.*

# Install MP3 support
sudo contrib/scripts/get_mp3_source.sh

# Configure with minimal modules
sudo ./configure --with-jansson-bundled

# Build and install (this takes 10-20 minutes)
sudo make menuselect.makeopts
sudo menuselect/menuselect --enable app_macro menuselect.makeopts
sudo make -j$(nproc)
sudo make install
sudo make samples
sudo make config

# Install init scripts
sudo make install-logrotate

# Start Asterisk
sudo systemctl start asterisk
sudo systemctl enable asterisk

# Verify Asterisk is running
sudo asterisk -rvvv
# Type 'core show version' then 'exit'
```

#### 3.4 Install Git

```bash
sudo apt install -y git
```

### Step 4: Clone the Repository

```bash
# Create application directory
sudo mkdir -p /opt/gulf-telecom
sudo chown $USER:$USER /opt/gulf-telecom

# Clone repository
cd /opt/gulf-telecom
git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git .

# Make scripts executable
chmod +x start-all.sh setup-trunks.sh setup.sh
```

### Step 5: Configure Asterisk

```bash
# Deploy Asterisk configuration
sudo ./setup-trunks.sh

# This will:
# - Backup existing configs
# - Copy new configs (sip.conf, extensions.conf, manager.conf)
# - Configure firewall for 8 supplier IPs
# - Reload Asterisk

# Verify trunks are configured
sudo asterisk -rx "sip show peers" | grep supplier
# Should show 8 trunks
```

### Step 6: Configure Environment

```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Edit these values in .env:**

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/gulf-telecom

# Asterisk AMI Configuration
AMI_HOST=localhost
AMI_PORT=5038
AMI_USERNAME=admin
AMI_SECRET=your_strong_password_here

# Server Configuration
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Your Server IP
SERVER_IP=167.172.170.88

# Revenue Settings
REVENUE_PER_MINUTE=0.10
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 7: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 8: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend

# Allow Asterisk SIP (already done by setup-trunks.sh)
# These are the 8 supplier IPs on port 5060

# Allow RTP media ports
sudo ufw allow 10000:20000/udp

# Check firewall status
sudo ufw status
```

### Step 9: Build Frontend for Production

```bash
cd /opt/gulf-telecom/client
npm run build
cd ..
```

### Step 10: Set Up Systemd Services

#### 10.1 Create Backend Service

```bash
sudo nano /etc/systemd/system/gulf-telecom-backend.service
```

**Paste this content:**

```ini
[Unit]
Description=Gulf Premium Telecom Backend
After=network.target mongod.service asterisk.service
Requires=mongod.service asterisk.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/gulf-telecom
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gulf-backend

[Install]
WantedBy=multi-user.target
```

#### 10.2 Create Frontend Service

```bash
sudo nano /etc/systemd/system/gulf-telecom-frontend.service
```

**Paste this content:**

```ini
[Unit]
Description=Gulf Premium Telecom Frontend
After=network.target gulf-telecom-backend.service
Requires=gulf-telecom-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/gulf-telecom/client
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=http://167.172.170.88:3001
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gulf-frontend

[Install]
WantedBy=multi-user.target
```

#### 10.3 Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable gulf-telecom-backend
sudo systemctl enable gulf-telecom-frontend

# Start services
sudo systemctl start gulf-telecom-backend
sudo systemctl start gulf-telecom-frontend

# Check status
sudo systemctl status gulf-telecom-backend
sudo systemctl status gulf-telecom-frontend
```

### Step 11: Set Up Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/gulf-telecom
```

**Paste this content:**

```nginx
server {
    listen 80;
    server_name 167.172.170.88;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable and start Nginx:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gulf-telecom /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 12: Verify Everything is Working

```bash
# Check all services
sudo systemctl status mongod
sudo systemctl status asterisk
sudo systemctl status gulf-telecom-backend
sudo systemctl status gulf-telecom-frontend
sudo systemctl status nginx

# Check Asterisk trunks
sudo asterisk -rx "sip show peers"

# Check application logs
sudo journalctl -u gulf-telecom-backend -f
sudo journalctl -u gulf-telecom-frontend -f

# Test API
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:3000
```

### Step 13: Access Your Dashboard

Open your browser and go to:

```
http://167.172.170.88
```

You should see the Gulf Premium Telecom dashboard!

---

## Quick Commands Reference

### Service Management

```bash
# Restart all services
sudo systemctl restart gulf-telecom-backend gulf-telecom-frontend

# Stop all services
sudo systemctl stop gulf-telecom-backend gulf-telecom-frontend

# Check logs
sudo journalctl -u gulf-telecom-backend -f
sudo journalctl -u gulf-telecom-frontend -f

# Restart Asterisk
sudo systemctl restart asterisk
```

### Asterisk Commands

```bash
# Connect to Asterisk console
sudo asterisk -rvvv

# Show SIP peers (trunks)
sudo asterisk -rx "sip show peers"

# Show active calls
sudo asterisk -rx "core show channels"

# Reload SIP configuration
sudo asterisk -rx "sip reload"

# Reload dialplan
sudo asterisk -rx "dialplan reload"
```

### Update Application

```bash
cd /opt/gulf-telecom
git pull
npm install
cd client && npm install && npm run build && cd ..
sudo systemctl restart gulf-telecom-backend gulf-telecom-frontend
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check detailed logs
sudo journalctl -xe -u gulf-telecom-backend
sudo journalctl -xe -u gulf-telecom-frontend

# Check if ports are in use
sudo netstat -tlnp | grep -E '3000|3001|5038'

# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"
```

### Can't Access Dashboard

```bash
# Check if services are running
sudo systemctl status gulf-telecom-frontend
sudo systemctl status gulf-telecom-backend

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check firewall
sudo ufw status
```

### Asterisk Issues

```bash
# Check Asterisk is running
sudo systemctl status asterisk

# Connect and check for errors
sudo asterisk -rvvv
core show channels
sip show peers

# Check AMI is accessible
telnet localhost 5038
```

### No Calls Coming In

1. **Verify trunks are configured:**
   ```bash
   sudo asterisk -rx "sip show peers" | grep supplier
   ```

2. **Check firewall allows supplier IPs:**
   ```bash
   sudo ufw status | grep 5060
   ```

3. **Contact suppliers and provide them your IP:** 167.172.170.88

4. **Monitor for incoming calls:**
   ```bash
   sudo asterisk -rvvv
   sip set debug on
   ```

---

## Security Recommendations

### 1. Change Default Passwords

```bash
# Change AMI password in /etc/asterisk/manager.conf
sudo nano /etc/asterisk/manager.conf
# Change the secret= line

# Restart Asterisk
sudo systemctl restart asterisk

# Update .env file with new password
nano /opt/gulf-telecom/.env
# Update AMI_SECRET

# Restart backend
sudo systemctl restart gulf-telecom-backend
```

### 2. Set Up SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### 3. Enable Fail2Ban

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure for Asterisk
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
# Enable [asterisk] section

# Restart fail2ban
sudo systemctl restart fail2ban
```

---

## Production Checklist

- [ ] System updated (`apt update && apt upgrade`)
- [ ] Node.js 18.x installed
- [ ] MongoDB 6.0 installed and running
- [ ] Asterisk 18.x installed and running
- [ ] Repository cloned to `/opt/gulf-telecom`
- [ ] Asterisk configuration deployed (`setup-trunks.sh`)
- [ ] 8 SIP trunks visible in `sip show peers`
- [ ] `.env` file configured with correct values
- [ ] Dependencies installed (backend and frontend)
- [ ] Frontend built for production (`npm run build`)
- [ ] Systemd services created and enabled
- [ ] Services running (backend, frontend, mongod, asterisk)
- [ ] Firewall configured (UFW)
- [ ] All supplier IPs whitelisted on port 5060
- [ ] RTP ports 10000-20000 opened
- [ ] Nginx reverse proxy configured (optional)
- [ ] Dashboard accessible at `http://167.172.170.88`
- [ ] API responding at `http://167.172.170.88:3001/api/health`
- [ ] Suppliers notified of your IP (167.172.170.88)
- [ ] Test calls requested from suppliers
- [ ] Monitoring set up (logs, alerts)
- [ ] Backups configured

---

## Next Steps

1. **Contact your 8 suppliers** and provide them your IP: **167.172.170.88**
2. **Request test calls** to verify connectivity
3. **Monitor calls** in the dashboard at http://167.172.170.88
4. **Set up regular backups** of MongoDB
5. **Configure SSL** for production use
6. **Set up monitoring and alerts**

---

## Support

- **Documentation:** See all `.md` files in the repository
- **Troubleshooting:** SETUP_CHECKLIST.md
- **API Reference:** API.md
- **Architecture:** ARCHITECTURE.md

---

**Your VPS is now ready to receive calls and generate revenue!** 🚀
