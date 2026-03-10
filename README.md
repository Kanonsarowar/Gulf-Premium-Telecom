# Gulf Premium Telecom - IPRN System

**International Premium Rate Number (IPRN) Management System**

A comprehensive telecom application for managing DID allocations, inbound call routing, and call analytics built on Asterisk PBX, Node.js, and Next.js.

## 🚀 Features

- **Number Allocation Management**: Allocate and manage phone numbers for customers
- **Dynamic Call Routing**: Route inbound calls based on DID with flexible rules
- **Real-time Call Analytics**: Monitor calls, channels, and system performance
- **Customer Management**: Multi-tenant customer portal with billing
- **CDR & Reporting**: Comprehensive call detail records and analytics
- **Queue Management**: Advanced call queue with priority routing
- **IVR Support**: Interactive Voice Response menus
- **Rate Card Management**: Flexible pricing for different destinations
- **Asterisk Integration**: Native PJSIP integration with AGI server
- **RESTful API**: Complete API for all operations
- **Modern UI**: Beautiful, responsive admin dashboard

## 📋 Technology Stack

| Component | Technology |
|-----------|-----------|
| **PBX** | Asterisk 18-20 (PJSIP) |
| **Backend** | Node.js 20 + Express + TypeScript |
| **Frontend** | Next.js 14 + React 18 + TypeScript |
| **Database** | PostgreSQL 14+ |
| **ORM** | Prisma |
| **Caching** | Redis 7+ |
| **UI** | Tailwind CSS + shadcn/ui |
| **State** | Zustand + React Query |
| **Auth** | NextAuth.js |

## 📁 Project Structure

```
gulf-premium-telecom/
├── asterisk/              # Asterisk configuration files
├── backend/              
│   ├── prisma/           # Database schema
│   ├── src/
│   │   ├── api/          # REST API routes
│   │   ├── agi/          # AGI server for call routing
│   │   ├── services/     # Business logic
│   │   ├── models/       # Data models
│   │   └── utils/        # Utilities
│   └── package.json
├── frontend/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE_SCHEMA.md
    ├── ASTERISK_SETUP.md
    ├── AGI_SERVER.md
    └── TECH_STACK.md
```

## 🔧 Quick Start

### Prerequisites

- Ubuntu 22.04 or Debian 12
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Asterisk 18-20 (will be installed)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/Gulf-Premium-Telecom.git
cd Gulf-Premium-Telecom
```

### 2. Install Asterisk

Follow the detailed guide in `ASTERISK_SETUP.md`:

```bash
# Quick install (detailed steps in docs)
sudo bash asterisk/install_asterisk.sh
```

### 3. Setup Database

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql -c "CREATE DATABASE gulf_premium_telecom;"
sudo -u postgres psql -c "CREATE USER asterisk_api WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gulf_premium_telecom TO asterisk_api;"
```

### 4. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start backend API
npm run dev
```

### 5. Setup AGI Server

```bash
# In another terminal
cd backend
npm run agi:dev
```

### 6. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

### 7. Configure Asterisk

```bash
# Copy configuration files
sudo cp asterisk/*.conf /etc/asterisk/

# Edit with your settings
sudo nano /etc/asterisk/pjsip.conf
sudo nano /etc/asterisk/extensions.conf

# Reload Asterisk
sudo asterisk -rx "core reload"
```

## 🎯 Core Concepts

### Call Flow

```
1. Carrier sends SIP INVITE to DID
2. Asterisk receives call in [from-trunk] context
3. Dialplan calls AGI server for routing
4. AGI queries PostgreSQL for allocation/destination
5. AGI returns routing action (dial/queue/ivr)
6. Asterisk executes routing
7. CDR written to database
```

### Number Allocation

1. **Allocation Number**: Customer-facing number (frontend)
2. **Destination Number**: Backend routing destination (DID)
3. **Routing Rules**: How calls should be handled
   - Direct dial
   - Queue
   - IVR menu
   - Voicemail
   - External routing

### Database Schema

See `DATABASE_SCHEMA.md` for complete schema with:
- allocation_numbers
- inbound_destinations
- routing_rules
- customers
- sip_trunks
- call_detail_records
- rate_cards
- users

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema and queries
- **[ASTERISK_SETUP.md](./ASTERISK_SETUP.md)** - Complete Asterisk configuration
- **[AGI_SERVER.md](./AGI_SERVER.md)** - AGI server implementation
- **[TECH_STACK.md](./TECH_STACK.md)** - Technology stack details

## 🔐 Security

- IP-based SIP authentication (no registration)
- ACL whitelist for carrier IPs
- JWT token authentication for API
- PostgreSQL user permissions
- Redis caching with TTL
- Audit logging for all changes
- Rate limiting on API endpoints

## 📊 Monitoring

### Asterisk CLI

```bash
# Check endpoints
asterisk -rx "pjsip show endpoints"

# Check active calls
asterisk -rx "core show channels verbose"

# Check queue status
asterisk -rx "queue show"

# Enable SIP debugging
asterisk -rx "pjsip set logger on"

# Enable RTP debugging
asterisk -rx "rtp set debug on"
```

### Application Logs

```bash
# Backend logs
tail -f /var/log/gulf-premium-telecom/backend.log

# AGI server logs
journalctl -u gulf-agi -f

# Asterisk logs
tail -f /var/log/asterisk/messages
```

## 🚀 Deployment

### Production Checklist

- [ ] Change all default passwords
- [ ] Set secure JWT_SECRET
- [ ] Configure firewall (ports 5060, 10000-20000)
- [ ] Setup SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts
- [ ] Configure log rotation
- [ ] Test failover scenarios
- [ ] Load test with SIPp
- [ ] Document disaster recovery

### Systemd Services

```bash
# Backend API
sudo systemctl enable gulf-api
sudo systemctl start gulf-api

# AGI Server
sudo systemctl enable gulf-agi
sudo systemctl start gulf-agi

# Asterisk
sudo systemctl enable asterisk
sudo systemctl start asterisk
```

## 🧪 Testing

### Test DID Allocation

```bash
curl -X POST http://localhost:3001/api/allocations \
  -H "Content-Type: application/json" \
  -d '{
    "allocatedNumber": "+966501234567",
    "destinationId": "dest-uuid",
    "customerId": "customer-uuid"
  }'
```

### Test Routing Query

```bash
# Query AGI server
telnet localhost 4573
# Send: allocated number +966501234567
```

### Test Call Flow

```bash
# Originate test call from Asterisk CLI
asterisk -rx "channel originate PJSIP/+966501234567@premium-ksa-trunk application Playback demo-congrats"
```

## 📈 Performance

### Target Metrics

- **Call Setup Time**: < 500ms
- **DID Lookup**: < 50ms
- **API Response**: < 200ms
- **Concurrent Calls**: 1000+
- **CPS (Calls Per Second)**: 50+
- **Uptime**: 99.9%

### Optimization Tips

1. **Database**: Use connection pooling, proper indexes
2. **Redis**: Cache routing decisions (5min TTL)
3. **Asterisk**: Disable unnecessary modules
4. **Network**: Use same codec end-to-end (avoid transcoding)
5. **Monitoring**: Set up Grafana + Prometheus

## 🤝 Contributing

This is a proprietary project for Gulf Premium Telecom. For internal development:

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Write tests for new features
4. Submit PR with detailed description
5. Wait for code review
6. Merge after approval

## 📄 License

Proprietary - Gulf Premium Telecom © 2024

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Internal Wiki**: [Company Confluence]
- **Email**: dev-team@gulfpremium.com
- **Slack**: #gulf-iprn-support

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Database schema design
- [x] Asterisk configuration
- [x] AGI server implementation
- [ ] Basic API endpoints
- [ ] Frontend dashboard

### Phase 2
- [ ] User authentication
- [ ] Customer portal
- [ ] Real-time analytics
- [ ] Call recording playback
- [ ] SMS notifications

### Phase 3
- [ ] Advanced reporting
- [ ] Fraud detection
- [ ] API rate limiting
- [ ] Multi-region support
- [ ] Mobile app

## 📞 Call Flow Example

```
┌─────────────┐
│ Carrier     │ SIP INVITE +966501234567
│             │─────────────────────────────┐
└─────────────┘                             │
                                            ▼
                                ┌────────────────────┐
                                │ Asterisk PJSIP     │
                                │ [from-trunk]       │
                                └────────┬───────────┘
                                         │
                                         │ AGI Call
                                         ▼
                                ┌────────────────────┐
                                │ AGI Server         │
                                │ (Node.js)          │
                                └────────┬───────────┘
                                         │
                                         │ DB Query
                                         ▼
                                ┌────────────────────┐
                                │ PostgreSQL         │
                                │ allocation_numbers │
                                └────────┬───────────┘
                                         │
                                         │ Return: Queue(sales)
                                         ▼
                                ┌────────────────────┐
                                │ Asterisk           │
                                │ Queue(sales)       │
                                └────────┬───────────┘
                                         │
                                         │ Answer
                                         ▼
                                ┌────────────────────┐
                                │ Agent              │
                                │ Answers Call       │
                                └────────────────────┘
```

## 🎓 Learning Resources

- Asterisk Docs: https://docs.asterisk.org
- PJSIP: https://docs.asterisk.org/Configuration/Channel-Drivers/SIP/Configuring-res_pjsip/
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- TypeScript: https://www.typescriptlang.org/docs/

---

**Built with ❤️ for Gulf Premium Telecom**
