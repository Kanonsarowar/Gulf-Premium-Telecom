#!/bin/bash

###############################################################################
# Gulf Premium Telecom - VPS Automated Installer
# One-command installation script for Ubuntu 20.04/22.04 VPS
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server IP
SERVER_IP="167.172.170.88"

# Print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

clear
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     Gulf Premium Telecom - Automated VPS Installer              ║
║                                                                  ║
║     This script will install and configure:                     ║
║     • Node.js 18.x                                              ║
║     • MongoDB 6.0                                               ║
║     • Asterisk 18.x                                             ║
║     • Gulf Telecom Application                                  ║
║     • Systemd Services                                          ║
║     • Nginx Reverse Proxy                                       ║
║     • Firewall Configuration                                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF

print_info "Server IP: $SERVER_IP"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

###############################################################################
# Step 1: Update System
###############################################################################
print_header "Step 1: Updating System"
apt update && apt upgrade -y
print_success "System updated"

###############################################################################
# Step 2: Install Node.js
###############################################################################
print_header "Step 2: Installing Node.js 18.x"

if command -v node &> /dev/null; then
    print_info "Node.js already installed: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
fi

###############################################################################
# Step 3: Install MongoDB
###############################################################################
print_header "Step 3: Installing MongoDB 6.0"

if command -v mongod &> /dev/null; then
    print_info "MongoDB already installed"
else
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    print_success "MongoDB installed and started"
fi

###############################################################################
# Step 4: Install Asterisk Dependencies
###############################################################################
print_header "Step 4: Installing Asterisk Dependencies"

apt install -y build-essential wget libssl-dev libncurses5-dev libnewt-dev \
    libxml2-dev linux-headers-$(uname -r) libsqlite3-dev uuid-dev \
    libjansson-dev git curl

print_success "Asterisk dependencies installed"

###############################################################################
# Step 5: Install Asterisk
###############################################################################
print_header "Step 5: Installing Asterisk 18.x (this may take 15-20 minutes)"

if command -v asterisk &> /dev/null; then
    print_info "Asterisk already installed: $(asterisk -V)"
else
    cd /usr/src
    
    # Download Asterisk if not already downloaded
    if [ ! -f "asterisk-18-current.tar.gz" ]; then
        wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-18-current.tar.gz
    fi
    
    tar -xvf asterisk-18-current.tar.gz
    cd asterisk-18.*/
    
    contrib/scripts/get_mp3_source.sh
    ./configure --with-jansson-bundled
    
    make menuselect.makeopts
    menuselect/menuselect --enable app_macro menuselect.makeopts
    
    print_info "Building Asterisk (this takes 15-20 minutes)..."
    make -j$(nproc)
    make install
    make samples
    make config
    make install-logrotate
    
    systemctl start asterisk
    systemctl enable asterisk
    
    print_success "Asterisk installed and started"
fi

###############################################################################
# Step 6: Clone Repository
###############################################################################
print_header "Step 6: Cloning Gulf Telecom Repository"

APP_DIR="/opt/gulf-telecom"

if [ -d "$APP_DIR" ]; then
    print_warning "Directory $APP_DIR already exists"
    read -p "Remove and re-clone? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$APP_DIR"
    fi
fi

if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git "$APP_DIR"
    print_success "Repository cloned"
else
    cd "$APP_DIR"
    git pull
    print_success "Repository updated"
fi

cd "$APP_DIR"
chmod +x start-all.sh setup-trunks.sh setup.sh

###############################################################################
# Step 7: Configure Asterisk
###############################################################################
print_header "Step 7: Configuring Asterisk"

# Backup existing configs
cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp /etc/asterisk/manager.conf /etc/asterisk/manager.conf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Copy new configs
cp "$APP_DIR/asterisk-config/sip.conf" /etc/asterisk/
cp "$APP_DIR/asterisk-config/extensions.conf" /etc/asterisk/
cp "$APP_DIR/asterisk-config/manager.conf" /etc/asterisk/

# Reload Asterisk
asterisk -rx "sip reload"
asterisk -rx "dialplan reload"
asterisk -rx "manager reload"

print_success "Asterisk configured"

###############################################################################
# Step 8: Configure Firewall
###############################################################################
print_header "Step 8: Configuring Firewall"

# Enable UFW if not already enabled
ufw --force enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application ports
ufw allow 3000/tcp
ufw allow 3001/tcp

# Allow SIP from supplier IPs
ufw allow from 108.61.70.46 to any port 5060 proto udp
ufw allow from 157.90.193.196 to any port 5060 proto udp
ufw allow from 51.77.77.223 to any port 5060 proto udp
ufw allow from 95.217.90.212 to any port 5060 proto udp
ufw allow from 52.28.165.40 to any port 5060 proto udp
ufw allow from 52.57.172.184 to any port 5060 proto udp
ufw allow from 35.156.119.128 to any port 5060 proto udp
ufw allow from 149.12.160.10 to any port 5060 proto udp

# Allow RTP media
ufw allow 10000:20000/udp

print_success "Firewall configured"

###############################################################################
# Step 9: Configure Environment
###############################################################################
print_header "Step 9: Configuring Environment"

if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    
    # Set default values
    sed -i "s|mongodb://localhost:27017/gulf-telecom|mongodb://localhost:27017/gulf-telecom|g" "$APP_DIR/.env"
    sed -i "s|AMI_SECRET=.*|AMI_SECRET=$(openssl rand -base64 32)|g" "$APP_DIR/.env"
    
    print_success ".env file created"
else
    print_info ".env file already exists"
fi

###############################################################################
# Step 10: Install Dependencies
###############################################################################
print_header "Step 10: Installing Application Dependencies"

cd "$APP_DIR"
npm install
print_success "Backend dependencies installed"

cd "$APP_DIR/client"
npm install
print_success "Frontend dependencies installed"

###############################################################################
# Step 11: Build Frontend
###############################################################################
print_header "Step 11: Building Frontend"

cd "$APP_DIR/client"
npm run build
print_success "Frontend built"

###############################################################################
# Step 12: Create Systemd Services
###############################################################################
print_header "Step 12: Creating Systemd Services"

# Backend service
cat > /etc/systemd/system/gulf-telecom-backend.service << EOF
[Unit]
Description=Gulf Premium Telecom Backend
After=network.target mongod.service asterisk.service
Requires=mongod.service asterisk.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gulf-backend

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/gulf-telecom-frontend.service << EOF
[Unit]
Description=Gulf Premium Telecom Frontend
After=network.target gulf-telecom-backend.service
Requires=gulf-telecom-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/client
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gulf-frontend

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gulf-telecom-backend
systemctl enable gulf-telecom-frontend

print_success "Systemd services created"

###############################################################################
# Step 13: Install and Configure Nginx
###############################################################################
print_header "Step 13: Installing and Configuring Nginx"

apt install -y nginx

cat > /etc/nginx/sites-available/gulf-telecom << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/gulf-telecom /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
systemctl enable nginx

print_success "Nginx configured"

###############################################################################
# Step 14: Start Services
###############################################################################
print_header "Step 14: Starting Services"

systemctl start gulf-telecom-backend
systemctl start gulf-telecom-frontend

sleep 5

print_success "Services started"

###############################################################################
# Step 15: Verify Installation
###############################################################################
print_header "Step 15: Verifying Installation"

# Check services
for service in mongod asterisk gulf-telecom-backend gulf-telecom-frontend nginx; do
    if systemctl is-active --quiet $service; then
        print_success "$service is running"
    else
        print_error "$service is not running"
    fi
done

# Check Asterisk trunks
TRUNK_COUNT=$(asterisk -rx "sip show peers" | grep -c "supplier" || true)
if [ "$TRUNK_COUNT" -eq 8 ]; then
    print_success "All 8 SIP trunks configured"
else
    print_warning "Expected 8 trunks, found $TRUNK_COUNT"
fi

###############################################################################
# Installation Complete
###############################################################################
clear
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     ✓ Gulf Premium Telecom - Installation Complete!            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF

echo ""
print_header "Access Your Dashboard"
echo ""
print_success "Dashboard:    http://$SERVER_IP"
print_success "Backend API:  http://$SERVER_IP:3001/api"
print_success "Health Check: http://$SERVER_IP:3001/api/health"
echo ""

print_header "Service Management"
echo ""
echo "  Restart all services:"
echo "  sudo systemctl restart gulf-telecom-backend gulf-telecom-frontend"
echo ""
echo "  View logs:"
echo "  sudo journalctl -u gulf-telecom-backend -f"
echo "  sudo journalctl -u gulf-telecom-frontend -f"
echo ""
echo "  Check Asterisk:"
echo "  sudo asterisk -rvvv"
echo ""

print_header "Next Steps"
echo ""
echo "  1. Access dashboard: http://$SERVER_IP"
echo "  2. Contact suppliers and provide your IP: $SERVER_IP"
echo "  3. Request test calls from suppliers"
echo "  4. Monitor calls in the dashboard"
echo ""

print_warning "IMPORTANT: Review and update /opt/gulf-telecom/.env file"
print_warning "Change default passwords in /etc/asterisk/manager.conf"
echo ""

print_success "Installation completed successfully!"
echo ""
