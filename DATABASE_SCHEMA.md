# Database Schema Design

## Overview
This schema is designed for high-performance DID allocation and routing with accurate CDR tracking for a carrier-grade VoIP environment.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     allocation_numbers                       │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ allocated_number      VARCHAR(20) UNIQUE NOT NULL            │
│ destination_id        UUID REFERENCES inbound_destinations   │
│ customer_id           UUID REFERENCES customers              │
│ status               VARCHAR(20) DEFAULT 'active'            │
│ allocated_at         TIMESTAMP DEFAULT NOW()                 │
│ expires_at           TIMESTAMP NULL                          │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
│ updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ (Many-to-One)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   inbound_destinations                       │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ destination_number    VARCHAR(20) NOT NULL                   │
│ destination_name      VARCHAR(100)                           │
│ routing_type         VARCHAR(20) NOT NULL                    │
│ country_code         VARCHAR(5)                              │
│ area_code            VARCHAR(10)                             │
│ trunk_id             UUID REFERENCES sip_trunks              │
│ status               VARCHAR(20) DEFAULT 'active'            │
│ max_channels         INTEGER DEFAULT 10                      │
│ current_channels     INTEGER DEFAULT 0                       │
│ metadata             JSONB                                   │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
│ updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ (One-to-Many)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      routing_rules                           │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ destination_id        UUID REFERENCES inbound_destinations   │
│ priority             INTEGER DEFAULT 10                      │
│ action               VARCHAR(20) NOT NULL                    │
│ action_data          JSONB NOT NULL                          │
│ conditions           JSONB                                   │
│ time_based           BOOLEAN DEFAULT false                   │
│ schedule             JSONB                                   │
│ status               VARCHAR(20) DEFAULT 'active'            │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
│ updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        customers                             │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ company_name         VARCHAR(200) NOT NULL                   │
│ contact_name         VARCHAR(100)                            │
│ email                VARCHAR(100) UNIQUE NOT NULL            │
│ phone                VARCHAR(20)                             │
│ country              VARCHAR(50)                             │
│ billing_cycle        VARCHAR(20) DEFAULT 'monthly'           │
│ credit_limit         DECIMAL(10,2) DEFAULT 0.00              │
│ current_balance      DECIMAL(10,2) DEFAULT 0.00              │
│ status               VARCHAR(20) DEFAULT 'active'            │
│ metadata             JSONB                                   │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
│ updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        sip_trunks                            │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ trunk_name           VARCHAR(100) UNIQUE NOT NULL            │
│ provider_name        VARCHAR(100)                            │
│ sip_server           VARCHAR(100) NOT NULL                   │
│ sip_port             INTEGER DEFAULT 5060                    │
│ protocol             VARCHAR(10) DEFAULT 'UDP'               │
│ auth_type            VARCHAR(20) DEFAULT 'IP'                │
│ allowed_ips          TEXT[]                                  │
│ codec_priority       TEXT[] DEFAULT '{ulaw,alaw,g729}'       │
│ max_channels         INTEGER DEFAULT 100                     │
│ cps_limit            INTEGER DEFAULT 10                      │
│ status               VARCHAR(20) DEFAULT 'active'            │
│ metadata             JSONB                                   │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
│ updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   call_detail_records                        │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ uniqueid             VARCHAR(32) UNIQUE NOT NULL             │
│ linkedid             VARCHAR(32)                             │
│ allocated_number     VARCHAR(20)                             │
│ destination_number   VARCHAR(20)                             │
│ caller_id            VARCHAR(20)                             │
│ caller_name          VARCHAR(100)                            │
│ start_time           TIMESTAMP NOT NULL                      │
│ answer_time          TIMESTAMP                               │
│ end_time             TIMESTAMP                               │
│ duration             INTEGER DEFAULT 0                       │
│ billsec              INTEGER DEFAULT 0                       │
│ disposition          VARCHAR(20)                             │
│ hangup_cause         VARCHAR(50)                             │
│ trunk_id             UUID REFERENCES sip_trunks              │
│ customer_id          UUID REFERENCES customers               │
│ recording_file       VARCHAR(255)                            │
│ cost_per_minute      DECIMAL(10,4)                           │
│ total_cost           DECIMAL(10,2)                           │
│ metadata             JSONB                                   │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      rate_cards                              │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ rate_name            VARCHAR(100) NOT NULL                   │
│ destination_prefix   VARCHAR(20) NOT NULL                    │
│ destination_name     VARCHAR(100)                            │
│ rate_per_minute      DECIMAL(10,4) NOT NULL                  │
│ connection_fee       DECIMAL(10,4) DEFAULT 0.0000            │
│ billing_increment    INTEGER DEFAULT 60                      │
│ min_duration         INTEGER DEFAULT 0                       │
│ effective_date       DATE NOT NULL                           │
│ expiry_date          DATE                                    │
│ customer_id          UUID REFERENCES customers               │
│ status               VARCHAR(20) DEFAULT 'active'            │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
│ updated_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    system_audit_logs                         │
├─────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                       │
│ user_id              UUID                                    │
│ action               VARCHAR(50) NOT NULL                    │
│ entity_type          VARCHAR(50)                             │
│ entity_id            UUID                                    │
│ old_values           JSONB                                   │
│ new_values           JSONB                                   │
│ ip_address           INET                                    │
│ user_agent           TEXT                                    │
│ created_at           TIMESTAMP DEFAULT NOW()                 │
└─────────────────────────────────────────────────────────────┘
```

## Table Descriptions

### 1. allocation_numbers
Stores the allocated phone numbers that customers use for their services.

**Key Features:**
- Each allocation links to a backend destination
- Supports expiration dates for temporary allocations
- Status tracking (active, suspended, expired)

**Example Data:**
```sql
INSERT INTO allocation_numbers VALUES
('550e8400-e29b-41d4-a716-446655440000', '+966501234567', 
 'destination-uuid', 'customer-uuid', 'active', NOW(), NULL, NOW(), NOW());
```

### 2. inbound_destinations
Backend DID numbers that receive the routed calls.

**Key Features:**
- Links to SIP trunks for outbound routing
- Channel management (max and current)
- Flexible metadata for custom attributes
- Routing types: 'direct', 'queue', 'ivr', 'conference', 'external'

**Example Data:**
```sql
INSERT INTO inbound_destinations VALUES
('dest-uuid-001', '+14155551234', 'US Support Line', 'queue', 
 '1', '415', 'trunk-uuid-001', 'active', 10, 0, 
 '{"queue_name": "support", "timeout": 300}', NOW(), NOW());
```

### 3. routing_rules
Defines how calls to destinations should be handled.

**Key Features:**
- Priority-based routing (lower number = higher priority)
- Conditional routing based on caller, time, etc.
- Time-based scheduling support
- Actions: 'dial', 'queue', 'ivr', 'hangup', 'voicemail'

**Example action_data:**
```json
{
  "action": "queue",
  "queue_name": "sales",
  "timeout": 300,
  "announce": "custom/welcome",
  "overflow": "voicemail"
}
```

**Example conditions:**
```json
{
  "caller_id_prefix": ["+1", "+44"],
  "time_range": "09:00-17:00",
  "weekdays": [1,2,3,4,5]
}
```

### 4. customers
Customer/client information for billing and management.

**Key Features:**
- Credit limit management
- Balance tracking
- Flexible metadata for custom fields

### 5. sip_trunks
SIP trunk configurations for outbound routing.

**Key Features:**
- IP-based authentication
- ACL with allowed IPs
- Codec priority settings
- CPS limiting

**Example Data:**
```sql
INSERT INTO sip_trunks VALUES
('trunk-uuid-001', 'Premium_KSA_Trunk', 'Saudi Telecom',
 '203.0.113.10', 5060, 'UDP', 'IP', 
 ARRAY['203.0.113.0/24', '198.51.100.0/24'],
 ARRAY['ulaw','alaw','g729'], 100, 10, 'active', 
 '{"quality": "premium", "region": "KSA"}', NOW(), NOW());
```

### 6. call_detail_records
Complete call records for billing and analytics.

**Key Features:**
- Asterisk uniqueid for correlation
- Duration and billsec tracking
- Cost calculation
- Recording file paths
- Comprehensive metadata

**Disposition values:**
- ANSWERED
- NO ANSWER
- BUSY
- FAILED
- CONGESTION

### 7. rate_cards
Pricing information for different destinations.

**Key Features:**
- Prefix-based matching
- Per-minute rates
- Connection fees
- Billing increment support
- Customer-specific rates

**Example Data:**
```sql
INSERT INTO rate_cards VALUES
('rate-uuid-001', 'KSA Mobile Premium', '9665', 'Saudi Arabia Mobile',
 0.0450, 0.0100, 60, 0, '2024-01-01', NULL, 
 'customer-uuid', 'active', NOW(), NOW());
```

### 8. system_audit_logs
Comprehensive audit trail for compliance.

**Key Features:**
- Tracks all system changes
- Before/after values
- IP and user agent tracking

## Indexes for Performance

```sql
-- allocation_numbers
CREATE INDEX idx_allocation_numbers_number ON allocation_numbers(allocated_number);
CREATE INDEX idx_allocation_numbers_dest ON allocation_numbers(destination_id);
CREATE INDEX idx_allocation_numbers_status ON allocation_numbers(status);
CREATE INDEX idx_allocation_numbers_customer ON allocation_numbers(customer_id);

-- inbound_destinations
CREATE INDEX idx_inbound_dest_number ON inbound_destinations(destination_number);
CREATE INDEX idx_inbound_dest_status ON inbound_destinations(status);
CREATE INDEX idx_inbound_dest_trunk ON inbound_destinations(trunk_id);

-- routing_rules
CREATE INDEX idx_routing_dest_priority ON routing_rules(destination_id, priority);
CREATE INDEX idx_routing_status ON routing_rules(status);

-- call_detail_records
CREATE INDEX idx_cdr_uniqueid ON call_detail_records(uniqueid);
CREATE INDEX idx_cdr_allocated_number ON call_detail_records(allocated_number);
CREATE INDEX idx_cdr_start_time ON call_detail_records(start_time);
CREATE INDEX idx_cdr_customer ON call_detail_records(customer_id);
CREATE INDEX idx_cdr_disposition ON call_detail_records(disposition);
CREATE INDEX idx_cdr_trunk ON call_detail_records(trunk_id);

-- rate_cards
CREATE INDEX idx_rate_prefix ON rate_cards(destination_prefix);
CREATE INDEX idx_rate_customer ON rate_cards(customer_id);
CREATE INDEX idx_rate_dates ON rate_cards(effective_date, expiry_date);

-- sip_trunks
CREATE INDEX idx_trunk_name ON sip_trunks(trunk_name);
CREATE INDEX idx_trunk_status ON sip_trunks(status);

-- audit_logs
CREATE INDEX idx_audit_entity ON system_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON system_audit_logs(created_at);
```

## Views for Common Queries

```sql
-- Active allocations with routing
CREATE VIEW v_active_allocations AS
SELECT 
    a.allocated_number,
    a.status as allocation_status,
    d.destination_number,
    d.routing_type,
    d.destination_name,
    r.action,
    r.action_data,
    r.priority,
    c.company_name,
    c.email
FROM allocation_numbers a
JOIN inbound_destinations d ON a.destination_id = d.id
LEFT JOIN routing_rules r ON d.id = r.destination_id AND r.status = 'active'
LEFT JOIN customers c ON a.customer_id = c.id
WHERE a.status = 'active'
  AND d.status = 'active'
ORDER BY a.allocated_number, r.priority;

-- Call statistics by customer
CREATE VIEW v_customer_call_stats AS
SELECT 
    c.id as customer_id,
    c.company_name,
    COUNT(cdr.id) as total_calls,
    COUNT(CASE WHEN cdr.disposition = 'ANSWERED' THEN 1 END) as answered_calls,
    SUM(cdr.duration) as total_duration,
    SUM(cdr.billsec) as total_billsec,
    SUM(cdr.total_cost) as total_cost,
    DATE(cdr.start_time) as call_date
FROM customers c
LEFT JOIN call_detail_records cdr ON c.id = cdr.customer_id
GROUP BY c.id, c.company_name, DATE(cdr.start_time);

-- Trunk utilization
CREATE VIEW v_trunk_utilization AS
SELECT 
    t.trunk_name,
    t.provider_name,
    t.max_channels,
    COUNT(CASE WHEN cdr.disposition = 'ANSWERED' THEN 1 END) as active_calls,
    AVG(cdr.duration) as avg_duration,
    t.status
FROM sip_trunks t
LEFT JOIN call_detail_records cdr ON t.id = cdr.trunk_id
  AND cdr.end_time > NOW() - INTERVAL '5 minutes'
GROUP BY t.id, t.trunk_name, t.provider_name, t.max_channels, t.status;
```

## Sample Queries

### 1. Find routing for an allocated number (AGI script uses this)
```sql
SELECT 
    d.destination_number,
    d.routing_type,
    r.action,
    r.action_data,
    r.priority
FROM allocation_numbers a
JOIN inbound_destinations d ON a.destination_id = d.id
LEFT JOIN routing_rules r ON d.id = r.destination_id
WHERE a.allocated_number = $1
  AND a.status = 'active'
  AND d.status = 'active'
  AND (r.status IS NULL OR r.status = 'active')
ORDER BY r.priority ASC
LIMIT 1;
```

### 2. Get available numbers for allocation
```sql
SELECT allocated_number
FROM allocation_numbers
WHERE status = 'available'
  AND (expires_at IS NULL OR expires_at > NOW())
  AND destination_id IS NULL
ORDER BY allocated_number
LIMIT 100;
```

### 3. Calculate billing for a customer
```sql
SELECT 
    c.company_name,
    DATE(cdr.start_time) as call_date,
    COUNT(*) as total_calls,
    SUM(cdr.billsec) as total_seconds,
    SUM(cdr.total_cost) as total_cost
FROM call_detail_records cdr
JOIN customers c ON cdr.customer_id = c.id
WHERE cdr.start_time >= DATE_TRUNC('month', NOW())
  AND cdr.disposition = 'ANSWERED'
GROUP BY c.id, c.company_name, DATE(cdr.start_time)
ORDER BY call_date DESC;
```

### 4. Real-time trunk status
```sql
SELECT 
    t.trunk_name,
    t.max_channels,
    d.current_channels,
    t.status
FROM sip_trunks t
LEFT JOIN inbound_destinations d ON t.id = d.trunk_id
WHERE t.status = 'active'
ORDER BY t.trunk_name;
```

## Triggers for Automation

```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_allocation_numbers_updated
    BEFORE UPDATE ON allocation_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Apply to all tables...
CREATE TRIGGER tr_inbound_destinations_updated
    BEFORE UPDATE ON inbound_destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Log allocation changes
CREATE OR REPLACE FUNCTION log_allocation_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_audit_logs (
        action, entity_type, entity_id, old_values, new_values, created_at
    ) VALUES (
        TG_OP, 'allocation_numbers', NEW.id,
        row_to_json(OLD), row_to_json(NEW), NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_allocation_audit
    AFTER INSERT OR UPDATE OR DELETE ON allocation_numbers
    FOR EACH ROW
    EXECUTE FUNCTION log_allocation_changes();
```

## Partitioning Strategy (for high volume)

```sql
-- Partition CDR table by month
CREATE TABLE call_detail_records (
    -- ... columns ...
) PARTITION BY RANGE (start_time);

CREATE TABLE cdr_2024_01 PARTITION OF call_detail_records
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE cdr_2024_02 PARTITION OF call_detail_records
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add partitions monthly via cron job
```

## Database Connection Settings

```ini
# PostgreSQL configuration for high performance

# Connection pooling (adjust based on load)
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 50MB

# Write-ahead log
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB

# Query optimization
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Logging for debugging
log_min_duration_statement = 1000  # Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```
