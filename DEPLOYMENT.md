# Production Deployment Guide

This guide covers deploying Gulf Premium Telecom to a production environment.

## Prerequisites

- Linux server (Ubuntu 20.04/22.04 recommended)
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- At least 4GB RAM, 2 CPU cores, 40GB storage

## Deployment Options

### Option 1: Traditional Server Deployment

#### Step 1: Prepare Server

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y nginx certbot python3-certbot-nginx git build-essential
```

#### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 3: Install MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 4: Install Asterisk

```bash
# Install dependencies
sudo apt-get install -y build-essential wget libssl-dev libncurses5-dev libnewt-dev libxml2-dev linux-headers-$(uname -r) libsqlite3-dev uuid-dev

# Download and install
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
sudo tar -xvzf asterisk-20-current.tar.gz
cd asterisk-20*/
sudo ./configure
sudo make
sudo make install
sudo make config
sudo systemctl start asterisk
sudo systemctl enable asterisk
```

#### Step 5: Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/gulf-premium-telecom
sudo chown $USER:$USER /var/www/gulf-premium-telecom

# Clone repository
cd /var/www/gulf-premium-telecom
git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git .

# Install dependencies
npm install
cd client && npm install && cd ..

# Configure environment
cp .env.example .env
nano .env  # Edit configuration
```

#### Step 6: Configure Asterisk

```bash
# Backup original configs
sudo cp /etc/asterisk/manager.conf /etc/asterisk/manager.conf.backup
sudo cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup
sudo cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup

# Copy new configs
sudo cp asterisk-config/manager.conf /etc/asterisk/
sudo cp asterisk-config/sip.conf /etc/asterisk/
sudo cp asterisk-config/extensions.conf /etc/asterisk/

# Update manager.conf with production password
sudo nano /etc/asterisk/manager.conf

# Reload Asterisk
sudo asterisk -rx "module reload"
```

#### Step 7: Build Frontend

```bash
cd /var/www/gulf-premium-telecom/client
npm run build
```

#### Step 8: Set Up PM2

```bash
# Install PM2
sudo npm install -g pm2

# Start backend
cd /var/www/gulf-premium-telecom
pm2 start server/index.js --name gulf-telecom-backend

# Start frontend
cd client
pm2 start npm --name gulf-telecom-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Step 9: Configure Nginx

Create `/etc/nginx/sites-available/gulf-telecom`:

```nginx
# Upstream definitions
upstream backend {
    server 127.0.0.1:3001;
}

upstream frontend {
    server 127.0.0.1:3000;
}

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
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
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/gulf-telecom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 10: Configure SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Step 11: Configure Firewall

```bash
# Allow required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5060/udp
sudo ufw allow 10000:20000/udp

# Enable firewall
sudo ufw enable
```

#### Step 12: Set Up MongoDB Authentication

```bash
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: [ { role: "root", db: "admin" } ]
})
exit

# Enable authentication
sudo nano /etc/mongod.conf
# Add:
# security:
#   authorization: enabled

sudo systemctl restart mongod

# Update .env with authenticated connection string
# MONGODB_URI=mongodb://admin:secure_password@localhost:27017/gulf_premium_telecom?authSource=admin
```

### Option 2: Docker Deployment

#### Create Dockerfile

`Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Backend build
FROM base AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server ./server
COPY .env.example ./.env

# Frontend build
FROM base AS frontend-build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

# Final image
FROM base AS final
WORKDIR /app

# Copy backend
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/server ./server
COPY --from=backend /app/.env ./.env
COPY package*.json ./

# Copy frontend build
COPY --from=frontend-build /app/.next ./client/.next
COPY --from=frontend-build /app/public ./client/public
COPY --from=frontend-build /app/package*.json ./client/

EXPOSE 3001 3000

CMD ["npm", "start"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: gulf-telecom-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
      MONGO_INITDB_DATABASE: gulf_premium_telecom
    volumes:
      - mongodb_data:/data/db
    networks:
      - gulf-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gulf-telecom-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=mongodb://admin:secure_password@mongodb:27017/gulf_premium_telecom?authSource=admin
      - ASTERISK_HOST=asterisk
      - ASTERISK_PORT=5038
      - ASTERISK_USERNAME=admin
      - ASTERISK_PASSWORD=amp111
    depends_on:
      - mongodb
    networks:
      - gulf-network

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: gulf-telecom-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:3001
      - NEXT_PUBLIC_WS_URL=ws://backend:3001
    depends_on:
      - backend
    networks:
      - gulf-network

volumes:
  mongodb_data:

networks:
  gulf-network:
    driver: bridge
```

Deploy with Docker:
```bash
docker-compose up -d
```

## Post-Deployment

### Monitoring

1. **Set up monitoring** (Prometheus, Grafana, or similar)
2. **Configure log aggregation** (ELK stack or similar)
3. **Set up uptime monitoring** (UptimeRobot, Pingdom, etc.)

### Backup Strategy

```bash
# MongoDB backup script
cat > /root/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --uri="mongodb://admin:secure_password@localhost:27017/gulf_premium_telecom?authSource=admin" --out=$BACKUP_DIR/$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /root/backup-mongodb.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /root/backup-mongodb.sh
```

### Performance Tuning

1. **MongoDB Indexes**: Already configured in models
2. **Node.js**: Use cluster mode for multi-core servers
3. **Nginx**: Enable caching and compression
4. **Asterisk**: Tune for expected call volume

### Security Hardening

1. Change all default passwords
2. Enable fail2ban
3. Regular security updates
4. Monitor access logs
5. Implement API authentication
6. Use strong SSL configuration

## Troubleshooting

### Check Service Status

```bash
# PM2 services
pm2 status

# Asterisk
sudo systemctl status asterisk
sudo asterisk -rvvv

# MongoDB
sudo systemctl status mongod

# Nginx
sudo systemctl status nginx
```

### View Logs

```bash
# PM2 logs
pm2 logs

# Asterisk logs
sudo tail -f /var/log/asterisk/full

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Maintenance

### Update Application

```bash
cd /var/www/gulf-premium-telecom
git pull
npm install
cd client && npm install && npm run build && cd ..
pm2 restart all
```

### Database Maintenance

```bash
# Compact database
mongo gulf_premium_telecom --eval "db.runCommand({compact: 'calls'})"

# Rebuild indexes
mongo gulf_premium_telecom --eval "db.calls.reIndex()"
```

## Support

For deployment support:
- Documentation: See README.md and INSTALLATION.md
- Issues: GitHub Issues
- Email: support@gulfpremiumtelecom.com