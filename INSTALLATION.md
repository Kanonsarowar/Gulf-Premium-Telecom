# Gulf Premium Telecom - Installation Guide

## Quick Start Guide

This guide will help you set up the Gulf Premium Telecom system from scratch.

## System Requirements

- Ubuntu 20.04/22.04 or CentOS 7/8 (or similar Linux distribution)
- 2GB RAM minimum (4GB recommended)
- 20GB disk space
- Root or sudo access

## Step 1: Install Node.js

```bash
# Using NodeSource repository for latest LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Install MongoDB

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database and install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

## Step 3: Install Asterisk

### Option A: Install from Package Manager (Easier)

```bash
sudo apt-get update
sudo apt-get install -y asterisk
```

### Option B: Install from Source (More Control)

```bash
# Install dependencies
sudo apt-get install -y build-essential wget libssl-dev libncurses5-dev libnewt-dev libxml2-dev linux-headers-$(uname -r) libsqlite3-dev uuid-dev

# Download Asterisk
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
sudo tar -xvzf asterisk-20-current.tar.gz
cd asterisk-20*/

# Configure and compile
sudo ./configure
sudo make menuselect  # Optional: select modules
sudo make
sudo make install
sudo make samples
sudo make config

# Start Asterisk
sudo systemctl start asterisk
sudo systemctl enable asterisk

# Verify Asterisk is running
sudo asterisk -rvvv
```

## Step 4: Clone and Setup Application

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom

# Install backend dependencies
sudo npm install

# Install frontend dependencies
cd client
sudo npm install
cd ..

# Set proper permissions
sudo chown -R $USER:$USER /opt/Gulf-Premium-Telecom
```

## Step 5: Configure Application

```bash
# Copy environment file
cp .env.example .env

# Edit configuration
nano .env
```

Update the following in `.env`:
```env
# Asterisk AMI credentials
ASTERISK_HOST=localhost
ASTERISK_PORT=5038
ASTERISK_USERNAME=admin
ASTERISK_PASSWORD=your_secure_password

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/gulf_premium_telecom

# Revenue settings
CALL_RATE_PER_MINUTE=0.10
```

## Step 6: Configure Asterisk

```bash
# Backup original configuration files
sudo cp /etc/asterisk/manager.conf /etc/asterisk/manager.conf.backup
sudo cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup
sudo cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup

# Copy new configuration files
sudo cp asterisk-config/manager.conf /etc/asterisk/
sudo cp asterisk-config/sip.conf /etc/asterisk/
sudo cp asterisk-config/extensions.conf /etc/asterisk/

# Edit manager.conf to set secure password
sudo nano /etc/asterisk/manager.conf
# Change the 'secret' value to match ASTERISK_PASSWORD in .env

# Reload Asterisk
sudo asterisk -rx "module reload"
```

## Step 7: Create IVR Audio Files

You need to create or download audio files for your IVR prompts:

```bash
# Create sounds directory if it doesn't exist
sudo mkdir -p /var/lib/asterisk/sounds/custom

# Example: Record or copy your audio files
# Files needed:
# - welcome.wav (or .gsm, .ulaw)
# - ivr-menu.wav
# - connecting-to-sales.wav
# - connecting-to-support.wav
# - billing-info.wav
# - transferring-to-operator.wav
# - invalid.wav (already exists in Asterisk)
# - goodbye.wav (already exists in Asterisk)

# Set proper permissions
sudo chown -R asterisk:asterisk /var/lib/asterisk/sounds/
```

## Step 8: Configure Firewall

```bash
# Allow required ports
sudo ufw allow 3000/tcp    # Frontend
sudo ufw allow 3001/tcp    # Backend/WebSocket
sudo ufw allow 5038/tcp    # Asterisk AMI (restrict to localhost in production)
sudo ufw allow 5060/udp    # SIP
sudo ufw allow 10000:20000/udp  # RTP (media)

# Enable firewall
sudo ufw enable
```

## Step 9: Start the Application

### Development Mode

```bash
cd /opt/Gulf-Premium-Telecom
npm run dev
```

### Production Mode with PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend
pm2 start server/index.js --name "gulf-telecom-backend"

# Build and start frontend
cd client
npm run build
pm2 start npm --name "gulf-telecom-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 10: Verify Installation

1. **Check Backend Health**:
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok","message":"Gulf Premium Telecom Server is running","asterisk":"connected"}`

2. **Access Frontend**:
   Open browser to `http://localhost:3000`

3. **Test Asterisk Connection**:
   ```bash
   sudo asterisk -rx "manager show connected"
   ```
   Should show your application connected

4. **Test with a Call**:
   Make a test call to your Asterisk server and verify it appears in the dashboard

## Troubleshooting

### Issue: "Cannot connect to Asterisk"

**Solution**:
```bash
# Check if Asterisk is running
sudo systemctl status asterisk

# Check AMI configuration
sudo asterisk -rx "manager show settings"

# Verify credentials
grep -A 5 "\[admin\]" /etc/asterisk/manager.conf
```

### Issue: "MongoDB connection failed"

**Solution**:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --eval "db.adminCommand('ping')"
```

### Issue: "Frontend cannot connect to backend"

**Solution**:
```bash
# Check if backend is running
netstat -tulpn | grep 3001

# Check backend logs
pm2 logs gulf-telecom-backend

# Verify environment variables
cat .env | grep API_URL
```

### Issue: "No audio in IVR"

**Solution**:
```bash
# Check if sound files exist
ls -la /var/lib/asterisk/sounds/

# Convert audio files if needed
sox input.mp3 -r 8000 -c 1 output.wav

# Restart Asterisk
sudo systemctl restart asterisk
```

## Production Deployment Checklist

- [ ] Change all default passwords
- [ ] Configure SSL/TLS for web interface
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure firewall rules properly
- [ ] Set up automated backups
- [ ] Enable MongoDB authentication
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts
- [ ] Test failover scenarios
- [ ] Document custom configurations

## Security Hardening

1. **Restrict AMI Access**:
   Edit `/etc/asterisk/manager.conf`:
   ```
   permit=127.0.0.1/255.255.255.255
   deny=0.0.0.0/0.0.0.0
   ```

2. **Enable MongoDB Authentication**:
   ```bash
   mongo admin
   db.createUser({user:"admin", pwd:"securepassword", roles:[{role:"root", db:"admin"}]})
   ```

3. **Use Environment-Specific Configurations**:
   Never commit `.env` file with production credentials

4. **Set Up HTTPS**:
   Use Let's Encrypt for free SSL certificates:
   ```bash
   sudo apt-get install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```

## Maintenance

### Daily Tasks
- Monitor call volumes and system performance
- Check error logs
- Verify backup completion

### Weekly Tasks
- Review security logs
- Update system packages
- Test disaster recovery procedures

### Monthly Tasks
- Update Node.js packages
- Review and optimize database indexes
- Audit user access and permissions

## Support

For additional help:
- Documentation: See README.md
- Issues: GitHub Issues
- Email: support@gulfpremiumtelecom.com

## Next Steps

After installation:
1. Configure your SIP trunk provider
2. Customize IVR menu options
3. Set up user extensions
4. Configure call routing rules
5. Test the complete call flow
6. Train staff on using the dashboard
7. Set up monitoring and alerts