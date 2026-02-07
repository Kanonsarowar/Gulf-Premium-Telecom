# Gulf Premium Telecom - IPRN System Architecture

## Overview
This document outlines the complete architecture for the Gulf Premium Telecom International Premium Rate Number (IPRN) system, handling IP-to-IP routed inbound calls with DID allocation and routing.

## System Components

### 1. Frontend (Next.js + React)
- **Technology Stack:**
  - Next.js 14+ (App Router)
  - TypeScript
  - Tailwind CSS
  - React Query for API calls
  - Zustand for state management
  - shadcn/ui for components

### 2. Backend API (Node.js)
- **Technology Stack:**
  - Node.js 20+ with Express
  - TypeScript
  - Prisma ORM
  - PostgreSQL database
  - Redis for caching
  - JWT authentication

### 3. Asterisk PBX (Version 18-20)
- **Configuration:**
  - PJSIP for SIP signaling
  - AGI/ARI for call control
  - AMI for monitoring
  - CDR/CEL for call records
  - PostgreSQL for CDR storage

### 4. Database Schema
```
┌─────────────────┐
│  allocation_    │
│  numbers        │◄────┐
└─────────────────┘     │
                        │
┌─────────────────┐     │
│  inbound_       │     │
│  destinations   │─────┘
│  (DIDs)         │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  routing_       │
│  rules          │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  call_detail_   │
│  records        │
└─────────────────┘
```

## Architecture Flow

```
┌──────────────┐
│  SIP Carrier │
│  (Inbound)   │
└──────┬───────┘
       │ SIP INVITE
       │ DID: +966XXXXXXXX
       ▼
┌──────────────────────┐
│  Asterisk PJSIP      │
│  - Endpoint Config   │
│  - Transport UDP     │
│  - ACL Rules         │
└──────┬───────────────┘
       │
       │ Dialplan Entry
       ▼
┌──────────────────────┐
│  extensions.conf     │
│  [from-trunk]        │
│  - DID Lookup        │
│  - AGI Call          │
└──────┬───────────────┘
       │
       │ AGI Script
       ▼
┌──────────────────────┐
│  Node.js AGI Server  │
│  - Query DB          │
│  - Get Routing       │
│  - Return Dest       │
└──────┬───────────────┘
       │
       │ Database Query
       ▼
┌──────────────────────┐
│  PostgreSQL          │
│  - allocation_numbers│
│  - inbound_dests     │
│  - routing_rules     │
└──────┬───────────────┘
       │
       │ Routing Decision
       ▼
┌──────────────────────┐
│  Asterisk Dial()     │
│  - SIP/Provider/XXX  │
│  - Queue()           │
│  - IVR               │
└──────┬───────────────┘
       │
       ▼ Call Completes
┌──────────────────────┐
│  CDR/CEL Recording   │
│  - PostgreSQL        │
│  - Billing Data      │
└──────────────────────┘
```

## Network Architecture

### Production Environment (Saudi Arabia → Asia/MENA)

```
Internet
   │
   ▼
┌──────────────┐
│   Firewall   │ UDP 5060, 10000-20000
│   (iptables) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Public IP   │ (Dedicated for Asterisk)
│  or SBC      │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Asterisk PBX        │
│  - PJSIP on 5060     │
│  - RTP 10000-20000   │
│  - AMI on 5038       │
└──────┬───────────────┘
       │ AGI/ARI
       ▼
┌──────────────────────┐
│  Application Server  │
│  - Node.js API       │
│  - AGI Server        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  PostgreSQL + Redis  │
└──────────────────────┘
```

## Security Considerations

1. **SIP Security:**
   - IP-based authentication (no registration)
   - ACL whitelist for carrier IPs
   - Fail2ban for brute force protection
   - TLS for SIP signaling (optional)

2. **RTP Security:**
   - SRTP encryption (if supported by carrier)
   - RTP timeout detection
   - One-way audio prevention via NAT configuration

3. **API Security:**
   - JWT token authentication
   - Rate limiting
   - CORS configuration
   - SQL injection prevention via Prisma

4. **Database Security:**
   - Encrypted connections
   - Read-only user for AGI scripts
   - Regular backups
   - Audit logging

## Scalability

### Current Design (Up to 1000 concurrent calls):
- Single Asterisk server
- PostgreSQL with connection pooling
- Redis for session caching

### Future Scaling (1000+ calls):
- Multiple Asterisk servers with DNS load balancing
- PostgreSQL read replicas
- Redis Cluster
- Separate AGI server cluster
- CDN for static frontend assets

## Monitoring & Alerts

1. **Asterisk Monitoring:**
   - AMI events via Asternic Call Center
   - Channel count alerts
   - SIP trunk status
   - RTP quality metrics

2. **Application Monitoring:**
   - API response times
   - Database query performance
   - Error rate tracking
   - CDR processing delays

3. **System Monitoring:**
   - CPU/Memory usage
   - Network bandwidth
   - Disk I/O
   - Port availability (5060, 10000-20000)

## Call Flow Example

**Scenario:** Carrier sends call to allocated number

1. **Inbound SIP INVITE:**
   ```
   INVITE sip:+966501234567@pbx.gulfpremium.com SIP/2.0
   From: <sip:+1234567890@carrier.com>
   To: <sip:+966501234567@pbx.gulfpremium.com>
   ```

2. **Asterisk receives call in `from-trunk` context**

3. **AGI script queries database:**
   ```sql
   SELECT d.destination_number, d.routing_type, r.action
   FROM allocation_numbers a
   JOIN inbound_destinations d ON a.destination_id = d.id
   JOIN routing_rules r ON d.id = r.destination_id
   WHERE a.allocated_number = '+966501234567'
   AND a.status = 'active'
   AND r.status = 'active'
   ORDER BY r.priority ASC
   LIMIT 1;
   ```

4. **AGI returns routing decision to Asterisk**

5. **Asterisk executes Dial() or Queue() based on routing type**

6. **CDR record saved to database for billing and reporting**

## File Structure

```
gulf-premium-telecom/
├── asterisk/
│   ├── pjsip.conf
│   ├── extensions.conf
│   ├── cdr_pgsql.conf
│   ├── manager.conf
│   └── rtp.conf
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── agi/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md
    ├── ASTERISK_SETUP.md
    └── DATABASE_SCHEMA.md
```

## Technology Justification

### Why Next.js?
- Server-side rendering for better SEO
- API routes for lightweight backend
- TypeScript support
- Great developer experience
- Modern React features

### Why PostgreSQL?
- ACID compliance for billing accuracy
- JSON support for flexible data
- Excellent performance for CDR queries
- Native support in Asterisk
- Advanced indexing capabilities

### Why PJSIP over chan_sip?
- Better performance (less CPU)
- More secure
- Better NAT handling
- Modern SIP stack
- Official Asterisk recommendation

### Why Node.js for AGI?
- Fast non-blocking I/O
- Easy integration with database
- Good performance for I/O operations
- Large ecosystem
- Same language as frontend (TypeScript)

## Performance Targets

- **Call Setup Time:** < 500ms
- **DID Lookup:** < 50ms
- **API Response:** < 200ms
- **CDR Write:** < 100ms
- **Concurrent Calls:** 1000+
- **CPS (Calls Per Second):** 50+
- **Uptime:** 99.9%

## Cost Estimation (Monthly)

### Infrastructure:
- Dedicated Server (16 CPU, 32GB RAM): $200-300
- PostgreSQL managed DB: $100-150
- Redis managed cache: $30-50
- Bandwidth (1TB): $50-100
- Monitoring tools: $50-100

**Total Infrastructure:** ~$500-700/month

### Development (One-time):
- Initial setup: 2-3 weeks
- Testing & optimization: 1 week
- Documentation: 1 week

**Total Development:** 4-5 weeks
