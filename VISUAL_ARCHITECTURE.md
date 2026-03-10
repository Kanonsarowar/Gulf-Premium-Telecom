# Gulf Premium Telecom - Visual Architecture Guide

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Gulf Premium Telecom IPRN System                 │
│                     Carrier-Grade VoIP Platform                      │
└─────────────────────────────────────────────────────────────────────┘

                           ┌──────────────┐
                           │   Internet   │
                           │   Carriers   │
                           └──────┬───────┘
                                  │ SIP/RTP
                                  │ Port 5060, 10000-20000
                                  ▼
                    ┌─────────────────────────┐
                    │      Firewall/SBC       │
                    │  - ACL Whitelist        │
                    │  - NAT Traversal        │
                    └────────────┬────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────────┐
         │           Asterisk PBX (Core)                 │
         │  ┌─────────────────────────────────────────┐  │
         │  │         PJSIP Transport Layer           │  │
         │  │  - UDP 5060                             │  │
         │  │  - TLS 5061 (optional)                  │  │
         │  │  - RTP 10000-20000                      │  │
         │  └──────────────────┬──────────────────────┘  │
         │                     │                          │
         │  ┌──────────────────▼──────────────────────┐  │
         │  │      Dialplan Engine                    │  │
         │  │  [from-trunk] context                   │  │
         │  │  - Parse DID                            │  │
         │  │  - Call AGI                             │  │
         │  │  - Execute routing                      │  │
         │  └──────────────────┬──────────────────────┘  │
         │                     │                          │
         │                     │ AGI Call                 │
         │                     │ (agi://127.0.0.1:4573)   │
         └─────────────────────┼──────────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │     AGI Server (Node.js)       │
              │  ┌──────────────────────────┐  │
              │  │  AGI Protocol Handler    │  │
              │  │  - Parse AGI request     │  │
              │  │  - Extract DID           │  │
              │  └────────┬─────────────────┘  │
              │           │                     │
              │  ┌────────▼─────────────────┐  │
              │  │  Routing Logic           │  │
              │  │  - Query PostgreSQL      │  │
              │  │  - Apply rules           │  │
              │  │  - Return action         │  │
              │  └────────┬─────────────────┘  │
              │           │                     │
              │  ┌────────▼─────────────────┐  │
              │  │  Database Connection     │  │
              │  │  - Pool: 20 connections  │  │
              │  │  - Timeout: 2s           │  │
              │  └──────────────────────────┘  │
              └────────────────┬───────────────┘
                               │ SQL Query
                               ▼
         ┌─────────────────────────────────────────┐
         │        PostgreSQL Database              │
         │  ┌───────────────────────────────────┐  │
         │  │   Tables:                         │  │
         │  │   • allocation_numbers            │  │
         │  │   • inbound_destinations          │  │
         │  │   • routing_rules                 │  │
         │  │   • customers                     │  │
         │  │   • sip_trunks                    │  │
         │  │   • call_detail_records           │  │
         │  │   • rate_cards                    │  │
         │  │   • users                         │  │
         │  └───────────────────────────────────┘  │
         │                                          │
         │  Indexes: allocation_number, status      │
         │  Views: v_active_allocations             │
         │  Triggers: auto-update timestamps        │
         └────────────┬───────────────┬─────────────┘
                      │               │
                      │ Read          │ Write
                      ▼               ▼
         ┌─────────────────┐    ┌──────────────────┐
         │  Redis Cache    │    │  Backend API     │
         │  - Routing TTL  │    │  (Express.js)    │
         │  - 5min cache   │    │  - REST API      │
         │  - Session data │    │  - CRUD ops      │
         └─────────────────┘    └────────┬─────────┘
                                         │ HTTP/JSON
                                         ▼
                            ┌──────────────────────────┐
                            │   Frontend (Next.js)     │
                            │  ┌────────────────────┐  │
                            │  │  Dashboard         │  │
                            │  │  - Allocations     │  │
                            │  │  - Destinations    │  │
                            │  │  - Reports         │  │
                            │  │  - Customers       │  │
                            │  └────────────────────┘  │
                            └────────────┬─────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   End Users  │
                                  │   (Browser)  │
                                  └──────────────┘
```

## Call Flow Sequence Diagram

```
Carrier          Asterisk        AGI Server      PostgreSQL      Agent/IVR
  │                 │                │               │              │
  │──SIP INVITE──▶  │                │               │              │
  │ +966501234567   │                │               │              │
  │                 │                │               │              │
  │◀──100 Trying──  │                │               │              │
  │                 │                │               │              │
  │                 │──AGI Request──▶│               │              │
  │                 │  DID:+9665..   │               │              │
  │                 │                │               │              │
  │                 │                │──SQL Query───▶│              │
  │                 │                │  SELECT...    │              │
  │                 │                │               │              │
  │                 │                │◀─Result───────│              │
  │                 │                │  Queue(sales) │              │
  │                 │                │               │              │
  │                 │◀──AGI Reply───│               │              │
  │                 │  Action:queue  │               │              │
  │                 │  Dest:sales    │               │              │
  │                 │                │               │              │
  │◀──180 Ringing─  │                │               │              │
  │                 │                │               │              │
  │                 │───────Queue(sales)───────────────────────────▶│
  │                 │                │               │              │
  │◀──200 OK───────│◀────────Agent Answers Call─────────────────────│
  │                 │                │               │              │
  │◀──RTP Audio────│◀────────Two-way Audio──────────────────────────│
  │──RTP Audio────▶│─────────────────────────────────────────────▶  │
  │                 │                │               │              │
  │                 │                │               │              │
  │──BYE──────────▶ │                │               │              │
  │                 │                │               │              │
  │                 │──CDR Write────────────────────▶│              │
  │                 │                │               │              │
  │◀──200 OK───────│                │               │              │
  │                 │                │               │              │
```

## Database Relationship Diagram

```
┌─────────────────────┐
│     Customers       │
│  ─────────────────  │
│  • id (PK)          │
│  • company_name     │
│  • email            │
│  • credit_limit     │
│  • current_balance  │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐         ┌──────────────────────┐
│ AllocationNumbers   │    N:1  │ InboundDestinations  │
│  ─────────────────  │─────────│  ──────────────────  │
│  • id (PK)          │         │  • id (PK)           │
│  • allocated_number │         │  • destination_num   │
│  • destination_id   │────────▶│  • routing_type      │
│  • customer_id (FK) │         │  • trunk_id (FK)     │
│  • status           │         │  • max_channels      │
└─────────────────────┘         └───────┬──────────────┘
                                        │
                                        │ 1:N
                                        ▼
                               ┌─────────────────────┐
                               │   RoutingRules      │
                               │  ─────────────────  │
                               │  • id (PK)          │
                               │  • destination_id   │
                               │  • priority         │
                               │  • action           │
                               │  • action_data      │
                               └─────────────────────┘

┌─────────────────────┐
│     SipTrunks       │         ┌──────────────────────┐
│  ─────────────────  │    1:N  │ CallDetailRecords    │
│  • id (PK)          │────────▶│  ──────────────────  │
│  • trunk_name       │         │  • uniqueid (PK)     │
│  • sip_server       │         │  • allocated_number  │
│  • allowed_ips      │         │  • start_time        │
│  • max_channels     │         │  • duration          │
└─────────────────────┘         │  • disposition       │
                                │  • total_cost        │
                                └──────────────────────┘

┌─────────────────────┐
│     RateCards       │
│  ─────────────────  │
│  • id (PK)          │
│  • destination_pfx  │
│  • rate_per_minute  │
│  • customer_id (FK) │
└─────────────────────┘
```

## Network Topology Diagram

```
                          INTERNET
                              │
                              │
                    ┌─────────▼─────────┐
                    │   Public IP       │
                    │   x.x.x.x         │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                 FIREWALL                  │
        │  ┌──────────────────────────────────┐    │
        │  │ Rules:                           │    │
        │  │ • Allow 5060/UDP (SIP)           │    │
        │  │ • Allow 10000-20000/UDP (RTP)    │    │
        │  │ • Allow 80,443/TCP (Web)         │    │
        │  │ • Allow 22/TCP (SSH - restricted)│    │
        │  └──────────────────────────────────┘    │
        └────────────────────┬──────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │         Internal Network                │
        │         10.0.0.0/24                     │
        └──┬─────────┬──────────┬─────────┬───────┘
           │         │          │         │
    ┌──────▼───┐ ┌──▼────┐ ┌───▼───┐ ┌──▼─────┐
    │Asterisk  │ │Backend│ │  DB   │ │ Redis  │
    │10.0.0.10 │ │.0.20  │ │ .0.30 │ │ .0.40  │
    │          │ │       │ │       │ │        │
    │Port 5060 │ │:3001  │ │:5432  │ │:6379   │
    │AGI :4573 │ │       │ │       │ │        │
    └──────────┘ └───────┘ └───────┘ └────────┘
```

## Component Interaction Matrix

```
┌──────────────┬─────────┬─────────┬──────────┬─────────┬─────────┐
│ Component    │Asterisk │   AGI   │Database  │ Backend │Frontend │
├──────────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Asterisk     │    -    │ TCP 4573│PostgreSQL│    -    │    -    │
│              │         │         │CDR write │         │         │
├──────────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ AGI Server   │Receives │    -    │SQL read  │    -    │    -    │
│              │requests │         │routing   │         │         │
├──────────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Database     │CDR data │Routing  │    -     │All CRUD │    -    │
│              │         │queries  │          │ops      │         │
├──────────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Backend API  │    -    │    -    │Prisma ORM│    -    │REST API │
│              │         │         │          │         │JSON     │
├──────────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Frontend     │    -    │    -    │    -     │HTTP     │    -    │
│              │         │         │          │requests │         │
└──────────────┴─────────┴─────────┴──────────┴─────────┴─────────┘
```

## Data Flow: Number Allocation to Call

```
STEP 1: Admin Allocates Number
┌──────────────┐
│   Frontend   │
│  (Browser)   │
└──────┬───────┘
       │ POST /api/allocations
       │ {
       │   allocatedNumber: "+966501234567",
       │   destinationId: "uuid",
       │   customerId: "uuid"
       │ }
       ▼
┌──────────────┐
│  Backend API │
└──────┬───────┘
       │ INSERT INTO allocation_numbers
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────────────┘

STEP 2: Inbound Call Arrives
┌──────────────┐
│   Carrier    │
└──────┬───────┘
       │ SIP INVITE +966501234567
       ▼
┌──────────────┐
│   Asterisk   │
└──────┬───────┘
       │ AGI(agi://127.0.0.1:4573)
       ▼
┌──────────────┐
│  AGI Server  │
└──────┬───────┘
       │ SELECT * FROM allocation_numbers
       │ WHERE allocated_number = '+966501234567'
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────┬───────┘
       │ Returns: destination_id, routing_rules
       ▼
┌──────────────┐
│  AGI Server  │
└──────┬───────┘
       │ SET VARIABLE ROUTING_ACTION "queue"
       │ SET VARIABLE ROUTING_DESTINATION "sales"
       ▼
┌──────────────┐
│   Asterisk   │
│ Queue(sales) │
└──────────────┘

STEP 3: CDR Written
┌──────────────┐
│   Asterisk   │
└──────┬───────┘
       │ INSERT INTO call_detail_records
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────┬───────┘
       │ Trigger: calculate_cost()
       ▼
┌──────────────┐
│  Rate Card   │
│   Matched    │
└──────────────┘

STEP 4: Dashboard Updated
┌──────────────┐
│  PostgreSQL  │
└──────┬───────┘
       │ SELECT COUNT(*) FROM call_detail_records
       │ WHERE DATE(start_time) = TODAY()
       ▼
┌──────────────┐
│  Backend API │
└──────┬───────┘
       │ GET /api/reports/daily
       ▼
┌──────────────┐
│   Frontend   │
│   Dashboard  │
└──────────────┘
```

## Deployment Architecture Options

### Option 1: Single Server (Up to 500 calls)
```
┌─────────────────────────────────────────┐
│         Single Physical Server          │
│  ┌───────────────────────────────────┐  │
│  │ Asterisk + AGI + API + DB + Web   │  │
│  │ Ubuntu 22.04 LTS                  │  │
│  │ 8 CPU, 16GB RAM, 200GB SSD        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Option 2: Distributed (Up to 2000 calls)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Asterisk 1  │  │  Asterisk 2  │  │  Asterisk 3  │
│  + AGI       │  │  + AGI       │  │  + AGI       │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Load Balancer   │
              │  (DNS Round Rob) │
              └─────────┬────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │Backend 1│    │Backend 2│    │Frontend │
   └────┬────┘    └────┬────┘    └─────────┘
        │              │
        └──────┬───────┘
               │
        ┌──────▼──────┐
        │  PostgreSQL │
        │   Primary   │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  PostgreSQL │
        │  Read Replica│
        └─────────────┘
```

### Option 3: Cloud-Native (Kubernetes)
```
┌────────────────────────────────────────────────┐
│              Kubernetes Cluster                │
│  ┌──────────────────────────────────────────┐  │
│  │  Asterisk Pods (StatefulSet)            │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐              │  │
│  │  │Pod 1│  │Pod 2│  │Pod 3│              │  │
│  │  └─────┘  └─────┘  └─────┘              │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Backend Pods (Deployment)               │  │
│  │  ┌─────┐  ┌─────┐  ┌─────┐              │  │
│  │  │API 1│  │API 2│  │AGI 1│              │  │
│  │  └─────┘  └─────┘  └─────┘              │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Frontend Pods (Deployment)              │  │
│  │  ┌─────┐  ┌─────┐                        │  │
│  │  │Web 1│  │Web 2│                        │  │
│  │  └─────┘  └─────┘                        │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Managed Services                        │  │
│  │  • Cloud SQL (PostgreSQL)                │  │
│  │  • Redis Memorystore                     │  │
│  │  • Cloud Load Balancer                   │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## Performance Optimization Layers

```
                    ┌─────────────────┐
                    │  Request Comes  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
         Layer 1:   │  Redis Cache    │ ← 10ms lookup
                    │  (Routing)      │
                    └────────┬────────┘
                             │ Cache Miss
                             │
                    ┌────────▼────────┐
         Layer 2:   │  Database Query │ ← 50ms lookup
                    │  (with indexes) │
                    └────────┬────────┘
                             │
                             │ Store in cache
                             ▼
                    ┌─────────────────┐
                    │  Return Result  │
                    └─────────────────┘

Total Time:
• Cache Hit:  ~10ms  (90% of requests)
• Cache Miss: ~60ms  (10% of requests)
• Average:    ~15ms  (weighted)
```

## Security Layers

```
┌────────────────────────────────────────────────┐
│ Layer 1: Network Security                      │
│ • Firewall rules (UFW)                         │
│ • ACL whitelist for SIP                        │
│ • VPN for admin access                         │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│ Layer 2: Application Security                  │
│ • JWT tokens (API)                             │
│ • IP-based auth (Asterisk)                     │
│ • Rate limiting                                │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│ Layer 3: Data Security                         │
│ • Bcrypt password hashing                      │
│ • SQL injection prevention (Prisma)            │
│ • Encrypted connections (SSL/TLS)              │
└────────────────┬───────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────┐
│ Layer 4: Audit & Compliance                    │
│ • System audit logs                            │
│ • CDR retention                                │
│ • User action tracking                         │
└────────────────────────────────────────────────┘
```

## Monitoring Stack

```
┌─────────────────────────────────────────────────┐
│              Application Layer                   │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐        │
│  │Asterisk │  │ Backend │  │ Frontend │        │
│  └────┬────┘  └────┬────┘  └────┬─────┘        │
│       │            │            │               │
│       └────────────┼────────────┘               │
│                    │ Metrics/Logs               │
└────────────────────┼────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
    ┌─────▼────┐ ┌──▼─────┐ ┌─▼──────┐
    │ Asternic │ │Grafana │ │ELK Stack│
    │   CC     │ │ +      │ │  or    │
    │          │ │Prometh.│ │ Loki   │
    └──────────┘ └────────┘ └────────┘
         │            │          │
         └────────────┼──────────┘
                      │
              ┌───────▼────────┐
              │   Alerting     │
              │  • Email       │
              │  • Slack       │
              │  • PagerDuty   │
              └────────────────┘
```

---

**This visual guide complements the technical documentation and provides an easy-to-understand overview of the system architecture.**
