# Getting Started Guide

## Step-by-Step Implementation

This guide will walk you through implementing the Gulf Premium Telecom IPRN system from scratch.

## Phase 1: Infrastructure Setup (Day 1-2)

### 1.1 Server Preparation

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install essentials
sudo apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    vim \
    htop \
    net-tools \
    postgresql-14 \
    redis-server \
    nginx

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
node --version  # Should be v20.x
npm --version
psql --version
redis-cli --version
```

### 1.2 Install Asterisk

Follow `ASTERISK_SETUP.md` or use quick install:

```bash
cd /usr/src
sudo wget https://github.com/your-org/Gulf-Premium-Telecom/raw/main/asterisk/install_asterisk.sh
sudo chmod +x install_asterisk.sh
sudo ./install_asterisk.sh
```

This installs Asterisk 20 with PJSIP, PostgreSQL CDR, and AGI support.

### 1.3 Configure PostgreSQL

```bash
# Create database and users
sudo -u postgres psql <<EOF
CREATE DATABASE gulf_premium_telecom;

CREATE USER asterisk_api WITH PASSWORD 'SecurePass123!';
GRANT ALL PRIVILEGES ON DATABASE gulf_premium_telecom TO asterisk_api;

CREATE USER asterisk_agi WITH PASSWORD 'AgiPass123!';
GRANT CONNECT ON DATABASE gulf_premium_telecom TO asterisk_agi;

CREATE USER asterisk_cdr WITH PASSWORD 'CdrPass123!';
GRANT CONNECT ON DATABASE gulf_premium_telecom TO asterisk_cdr;
EOF

# Configure PostgreSQL for network access (if needed)
sudo vim /etc/postgresql/14/main/pg_hba.conf
# Add: host    gulf_premium_telecom    asterisk_api    127.0.0.1/32    md5

sudo systemctl restart postgresql
```

### 1.4 Configure Redis

```bash
# Enable Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Test Redis
redis-cli ping  # Should return PONG

# Optional: Set password
sudo vim /etc/redis/redis.conf
# Add: requirepass YourRedisPassword123!
sudo systemctl restart redis-server
```

## Phase 2: Backend Setup (Day 2-3)

### 2.1 Clone and Setup

```bash
cd /opt
sudo git clone https://github.com/your-org/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom/backend

# Set ownership
sudo chown -R $USER:$USER /opt/Gulf-Premium-Telecom

# Install dependencies
npm install
```

### 2.2 Configure Environment

```bash
cp .env.example .env
vim .env
```

Update with your settings:
```env
DATABASE_URL="postgresql://asterisk_api:SecurePass123!@localhost:5432/gulf_premium_telecom"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gulf_premium_telecom
DB_USER=asterisk_api
DB_PASSWORD=SecurePass123!

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YourRedisPassword123!

PORT=3001
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)

AGI_PORT=4573
AGI_HOST=0.0.0.0
```

### 2.3 Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Create tables
npm run db:push

# Or use migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 2.4 Build and Start Backend

```bash
# Build TypeScript
npm run build

# Test backend
npm start

# Check if running
curl http://localhost:3001/health
```

### 2.5 Setup AGI Server

```bash
# Create systemd service
sudo tee /etc/systemd/system/gulf-agi.service > /dev/null <<EOF
[Unit]
Description=Gulf Premium Telecom AGI Server
After=network.target postgresql.service

[Service]
Type=simple
User=asterisk
Group=asterisk
WorkingDirectory=/opt/Gulf-Premium-Telecom/backend
Environment="NODE_ENV=production"
EnvironmentFile=/opt/Gulf-Premium-Telecom/backend/.env
ExecStart=/usr/bin/node dist/agi/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable gulf-agi
sudo systemctl start gulf-agi
sudo systemctl status gulf-agi
```

### 2.6 Setup Backend API Service

```bash
# Create systemd service
sudo tee /etc/systemd/system/gulf-api.service > /dev/null <<EOF
[Unit]
Description=Gulf Premium Telecom API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/Gulf-Premium-Telecom/backend
Environment="NODE_ENV=production"
EnvironmentFile=/opt/Gulf-Premium-Telecom/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable gulf-api
sudo systemctl start gulf-api
sudo systemctl status gulf-api
```

## Phase 3: Asterisk Configuration (Day 3-4)

### 3.1 Configure PJSIP

```bash
# Backup original configs
sudo cp /etc/asterisk/pjsip.conf /etc/asterisk/pjsip.conf.backup

# Copy our configuration
sudo cp asterisk/pjsip.conf /etc/asterisk/pjsip.conf

# Edit with your IPs and settings
sudo vim /etc/asterisk/pjsip.conf
```

Update:
- `external_media_address` with your public IP
- `external_signaling_address` with your public IP
- ACL `permit` lines with your carrier IPs
- Trunk contact addresses

### 3.2 Configure Dialplan

```bash
sudo cp asterisk/extensions.conf /etc/asterisk/extensions.conf
sudo vim /etc/asterisk/extensions.conf
```

Verify AGI server address is correct (127.0.0.1:4573).

### 3.3 Configure Queues

```bash
sudo cp asterisk/queues.conf /etc/asterisk/queues.conf

# Add queue members if using static agents
sudo vim /etc/asterisk/queues.conf
```

### 3.4 Configure CDR

```bash
sudo cp asterisk/cdr_pgsql.conf /etc/asterisk/cdr_pgsql.conf
sudo vim /etc/asterisk/cdr_pgsql.conf
```

Update database credentials:
```ini
[global]
hostname=localhost
port=5432
dbname=gulf_premium_telecom
user=asterisk_cdr
password=CdrPass123!
table=call_detail_records
```

### 3.5 Configure RTP

```bash
sudo cp asterisk/rtp.conf /etc/asterisk/rtp.conf
```

Ensure ports 10000-20000 are allowed in firewall.

### 3.6 Reload Asterisk

```bash
# Check configuration syntax
sudo asterisk -rx "core show settings"

# Reload modules
sudo asterisk -rx "module reload res_pjsip.so"
sudo asterisk -rx "dialplan reload"
sudo asterisk -rx "module reload app_queue.so"

# Or full restart
sudo systemctl restart asterisk

# Verify
sudo asterisk -rx "pjsip show endpoints"
sudo asterisk -rx "pjsip show transports"
```

## Phase 4: Frontend Setup (Day 4-5)

### 4.1 Install and Build

```bash
cd /opt/Gulf-Premium-Telecom/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
vim .env
```

Update:
```env
NEXT_PUBLIC_API_URL=http://your-server-ip:3001
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### 4.2 Build Frontend

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 4.3 Setup with PM2 (Recommended)

```bash
# Install PM2
sudo npm install -g pm2

# Start frontend
pm2 start npm --name "gulf-frontend" -- start

# Start on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs gulf-frontend
```

### 4.4 Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/gulf-premium > /dev/null <<'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/gulf-premium /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Phase 5: Testing (Day 5)

### 5.1 Test Database Connection

```bash
cd /opt/Gulf-Premium-Telecom/backend

# Run Prisma Studio
npm run db:studio
```

Visit http://localhost:5555 to browse data.

### 5.2 Test AGI Server

```bash
# Test connection
telnet localhost 4573

# Should connect. Try sending:
agi_network: yes
agi_extension: +966501234567
agi_callerid: +1234567890
agi_uniqueid: test123


# Press Enter twice
```

### 5.3 Create Test Data

```sql
-- Connect to database
psql -h localhost -U asterisk_api -d gulf_premium_telecom

-- Create test customer
INSERT INTO customers (id, company_name, email, status)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Test Company', 'test@example.com', 'active');

-- Create test SIP trunk
INSERT INTO sip_trunks (id, trunk_name, sip_server, status)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'test-trunk', '203.0.113.10', 'active');

-- Create test destination
INSERT INTO inbound_destinations (id, destination_number, routing_type, status)
VALUES ('550e8400-e29b-41d4-a716-446655440003', '+14155551234', 'queue', 'active');

-- Create test allocation
INSERT INTO allocation_numbers (allocated_number, destination_id, customer_id, status)
VALUES ('+966501234567', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'active');

-- Create test routing rule
INSERT INTO routing_rules (destination_id, action, action_data, status)
VALUES ('550e8400-e29b-41d4-a716-446655440003', 'queue', '{"queue_name": "sales"}', 'active');
```

### 5.4 Test Call Flow

```bash
# From Asterisk CLI
sudo asterisk -rvvv

# Check AGI is reachable
core show settings

# Test call origination
channel originate Local/+966501234567@from-trunk application Playback demo-congrats

# Check logs
tail -f /var/log/asterisk/messages | grep AGI
journalctl -u gulf-agi -f
```

### 5.5 Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Get allocations
curl http://localhost:3001/api/allocations

# Create allocation
curl -X POST http://localhost:3001/api/allocations \
  -H "Content-Type: application/json" \
  -d '{
    "allocatedNumber": "+966501234568",
    "destinationId": "550e8400-e29b-41d4-a716-446655440003",
    "customerId": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

## Phase 6: Production Hardening (Day 6-7)

### 6.1 Security Checklist

```bash
# Change all default passwords
# ✓ PostgreSQL users
# ✓ Redis password
# ✓ JWT secrets
# ✓ Asterisk AMI password

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5060/udp  # SIP
sudo ufw allow 10000:20000/udp  # RTP
sudo ufw enable

# Setup fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 6.2 SSL Certificates

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 6.3 Backup Setup

```bash
# Create backup script
sudo tee /usr/local/bin/gulf-backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR=/backup/gulf-premium
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h localhost -U asterisk_api gulf_premium_telecom | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup Asterisk configs
tar -czf $BACKUP_DIR/asterisk_$DATE.tar.gz /etc/asterisk/

# Backup recordings
tar -czf $BACKUP_DIR/recordings_$DATE.tar.gz /var/spool/asterisk/monitor/

# Delete old backups (keep 30 days)
find $BACKUP_DIR -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/gulf-backup.sh

# Add cron job (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/gulf-backup.sh") | crontab -
```

### 6.4 Monitoring Setup

```bash
# Install monitoring tools
sudo apt-get install prometheus-node-exporter

# Setup log rotation
sudo tee /etc/logrotate.d/gulf-premium > /dev/null <<EOF
/var/log/gulf-premium-telecom/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload gulf-api > /dev/null
        systemctl reload gulf-agi > /dev/null
    endscript
}
EOF
```

## Troubleshooting

### Common Issues

**1. AGI not connecting:**
```bash
# Check AGI server is running
sudo systemctl status gulf-agi

# Check port is listening
netstat -tlnp | grep 4573

# Check Asterisk can reach AGI
asterisk -rx "agi show"
```

**2. No inbound calls:**
```bash
# Check PJSIP endpoints
asterisk -rx "pjsip show endpoints"

# Enable SIP debug
asterisk -rx "pjsip set logger on"

# Check firewall
sudo ufw status
```

**3. Database connection errors:**
```bash
# Test connection
psql -h localhost -U asterisk_api -d gulf_premium_telecom

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check permissions
sudo -u postgres psql -c "\du"
```

**4. One-way audio:**
```bash
# Check NAT settings in pjsip.conf
grep external /etc/asterisk/pjsip.conf

# Check RTP ports in firewall
sudo ufw status | grep 10000

# Enable RTP debug
asterisk -rx "rtp set debug on"
```

## Next Steps

1. **Load Testing**: Use SIPp to simulate call load
2. **Monitoring**: Set up Grafana dashboards
3. **Documentation**: Document your customizations
4. **Training**: Train staff on the system
5. **Scaling**: Plan for growth (additional servers, load balancing)

## Support

For issues, consult:
- `ASTERISK_SETUP.md` for Asterisk issues
- `DATABASE_SCHEMA.md` for database questions
- `AGI_SERVER.md` for AGI server issues
- `TECH_STACK.md` for technology questions

Good luck! 🚀
