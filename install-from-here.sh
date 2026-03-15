#!/bin/bash

###############################################################################
# Gulf Premium Telecom - Install from Current Directory
# Run this script from within the cloned repository
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Get current directory (where the script is being run from)
CURRENT_DIR="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if we're in the repository
if [ ! -f "$SCRIPT_DIR/package.json" ] || [ ! -d "$SCRIPT_DIR/asterisk-config" ]; then
    print_error "This script must be run from within the Gulf-Premium-Telecom repository!"
    print_error "Current directory: $SCRIPT_DIR"
    print_error "Please cd to the repository directory and try again."
    exit 1
fi

APP_DIR="$SCRIPT_DIR"
SERVER_IP="167.172.170.88"

clear
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     Gulf Premium Telecom - Install from Current Directory      ║
║     (For VPS with Asterisk Already Installed)                   ║
║                                                                  ║
║     This script will:                                           ║
║     • Install Node.js 18.x (if not present)                    ║
║     • Install MongoDB 6.0 (if not present)                     ║
║     • Configure Asterisk trunks from this directory            ║
║     • Install dependencies                                      ║
║     • Build frontend                                            ║
║     • Create systemd services                                   ║
║     • Configure Nginx                                           ║
║     • Configure firewall                                        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF

echo ""
print_info "Repository directory: $APP_DIR"
print_info "Server IP: $SERVER_IP"
echo ""

read -p "Continue with installation? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Installation cancelled"
    exit 0
fi

###############################################################################
# Check Prerequisites
###############################################################################
print_header "Step 1: Checking Prerequisites"

# Check Asterisk
if command -v asterisk &> /dev/null; then
    ASTERISK_VERSION=$(asterisk -V)
    print_success "Asterisk is installed: $ASTERISK_VERSION"
else
    print_error "Asterisk is NOT installed!"
    print_error "Please install Asterisk first."
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

###############################################################################
# Step 2: Update System
###############################################################################
print_header "Step 2: Updating System Packages"

apt update
apt upgrade -y
print_success "System packages updated"

###############################################################################
# Step 3: Install Node.js
###############################################################################
print_header "Step 3: Installing Node.js 18.x"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
    print_info "Node.js already installed: $NODE_VERSION"
    
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js version is too old. Upgrading to 18.x..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
        print_success "Node.js upgraded to $(node -v)"
    else
        print_success "Node.js version is acceptable"
    fi
else
    print_info "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_success "Node.js installed: $(node -v)"
fi

###############################################################################
# Step 4: Install MongoDB
###############################################################################
print_header "Step 4: Installing MongoDB 6.0"

if command -v mongod &> /dev/null; then
    print_info "MongoDB already installed"
    systemctl start mongod 2>/dev/null || service mongod start 2>/dev/null || true
    print_success "MongoDB is running"
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
# Step 5: Configure Asterisk
###############################################################################
print_header "Step 5: Configuring Asterisk SIP Trunks"

# Backup existing configs
BACKUP_DIR="/etc/asterisk/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /etc/asterisk/sip.conf "$BACKUP_DIR/" 2>/dev/null || true
cp /etc/asterisk/extensions.conf "$BACKUP_DIR/" 2>/dev/null || true
cp /etc/asterisk/manager.conf "$BACKUP_DIR/" 2>/dev/null || true
print_info "Backed up existing configs to $BACKUP_DIR"

# Copy new configs
if [ -f "$APP_DIR/asterisk-config/sip.conf" ]; then
    cp "$APP_DIR/asterisk-config/sip.conf" /etc/asterisk/
    print_success "Copied sip.conf"
else
    print_error "sip.conf not found in $APP_DIR/asterisk-config/"
    exit 1
fi

if [ -f "$APP_DIR/asterisk-config/extensions.conf" ]; then
    cp "$APP_DIR/asterisk-config/extensions.conf" /etc/asterisk/
    print_success "Copied extensions.conf"
else
    print_error "extensions.conf not found in $APP_DIR/asterisk-config/"
    exit 1
fi

if [ -f "$APP_DIR/asterisk-config/manager.conf" ]; then
    cp "$APP_DIR/asterisk-config/manager.conf" /etc/asterisk/
    print_success "Copied manager.conf"
else
    print_error "manager.conf not found in $APP_DIR/asterisk-config/"
    exit 1
fi

# Reload Asterisk
asterisk -rx "sip reload" 2>/dev/null || true
asterisk -rx "dialplan reload" 2>/dev/null || true
asterisk -rx "manager reload" 2>/dev/null || true

print_success "Asterisk configured with 8 SIP trunks"

# Show trunk status
print_info "SIP Trunk Status:"
asterisk -rx "sip show peers" | grep supplier || print_warning "No supplier trunks visible yet (they will show as online when suppliers connect)"

###############################################################################
# Step 6: Configure Firewall
###############################################################################
print_header "Step 6: Configuring Firewall"

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
# Step 7: Configure Environment
###############################################################################
print_header "Step 7: Configuring Environment"

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
# Step 8: Install Dependencies
###############################################################################
print_header "Step 8: Installing Application Dependencies"

cd "$APP_DIR"
print_info "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

cd "$APP_DIR/client"
print_info "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

###############################################################################
# Step 9: Build Frontend
###############################################################################
print_header "Step 9: Building Frontend"

cd "$APP_DIR/client"
npm run build
print_success "Frontend built for production"

###############################################################################
# Step 10: Create Systemd Services
###############################################################################
print_header "Step 10: Creating Systemd Services"

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
# Step 11: Install and Configure Nginx
###############################################################################
print_header "Step 11: Installing and Configuring Nginx"

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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
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
# Step 12: Start Services
###############################################################################
print_header "Step 12: Starting All Services"

print_info "Starting backend server..."
systemctl start gulf-telecom-backend
sleep 2

print_info "Starting frontend server..."
systemctl start gulf-telecom-frontend
sleep 2

print_success "All services started"

###############################################################################
# Step 13: Verify Installation
###############################################################################
print_header "Step 13: Verifying Installation"

# Check services
if systemctl is-active --quiet gulf-telecom-backend; then
    print_success "Backend service is running"
else
    print_error "Backend service failed to start"
    print_info "Check logs with: journalctl -u gulf-telecom-backend -n 50"
fi

if systemctl is-active --quiet gulf-telecom-frontend; then
    print_success "Frontend service is running"
else
    print_error "Frontend service failed to start"
    print_info "Check logs with: journalctl -u gulf-telecom-frontend -n 50"
fi

if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx failed to start"
fi

# Check SIP trunks
TRUNK_COUNT=$(asterisk -rx "sip show peers" | grep supplier | wc -l)
if [ "$TRUNK_COUNT" -ge 8 ]; then
    print_success "Found $TRUNK_COUNT SIP trunk(s) configured"
else
    print_warning "Expected 8 trunks, found $TRUNK_COUNT"
    print_info "Trunks will show as online when suppliers connect"
fi

###############################################################################
# Installation Complete
###############################################################################
clear
cat << "EOF"

╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              🎉 Installation Complete! 🎉                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

EOF

print_success "Gulf Premium Telecom is now installed and running!"
echo ""
print_header "Access Your System"
echo ""
echo "  Dashboard:     http://$SERVER_IP"
echo "  Backend API:   http://$SERVER_IP:3001/api"
echo "  Health Check:  http://$SERVER_IP:3001/api/health"
echo ""

print_header "Verify Installation"
echo ""
echo "  # Check services"
echo "  sudo systemctl status gulf-telecom-backend gulf-telecom-frontend"
echo ""
echo "  # Check SIP trunks"
echo "  sudo asterisk -rx \"sip show peers\" | grep supplier"
echo ""
echo "  # View backend logs"
echo "  sudo journalctl -u gulf-telecom-backend -f"
echo ""

print_header "Your 8 Configured Trunks"
echo ""
echo "  108.61.70.46     → supplier1-trunk1"
echo "  157.90.193.196   → supplier1-trunk2"
echo "  51.77.77.223     → supplier1-trunk3"
echo "  95.217.90.212    → supplier1-trunk4"
echo "  52.28.165.40     → supplier2-aws1"
echo "  52.57.172.184    → supplier2-aws2"
echo "  35.156.119.128   → supplier2-aws3"
echo "  149.12.160.10    → supplier3-quintum"
echo ""

print_header "Next Steps"
echo ""
echo "  1. Contact your suppliers and provide them your IP: $SERVER_IP"
echo "  2. Request test calls from each supplier"
echo "  3. Monitor the dashboard for incoming calls"
echo "  4. Review logs to ensure everything is working"
echo ""

print_warning "Installation directory: $APP_DIR"
print_info "Configuration files backed up to: $BACKUP_DIR"
echo ""
