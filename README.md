# Gulf Premium Telecom - Asterisk SIP Call Receiver

A comprehensive solution for building an Asterisk-based inbound SIP call receiver with IVR (Interactive Voice Response) integration and real-time revenue tracking dashboard.

## 🚀 Quick Start - One Command!

**Already have Asterisk installed?** Start everything with just:

```bash
./start-all.sh
```

See [ONE_COMMAND.md](ONE_COMMAND.md) for details.

## Features

- **Asterisk SIP Integration**: Handles inbound SIP calls via Asterisk Manager Interface (AMI)
- **Multiple SIP Trunks**: Pre-configured support for 8 supplier trunks
- **IVR System**: Configurable Interactive Voice Response for call routing
- **Real-time Dashboard**: WebSocket-powered live call monitoring
- **Revenue Tracking**: Automatic revenue calculation and analytics
- **Call History**: Complete call records with detailed statistics
- **Active Call Management**: Monitor and control active calls in real-time
- **Analytics & Reporting**: Hourly, daily, and caller-based revenue reports
- **Multi-Codec Support**: G.729, G.711 (ulaw/alaw), GSM
- **E.164 Number Format**: International number format support

## Architecture

### Backend (Node.js/Express)
- Asterisk Manager Interface (AMI) integration
- MongoDB database for call records and analytics
- WebSocket server for real-time updates
- RESTful API for data access

### Frontend (Next.js/React)
- Real-time dashboard with live call monitoring
- Revenue analytics and visualization
- Call history with advanced filtering
- Active call management interface

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Asterisk PBX (v16 or higher)
- npm or yarn package manager

## Installation

### Quick Installation (One Command)

If you already have Asterisk installed and configured:

```bash
./start-all.sh
```

This will:
- ✅ Install all dependencies
- ✅ Setup environment
- ✅ Start backend and frontend
- ✅ Connect to Asterisk AMI
- ✅ Open dashboard on http://localhost:3000

📖 **See [ONE_COMMAND.md](ONE_COMMAND.md) for complete guide**

### Manual Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Kanonsarowar/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom
```

#### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Asterisk Manager Interface (AMI) Configuration
ASTERISK_HOST=localhost
ASTERISK_PORT=5038
ASTERISK_USERNAME=admin
ASTERISK_PASSWORD=amp111

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/gulf_premium_telecom

# WebSocket Configuration
WS_PORT=3002

# Revenue Configuration
CALL_RATE_PER_MINUTE=0.10
CURRENCY=USD
```

### 5. Configure Asterisk

Copy the Asterisk configuration files from `asterisk-config/` to your Asterisk configuration directory (usually `/etc/asterisk/`):

```bash
# Backup existing configurations first!
sudo cp /etc/asterisk/manager.conf /etc/asterisk/manager.conf.backup
sudo cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup
sudo cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup

# Copy new configurations
sudo cp asterisk-config/manager.conf /etc/asterisk/
sudo cp asterisk-config/sip.conf /etc/asterisk/
sudo cp asterisk-config/extensions.conf /etc/asterisk/

# Reload Asterisk
sudo asterisk -rx "module reload"
```

**Important Configuration Notes:**

1. **Manager Interface (manager.conf)**:
   - Update the `secret` with a secure password
   - Adjust `permit` settings based on your network security requirements

2. **SIP Configuration (sip.conf)**:
   - Configure your SIP trunk details according to your provider
   - Update extension passwords for security

3. **Dialplan (extensions.conf)**:
   - Customize IVR menu options and destinations
   - Add your audio files to `/var/lib/asterisk/sounds/`

### 6. Start MongoDB

```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

## Running the Application

### Development Mode

Run both backend and frontend in development mode:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend application on `http://localhost:3000`

### Production Mode

Build and run in production:

```bash
# Build the frontend
npm run build

# Start the server
npm start
```

## API Endpoints

### Call Management

- `GET /api/calls` - Get all calls with pagination
- `GET /api/calls/active` - Get currently active calls
- `GET /api/calls/:callId` - Get specific call details
- `GET /api/calls/caller/:number` - Get calls by caller number
- `POST /api/calls/date-range` - Get calls by date range
- `POST /api/calls/hangup/:channel` - Hangup a specific channel

### Revenue Analytics

- `GET /api/revenue/today` - Get today's revenue statistics
- `POST /api/revenue/range` - Get revenue for date range
- `GET /api/revenue/hourly/:date` - Get hourly breakdown
- `GET /api/revenue/monthly/:year/:month` - Get monthly summary
- `GET /api/revenue/top-callers/:limit` - Get top callers by revenue
- `GET /api/revenue/dashboard/realtime` - Get real-time dashboard data

### Health Check

- `GET /health` - Server and Asterisk connection status

## WebSocket Events

The WebSocket server broadcasts the following events:

- `connected` - Initial connection confirmation
- `call_new` - New incoming call
- `call_update` - Call status update
- `call_ended` - Call completed
- `ivr_update` - IVR selection update

## IVR Configuration

The default IVR menu includes:

- **Option 1**: Sales (routes to extension 1000)
- **Option 2**: Support (routes to extension 1001)
- **Option 3**: Billing Information
- **Option 9**: Operator
- **Option 0**: Repeat menu

Customize these options in `asterisk-config/extensions.conf`.

## Revenue Calculation

Revenue is automatically calculated based on:
- Call duration (in seconds)
- Rate per minute (configured in `.env`)
- Formula: `Revenue = (Duration / 60) × Rate per Minute`

## Dashboard Features

### Real-time Dashboard
- Active call counter
- Live call status updates
- Today's statistics
- Recent completed calls
- 7-day trend analysis

### Active Calls View
- Monitor all active calls
- View call details and IVR selections
- Hangup calls remotely
- Real-time duration tracking

### Revenue Analytics
- Today's revenue summary
- Hourly revenue chart
- Top callers by revenue
- Performance metrics

### Call History
- Paginated call records
- Advanced filtering
- Detailed call information
- Export capabilities

## Database Schema

### Call Document

```javascript
{
  callId: String,           // Unique call identifier
  channelId: String,        // Asterisk channel ID
  callerNumber: String,     // Caller's phone number
  callerName: String,       // Caller's name
  direction: String,        // 'inbound' or 'outbound'
  status: String,           // Call status
  startTime: Date,          // Call start time
  answerTime: Date,         // When call was answered
  endTime: Date,            // Call end time
  duration: Number,         // Duration in seconds
  revenue: Number,          // Generated revenue
  hangupCause: String,      // Hangup reason code
  hangupCauseText: String,  // Hangup reason description
  ivrData: Object,          // IVR selections
  events: Array             // Call event timeline
}
```

## Troubleshooting

### Asterisk Connection Issues

1. Verify Asterisk is running: `sudo systemctl status asterisk`
2. Check AMI is enabled in manager.conf
3. Verify credentials match .env configuration
4. Check firewall allows port 5038

### MongoDB Connection Issues

1. Verify MongoDB is running: `sudo systemctl status mongod`
2. Check MongoDB URI in .env
3. Ensure MongoDB port (27017) is accessible

### WebSocket Connection Issues

1. Verify backend server is running
2. Check browser console for WebSocket errors
3. Ensure WebSocket URL is correct in client configuration

### No Incoming Calls

1. Verify SIP trunk configuration in sip.conf
2. Check Asterisk CLI for errors: `sudo asterisk -rvvv`
3. Verify dialplan is correctly configured
4. Test with: `asterisk -rx "core show channels"`

## Security Considerations

1. **Change Default Passwords**: Update all default passwords in configuration files
2. **Firewall Configuration**: Restrict AMI port (5038) access
3. **HTTPS/WSS**: Use secure connections in production
4. **Authentication**: Implement API authentication for production use
5. **Input Validation**: All user inputs are validated
6. **SQL Injection**: MongoDB queries use parameterized inputs

## Performance Optimization

1. **Database Indexing**: Indexes are created on frequently queried fields
2. **Pagination**: Large datasets are paginated
3. **WebSocket**: Efficient real-time updates without polling
4. **Caching**: Consider implementing Redis for high-traffic scenarios

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: support@gulfpremiumtelecom.com

## Acknowledgments

- Asterisk Open Source PBX
- Node.js and Express community
- Next.js and React teams
- MongoDB team
