# Gulf Premium Telecom - System Architecture

## Overview

Gulf Premium Telecom is a comprehensive telecom solution built around Asterisk PBX for handling inbound SIP calls with IVR integration and real-time revenue tracking. The system consists of three main components:

1. **Asterisk PBX** - Handles SIP calls and IVR
2. **Backend Server** - Node.js application managing call data and WebSocket connections
3. **Frontend Dashboard** - Next.js/React real-time monitoring interface

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         External Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐        ┌──────────────┐                       │
│  │ SIP Trunk    │        │   Clients    │                       │
│  │  Provider    │        │  (Browsers)  │                       │
│  └──────┬───────┘        └──────┬───────┘                       │
│         │ SIP                    │ HTTPS/WSS                     │
└─────────┼────────────────────────┼───────────────────────────────┘
          │                        │
          │                        │
┌─────────▼────────────────────────▼───────────────────────────────┐
│                      Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Asterisk PBX Server                     │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │  • SIP Call Handling (Port 5060)                     │       │
│  │  • IVR Menu System                                   │       │
│  │  • Call Routing & Bridging                           │       │
│  │  • Manager Interface (AMI - Port 5038)               │       │
│  └────────────────┬─────────────────────────────────────┘       │
│                   │ AMI Events                                   │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────┐       │
│  │            Backend Server (Node.js)                  │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐    │       │
│  │  │     Asterisk Service (AMI Client)           │    │       │
│  │  │  • Connect to Asterisk AMI                  │    │       │
│  │  │  • Listen for call events                   │    │       │
│  │  │  • Parse and process events                 │    │       │
│  │  │  • Track active calls                       │    │       │
│  │  └────────────────┬────────────────────────────┘    │       │
│  │                   │                                  │       │
│  │  ┌────────────────▼────────────────────────────┐    │       │
│  │  │     Express REST API                        │    │       │
│  │  │  • /api/calls - Call management             │    │       │
│  │  │  • /api/revenue - Revenue analytics         │    │       │
│  │  │  • /health - System health check            │    │       │
│  │  └────────────────┬────────────────────────────┘    │       │
│  │                   │                                  │       │
│  │  ┌────────────────▼────────────────────────────┐    │       │
│  │  │     WebSocket Server                        │    │       │
│  │  │  • Real-time event broadcasting             │    │       │
│  │  │  • Client connection management             │    │       │
│  │  │  • Push call updates to clients             │    │       │
│  │  └─────────────────────────────────────────────┘    │       │
│  │                                                       │       │
│  └──────────────┬────────────────────────────────┬──────┘       │
│                 │                                │               │
│                 │ HTTP/REST                     │ WebSocket     │
│                 │                                │               │
│  ┌──────────────▼────────────────────────────────▼──────┐       │
│  │          Frontend (Next.js/React)                    │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐    │       │
│  │  │  Real-time Dashboard                        │    │       │
│  │  │  • Active calls display                     │    │       │
│  │  │  • Revenue statistics                       │    │       │
│  │  │  • Live call updates via WebSocket          │    │       │
│  │  └─────────────────────────────────────────────┘    │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐    │       │
│  │  │  Active Calls View                          │    │       │
│  │  │  • Monitor active calls                     │    │       │
│  │  │  • Call details & timeline                  │    │       │
│  │  │  • Hangup control                           │    │       │
│  │  └─────────────────────────────────────────────┘    │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐    │       │
│  │  │  Revenue Analytics                          │    │       │
│  │  │  • Daily/hourly breakdowns                  │    │       │
│  │  │  • Top callers                              │    │       │
│  │  │  • Revenue charts                           │    │       │
│  │  └─────────────────────────────────────────────┘    │       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐    │       │
│  │  │  Call History                               │    │       │
│  │  │  • Paginated call records                   │    │       │
│  │  │  • Detailed call information                │    │       │
│  │  │  • Search and filter                        │    │       │
│  │  └─────────────────────────────────────────────┘    │       │
│  │                                                       │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              MongoDB Database                        │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │                                                       │       │
│  │  ┌─────────────────────────────────────────────┐    │       │
│  │  │  calls Collection                           │    │       │
│  │  │  • Call records                             │    │       │
│  │  │  • Call events & timeline                   │    │       │
│  │  │  • IVR data                                 │    │       │
│  │  │  • Revenue calculations                     │    │       │
│  │  │  • Indexed for performance                  │    │       │
│  │  └─────────────────────────────────────────────┘    │       │
│  │                                                       │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Inbound Call Flow

```
1. Incoming SIP Call
   ↓
2. Asterisk receives call on SIP trunk
   ↓
3. Asterisk triggers "Newchannel" AMI event
   ↓
4. Backend AMI client receives event
   ↓
5. Backend creates call record in memory
   ↓
6. Backend broadcasts "call_new" via WebSocket
   ↓
7. Frontend receives update and displays in real-time
   ↓
8. Asterisk plays IVR menu
   ↓
9. Caller selects option
   ↓
10. Asterisk sets IVR variable (triggers VarSet event)
    ↓
11. Backend captures IVR selection
    ↓
12. Backend broadcasts "ivr_update" via WebSocket
    ↓
13. Asterisk routes call to destination
    ↓
14. Call answered (triggers "Newstate" event)
    ↓
15. Backend updates call status to "answered"
    ↓
16. Backend broadcasts "call_update" via WebSocket
    ↓
17. Call in progress...
    ↓
18. Call ends (triggers "Hangup" event)
    ↓
19. Backend calculates duration and revenue
    ↓
20. Backend saves call to MongoDB
    ↓
21. Backend broadcasts "call_ended" via WebSocket
    ↓
22. Frontend updates dashboard with completed call
```

## Component Details

### 1. Asterisk PBX

**Responsibilities:**
- Handle inbound SIP calls
- Execute IVR dialplan
- Route calls to destinations
- Emit AMI events for monitoring

**Configuration Files:**
- `manager.conf` - AMI configuration
- `sip.conf` - SIP trunk and extension settings
- `extensions.conf` - Dialplan and IVR logic

**Ports:**
- 5060 (UDP) - SIP signaling
- 5038 (TCP) - AMI interface
- 10000-20000 (UDP) - RTP media

### 2. Backend Server (Node.js)

**Technology Stack:**
- Node.js v16+
- Express.js - REST API framework
- asterisk-manager - AMI client library
- ws - WebSocket server
- mongoose - MongoDB ODM
- dotenv - Environment configuration

**Key Services:**

#### Asterisk Service (`asteriskService.js`)
- Maintains persistent AMI connection
- Listens for Asterisk events
- Tracks active calls in memory
- Processes call state changes
- Triggers WebSocket broadcasts

#### REST API (`server/routes/`)
- Call management endpoints
- Revenue analytics endpoints
- Query and filter call data
- Hangup control

#### WebSocket Server
- Broadcast real-time updates
- Manage client connections
- Push call events to all connected clients

### 3. Frontend Dashboard (Next.js)

**Technology Stack:**
- Next.js 14
- React 18
- Tailwind CSS - Styling
- Axios - HTTP client
- WebSocket API - Real-time updates
- Recharts - Data visualization
- Moment.js - Date handling

**Pages:**

#### Real-time Dashboard
- Live statistics cards
- Active calls table with real-time updates
- Recent completed calls
- 7-day trend visualization

#### Active Calls View
- Current active calls with details
- Call timeline and events
- IVR selections
- Remote hangup control

#### Revenue Analytics
- Revenue summary cards
- Hourly revenue chart
- Top callers by revenue
- Performance metrics

#### Call History
- Paginated call records
- Advanced filtering
- Detailed call modal
- Search functionality

### 4. Database (MongoDB)

**Collections:**

#### calls
- Stores all call records
- Indexes on: callId, callerNumber, startTime, status
- Call events stored as embedded documents
- IVR data stored as flexible object

**Aggregation Queries:**
- Revenue statistics by date range
- Hourly/daily breakdowns
- Top callers analysis
- Performance metrics

## Security Considerations

1. **AMI Access Control**
   - Restrict AMI port to localhost or trusted IPs
   - Use strong passwords
   - Limit AMI permissions

2. **API Security**
   - Implement authentication (JWT/API keys)
   - Rate limiting
   - Input validation

3. **Database Security**
   - Enable MongoDB authentication
   - Use connection encryption
   - Regular backups

4. **Network Security**
   - Firewall configuration
   - SSL/TLS for web traffic
   - VPN for remote access

## Scalability Considerations

1. **Horizontal Scaling**
   - Multiple frontend instances behind load balancer
   - Multiple backend instances with shared MongoDB
   - Redis for session management and caching

2. **Vertical Scaling**
   - Increase server resources
   - Optimize database indexes
   - Implement connection pooling

3. **Performance Optimization**
   - Database query optimization
   - Caching frequently accessed data
   - WebSocket message batching
   - Lazy loading for frontend components

## Monitoring & Maintenance

1. **System Monitoring**
   - Asterisk call volume and performance
   - Backend server health and memory usage
   - Database performance metrics
   - WebSocket connection count

2. **Logging**
   - Asterisk call logs
   - Backend application logs
   - Error tracking and alerting
   - Audit logs for security

3. **Backup Strategy**
   - Daily MongoDB backups
   - Configuration file backups
   - Disaster recovery plan

## Future Enhancements

1. **Features**
   - Outbound calling support
   - Call recording
   - SMS integration
   - Advanced reporting and analytics
   - Multi-tenant support

2. **Technical Improvements**
   - GraphQL API
   - Server-side rendering optimization
   - Progressive Web App (PWA) support
   - Mobile apps (iOS/Android)
   - API rate limiting and caching

3. **Integration**
   - CRM integration (Salesforce, HubSpot)
   - Payment gateway integration
   - Email notification system
   - Slack/Teams alerts