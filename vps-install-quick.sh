#!/bin/bash

###############################################################################
# Gulf Premium Telecom - VPS Quick Setup (Asterisk Already Installed)
# Fast installation for VPS that already has Asterisk
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
APP_DIR="/opt/gulf-telecom"

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
║     Gulf Premium Telecom - Quick VPS Setup                      ║
║     (For VPS with Asterisk Already Installed)                   ║
║                                                                  ║
║     This script will install:                                   ║
║     • Node.js 18.x (if not present)                            ║
║     • MongoDB 6.0 (if not present)                             ║
║     • Gulf Telecom Application                                  ║
║     • Configure Asterisk trunks                                 ║
║     • Systemd Services                                          ║
║     • Nginx Reverse Proxy                                       ║
║     • Firewall Configuration                                    ║
║                                                                  ║
║     ⚠ Assumes Asterisk is already installed!                   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF

echo ""
print_info "Server IP: $SERVER_IP"
echo ""

###############################################################################
# Check Prerequisites
###############################################################################
print_header "Checking Prerequisites"

# Check Asterisk
if command -v asterisk &> /dev/null; then
    ASTERISK_VERSION=$(asterisk -V)
    print_success "Asterisk is installed: $ASTERISK_VERSION"
else
    print_error "Asterisk is NOT installed!"
    print_error "This script requires Asterisk to be pre-installed."
    print_error "Please install Asterisk first or use vps-install.sh for full installation."
    exit 1
fi

# Check if Asterisk is running
if systemctl is-active --quiet asterisk 2>/dev/null || pgrep asterisk &> /dev/null; then
    print_success "Asterisk is running"
else
    print_warning "Asterisk is not running. Attempting to start..."
    systemctl start asterisk 2>/dev/null || service asterisk start 2>/dev/null || true
    sleep 2
    if pgrep asterisk &> /dev/null; then
        print_success "Asterisk started"
    else
        print_error "Could not start Asterisk. Please start it manually."
        exit 1
    fi
fi

read -p "Press Enter to continue with installation..."

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
    NODE_VERSION=$(node --version)
    print_info "Node.js already installed: $NODE_VERSION"
    
    # Check if version is 16 or higher
    NODE_MAJOR=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js version is too old. Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
        print_success "Node.js updated: $(node --version)"
    fi
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
    if ! systemctl is-active --quiet mongod; then
        systemctl start mongod 2>/dev/null || true
        systemctl enable mongod 2>/dev/null || true
    fi
else
    print_info "Installing MongoDB..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt update
    apt install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
    print_success "MongoDB installed and started"
fi

###############################################################################
# Step 4: Install Git
###############################################################################
print_header "Step 4: Installing Git"

if ! command -v git &> /dev/null; then
    apt install -y git
    print_success "Git installed"
else
    print_info "Git already installed"
fi

###############################################################################
# Step 5: Clone Repository
###############################################################################
print_header "Step 5: Cloning Gulf Telecom Repository"

if [ -d "$APP_DIR" ]; then
    print_warning "Directory $APP_DIR already exists"
    read -p "Remove and re-clone? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$APP_DIR"
        mkdir -p "$APP_DIR"
        git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git "$APP_DIR"
        print_success "Repository cloned"
    else
        cd "$APP_DIR"
        git pull
        print_success "Repository updated"
    fi
else
    mkdir -p "$APP_DIR"
    git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git "$APP_DIR"
    print_success "Repository cloned"
fi

cd "$APP_DIR"
chmod +x start-all.sh setup-trunks.sh setup.sh vps-*.sh 2>/dev/null || true

###############################################################################
# Step 6: Configure Asterisk
###############################################################################
print_header "Step 6: Configuring Asterisk SIP Trunks"

# Backup existing configs
BACKUP_DIR="/etc/asterisk/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /etc/asterisk/sip.conf "$BACKUP_DIR/" 2>/dev/null || true
cp /etc/asterisk/extensions.conf "$BACKUP_DIR/" 2>/dev/null || true
cp /etc/asterisk/manager.conf "$BACKUP_DIR/" 2>/dev/null || true
print_info "Backed up existing configs to $BACKUP_DIR"

# Copy new configs
cp "$APP_DIR/asterisk-config/sip.conf" /etc/asterisk/
cp "$APP_DIR/asterisk-config/extensions.conf" /etc/asterisk/
cp "$APP_DIR/asterisk-config/manager.conf" /etc/asterisk/

# Reload Asterisk
asterisk -rx "sip reload" 2>/dev/null || true
asterisk -rx "dialplan reload" 2>/dev/null || true
asterisk -rx "manager reload" 2>/dev/null || true

print_success "Asterisk configured with 8 SIP trunks"

###############################################################################
# Step 7: Configure Firewall
###############################################################################
print_header "Step 7: Configuring Firewall"

# Check if UFW is available
if ! command -v ufw &> /dev/null; then
    apt install -y ufw
fi

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
print_info "Configuring firewall for 8 supplier IPs..."
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
# Step 8: Configure Environment
###############################################################################
print_header "Step 8: Configuring Environment"

if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    
    # Generate secure AMI password
    AMI_PASS=$(openssl rand -base64 32)
    
    # Set default values
    sed -i "s|MONGODB_URI=.*|MONGODB_URI=mongodb://localhost:27017/gulf-telecom|g" "$APP_DIR/.env"
    sed -i "s|AMI_SECRET=.*|AMI_SECRET=$AMI_PASS|g" "$APP_DIR/.env"
    sed -i "s|SERVER_IP=.*|SERVER_IP=$SERVER_IP|g" "$APP_DIR/.env"
    
    print_success ".env file created with secure password"
    print_warning "AMI password in .env: $AMI_PASS"
    print_warning "You may need to update /etc/asterisk/manager.conf to match"
else
    print_info ".env file already exists (not modified)"
fi

###############################################################################
# Step 9: Install Dependencies
###############################################################################
print_header "Step 9: Installing Application Dependencies"

cd "$APP_DIR"
print_info "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

cd "$APP_DIR/client"
print_info "Installing frontend dependencies..."
npm install --production
print_success "Frontend dependencies installed"

###############################################################################
# Step 10: Build Frontend
###############################################################################
print_header "Step 10: Building Frontend"

cd "$APP_DIR/client"
npm run build
print_success "Frontend built for production"

###############################################################################
# Step 11: Create Systemd Services
###############################################################################
print_header "Step 11: Creating Systemd Services"

# Backend service
cat > /etc/systemd/system/gulf-telecom-backend.service << EOF
[Unit]
Description=Gulf Premium Telecom Backend
After=network.target mongod.service asterisk.service
Requires=mongod.service

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

print_success "Systemd services created and enabled"

###############################################################################
# Step 12: Install and Configure Nginx
###############################################################################
print_header "Step 12: Installing and Configuring Nginx"

if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    print_success "Nginx installed"
else
    print_info "Nginx already installed"
fi

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

print_success "Nginx configured and started"

###############################################################################
# Step 13: Start Services
###############################################################################
print_header "Step 13: Starting Gulf Telecom Services"

systemctl start gulf-telecom-backend
sleep 3
systemctl start gulf-telecom-frontend

sleep 5

print_success "Services started"

###############################################################################
# Step 14: Verify Installation
###############################################################################
print_header "Step 14: Verifying Installation"

# Check services
for service in mongod asterisk gulf-telecom-backend gulf-telecom-frontend nginx; do
    if systemctl is-active --quiet $service 2>/dev/null || pgrep -x $service &> /dev/null; then
        print_success "$service is running"
    else
        print_warning "$service may not be running (check manually)"
    fi
done

# Check Asterisk trunks
TRUNK_COUNT=$(asterisk -rx "sip show peers" 2>/dev/null | grep -c "supplier" || true)
if [ "$TRUNK_COUNT" -eq 8 ]; then
    print_success "All 8 SIP trunks configured"
elif [ "$TRUNK_COUNT" -gt 0 ]; then
    print_warning "Found $TRUNK_COUNT trunks (expected 8)"
else
    print_warning "No supplier trunks found - check Asterisk configuration"
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
echo "  Check Asterisk trunks:"
echo "  sudo asterisk -rx 'sip show peers' | grep supplier"
echo ""

print_header "Next Steps"
echo ""
echo "  1. Access dashboard: http://$SERVER_IP"
echo "  2. Review .env file: nano /opt/gulf-telecom/.env"
echo "  3. Contact suppliers and provide your IP: $SERVER_IP"
echo "  4. Request test calls from suppliers"
echo "  5. Monitor calls in the dashboard"
echo ""

print_header "Documentation"
echo ""
echo "  Quick Commands: VPS_QUICK_COMMANDS.md"
echo "  Full Setup Guide: VPS_SETUP.md"
echo "  Troubleshooting: SETUP_CHECKLIST.md"
echo ""

print_warning "IMPORTANT:"
print_warning "• Review and update $APP_DIR/.env if needed"
print_warning "• Ensure AMI password in .env matches /etc/asterisk/manager.conf"
print_warning "• Contact suppliers to whitelist your IP: $SERVER_IP"
echo ""

print_success "Installation completed successfully!"
echo ""
