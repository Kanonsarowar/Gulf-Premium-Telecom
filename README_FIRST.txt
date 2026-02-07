╔══════════════════════════════════════════════════════════════════════════╗
║                   GULF PREMIUM TELECOM - SETUP GUIDE                     ║
║                         YOUR 404 ERROR IS FIXED!                         ║
╚══════════════════════════════════════════════════════════════════════════╝

YOUR PROBLEM:
-------------
✗ Tried: curl ...main/vps-install-quick.sh
✗ Result: 404 error (file not on main branch yet)

THE SOLUTION:
-------------
✓ Files are on branch: copilot/build-asterisk-inbound-sip
✓ Use the commands below (verified working!)

══════════════════════════════════════════════════════════════════════════

WORKING COMMANDS FOR YOUR VPS (Asterisk already installed):
══════════════════════════════════════════════════════════════════════════

METHOD 1: Clone Repository Then Install (RECOMMENDED)
------------------------------------------------------
git clone -b copilot/build-asterisk-inbound-sip \
  https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git

cd Gulf-Premium-Telecom

sudo ./install-from-here.sh
    ⬆️ NEW! Works from your current directory

⚠️  IMPORTANT: If you cloned earlier, pull latest files first:
   cd ~/Gulf-Premium-Telecom
   git pull origin copilot/build-asterisk-inbound-sip
   sudo ./install-from-here.sh


METHOD 2: Direct Curl (Advanced)
---------------------------------
curl -fsSL https://raw.githubusercontent.com/Kanonsarowar/\
Gulf-Premium-Telecom/copilot/build-asterisk-inbound-sip/\
vps-install-quick.sh | sudo bash


💡 TIP: If you already cloned the repo, use Method 1 with ./install-from-here.sh
    This fixes the "No such file or directory" error!

══════════════════════════════════════════════════════════════════════════

WHAT HAPPENS NEXT:
------------------
⏱  Installation time: 5-10 minutes
📦 Installs: Node.js, MongoDB, Application, 8 SIP Trunks
🔥 Configures: Firewall, Services, Nginx
✓  Verifies: Everything is working

══════════════════════════════════════════════════════════════════════════

AFTER INSTALLATION:
-------------------
Dashboard:     http://167.172.170.88
Backend API:   http://167.172.170.88:3001/api
Health Check:  http://167.172.170.88:3001/api/health

══════════════════════════════════════════════════════════════════════════

YOUR 8 CONFIGURED SIP TRUNKS:
------------------------------
1. 108.61.70.46      → supplier1-trunk1
2. 157.90.193.196    → supplier1-trunk2
3. 51.77.77.223      → supplier1-trunk3
4. 95.217.90.212     → supplier1-trunk4
5. 52.28.165.40      → supplier2-aws1
6. 52.57.172.184     → supplier2-aws2
7. 35.156.119.128    → supplier2-aws3
8. 149.12.160.10     → supplier3-quintum

All configured for IP: 167.172.170.88

══════════════════════════════════════════════════════════════════════════

VERIFICATION COMMANDS:
----------------------
# Check services running
sudo systemctl status gulf-telecom-backend gulf-telecom-frontend

# Check SIP trunks (should show 8)
sudo asterisk -rx "sip show peers" | grep supplier

# View logs
sudo journalctl -u gulf-telecom-backend -f

══════════════════════════════════════════════════════════════════════════

NEED MORE HELP? READ THESE FILES:
----------------------------------
FINAL_INSTRUCTIONS.md    ⭐ Complete guide (START HERE)
DEPLOY_NOW.md            🚀 Quick deployment guide
COMMANDS_THAT_WORK.txt   📋 Just the commands
START_HERE.md            📖 Quick reference
VPS_SETUP.md             📚 Detailed manual setup

══════════════════════════════════════════════════════════════════════════

NEXT STEPS AFTER INSTALL:
--------------------------
1. Access dashboard at http://167.172.170.88
2. Contact suppliers with your IP: 167.172.170.88
3. Request test calls from each supplier
4. Monitor dashboard for incoming calls
5. Check revenue tracking is working

══════════════════════════════════════════════════════════════════════════

READY? JUST RUN ONE OF THE TWO COMMANDS ABOVE! 🚀
══════════════════════════════════════════════════════════════════════════
