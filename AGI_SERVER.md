# AGI Server for DID Routing

## Overview
Node.js-based AGI (Asterisk Gateway Interface) server that handles real-time call routing decisions by querying the PostgreSQL database.

## How It Works

```
Asterisk Call Flow:
1. Inbound SIP call arrives
2. Dialplan executes: AGI(agi://127.0.0.1:4573,routing)
3. AGI server receives request with DID
4. Queries PostgreSQL for routing rules
5. Returns routing action and destination
6. Asterisk executes the routing
```

## Installation

```bash
cd backend
npm install
npm run build
npm run agi:start
```

## AGI Server Code

### File: backend/src/agi/server.ts

```typescript
import net from 'net';
import { Pool } from 'pg';
import { parseAGIRequest, sendAGICommand, AGIRequest } from './agi-utils';

const AGI_PORT = 4573;
const AGI_HOST = '0.0.0.0';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gulf_premium_telecom',
  user: process.env.DB_USER || 'asterisk_agi',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

interface RoutingResult {
  action: string;
  destination: string;
  action_data?: any;
}

/**
 * Query database for routing information
 */
async function getRouting(allocatedNumber: string): Promise<RoutingResult | null> {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        d.destination_number,
        d.routing_type,
        r.action,
        r.action_data,
        r.priority,
        a.customer_id
      FROM allocation_numbers a
      JOIN inbound_destinations d ON a.destination_id = d.id
      LEFT JOIN routing_rules r ON d.id = r.destination_id
      WHERE a.allocated_number = $1
        AND a.status = 'active'
        AND d.status = 'active'
        AND (r.status IS NULL OR r.status = 'active')
      ORDER BY r.priority ASC NULLS LAST
      LIMIT 1
    `;
    
    const result = await client.query(query, [allocatedNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Parse action_data JSON
    let actionData = {};
    if (row.action_data) {
      actionData = typeof row.action_data === 'string' 
        ? JSON.parse(row.action_data) 
        : row.action_data;
    }
    
    // Determine routing action
    let action = row.action || 'dial';
    let destination = row.destination_number;
    
    // Handle different routing types
    if (row.routing_type === 'queue' && actionData.queue_name) {
      action = 'queue';
      destination = actionData.queue_name;
    } else if (row.routing_type === 'ivr' && actionData.ivr_menu) {
      action = 'ivr';
      destination = actionData.ivr_menu;
    } else if (row.routing_type === 'voicemail' && actionData.voicemail_box) {
      action = 'voicemail';
      destination = actionData.voicemail_box;
    }
    
    return {
      action,
      destination,
      action_data: actionData,
    };
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Handle AGI request
 */
async function handleAGIRequest(socket: net.Socket, agiData: AGIRequest) {
  try {
    // Get DID from AGI environment
    const did = agiData.agi_extension || agiData.agi_dnid;
    const callerId = agiData.agi_callerid || 'Unknown';
    const uniqueId = agiData.agi_uniqueid || '';
    
    console.log(`[${uniqueId}] AGI Request - DID: ${did}, Caller: ${callerId}`);
    
    if (!did) {
      console.error(`[${uniqueId}] No DID provided`);
      await sendAGICommand(socket, 'VERBOSE "No DID provided" 1');
      socket.end();
      return;
    }
    
    // Query database for routing
    const routing = await getRouting(did);
    
    if (!routing) {
      console.log(`[${uniqueId}] No routing found for DID: ${did}`);
      await sendAGICommand(socket, 'VERBOSE "No routing found" 1');
      await sendAGICommand(socket, 'SET VARIABLE ROUTING_ACTION ""');
      await sendAGICommand(socket, 'SET VARIABLE ROUTING_DESTINATION ""');
      socket.end();
      return;
    }
    
    // Set Asterisk variables
    console.log(`[${uniqueId}] Routing found - Action: ${routing.action}, Dest: ${routing.destination}`);
    
    await sendAGICommand(socket, `VERBOSE "Routing: ${routing.action} to ${routing.destination}" 1`);
    await sendAGICommand(socket, `SET VARIABLE ROUTING_ACTION "${routing.action}"`);
    await sendAGICommand(socket, `SET VARIABLE ROUTING_DESTINATION "${routing.destination}"`);
    
    // Set additional data if needed
    if (routing.action_data) {
      const jsonData = JSON.stringify(routing.action_data);
      await sendAGICommand(socket, `SET VARIABLE ROUTING_DATA "${jsonData}"`);
    }
    
    socket.end();
  } catch (error) {
    console.error('AGI request handling error:', error);
    socket.end();
  }
}

/**
 * Create AGI server
 */
const server = net.createServer((socket) => {
  console.log('AGI connection established');
  
  let buffer = '';
  let agiData: AGIRequest = {};
  let headersParsed = false;
  
  socket.on('data', async (data) => {
    buffer += data.toString();
    
    if (!headersParsed && buffer.includes('\n\n')) {
      // Parse AGI headers
      agiData = parseAGIRequest(buffer);
      headersParsed = true;
      
      // Handle the request
      await handleAGIRequest(socket, agiData);
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('close', () => {
    console.log('AGI connection closed');
  });
});

// Start server
server.listen(AGI_PORT, AGI_HOST, () => {
  console.log(`AGI Server listening on ${AGI_HOST}:${AGI_PORT}`);
  console.log('Waiting for Asterisk connections...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing AGI server...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing AGI server...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
```

### File: backend/src/agi/agi-utils.ts

```typescript
import { Socket } from 'net';

export interface AGIRequest {
  [key: string]: string;
}

/**
 * Parse AGI request headers
 */
export function parseAGIRequest(data: string): AGIRequest {
  const lines = data.split('\n');
  const agiData: AGIRequest = {};
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      agiData[key.trim()] = value;
    }
  }
  
  return agiData;
}

/**
 * Send AGI command and wait for response
 */
export function sendAGICommand(socket: Socket, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('AGI command timeout'));
    }, 5000);
    
    socket.once('data', (data) => {
      clearTimeout(timeout);
      resolve(data.toString());
    });
    
    socket.write(command + '\n');
  });
}

/**
 * Get AGI variable value from response
 */
export function parseAGIResponse(response: string): { code: number; result: string; value?: string } {
  // Example response: "200 result=1 (hello)"
  const match = response.match(/^(\d{3})\s+result=([^\s]+)(?:\s+\(([^)]+)\))?/);
  
  if (!match) {
    return { code: 0, result: '' };
  }
  
  return {
    code: parseInt(match[1]),
    result: match[2],
    value: match[3],
  };
}
```

### File: backend/src/agi/cdr-handler.ts

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gulf_premium_telecom',
  user: process.env.DB_USER || 'asterisk_cdr',
  password: process.env.DB_PASSWORD,
  max: 10,
});

export interface CDRRecord {
  uniqueid: string;
  linkedid?: string;
  allocated_number: string;
  destination_number: string;
  caller_id: string;
  caller_name?: string;
  start_time: Date;
  answer_time?: Date;
  end_time?: Date;
  duration: number;
  billsec: number;
  disposition: string;
  hangup_cause?: string;
  recording_file?: string;
}

/**
 * Insert or update CDR record
 */
export async function saveCDR(cdr: CDRRecord): Promise<void> {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO call_detail_records (
        uniqueid, linkedid, allocated_number, destination_number,
        caller_id, caller_name, start_time, answer_time, end_time,
        duration, billsec, disposition, hangup_cause, recording_file
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (uniqueid) DO UPDATE SET
        answer_time = EXCLUDED.answer_time,
        end_time = EXCLUDED.end_time,
        duration = EXCLUDED.duration,
        billsec = EXCLUDED.billsec,
        disposition = EXCLUDED.disposition,
        hangup_cause = EXCLUDED.hangup_cause,
        recording_file = EXCLUDED.recording_file
    `;
    
    await client.query(query, [
      cdr.uniqueid,
      cdr.linkedid,
      cdr.allocated_number,
      cdr.destination_number,
      cdr.caller_id,
      cdr.caller_name,
      cdr.start_time,
      cdr.answer_time,
      cdr.end_time,
      cdr.duration,
      cdr.billsec,
      cdr.disposition,
      cdr.hangup_cause,
      cdr.recording_file,
    ]);
    
    console.log(`CDR saved: ${cdr.uniqueid}`);
  } catch (error) {
    console.error('Error saving CDR:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Calculate and update call cost
 */
export async function updateCallCost(uniqueid: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE call_detail_records cdr
      SET 
        cost_per_minute = rc.rate_per_minute,
        total_cost = (
          rc.connection_fee + 
          (CEIL(cdr.billsec::float / rc.billing_increment::float) * 
           rc.billing_increment::float / 60.0 * rc.rate_per_minute)
        )
      FROM rate_cards rc
      WHERE cdr.uniqueid = $1
        AND cdr.customer_id IS NOT NULL
        AND rc.customer_id = cdr.customer_id
        AND cdr.destination_number LIKE rc.destination_prefix || '%'
        AND rc.status = 'active'
        AND rc.effective_date <= cdr.start_time
        AND (rc.expiry_date IS NULL OR rc.expiry_date > cdr.start_time)
      ORDER BY LENGTH(rc.destination_prefix) DESC
      LIMIT 1
    `;
    
    await client.query(query, [uniqueid]);
    console.log(`Call cost updated: ${uniqueid}`);
  } catch (error) {
    console.error('Error updating call cost:', error);
  } finally {
    client.release();
  }
}
```

## Systemd Service Configuration

Create `/etc/systemd/system/gulf-agi.service`:

```ini
[Unit]
Description=Gulf Premium Telecom AGI Server
After=network.target postgresql.service asterisk.service

[Service]
Type=simple
User=asterisk
Group=asterisk
WorkingDirectory=/opt/gulf-premium-telecom/backend
Environment="NODE_ENV=production"
Environment="DB_HOST=localhost"
Environment="DB_PORT=5432"
Environment="DB_NAME=gulf_premium_telecom"
Environment="DB_USER=asterisk_agi"
EnvironmentFile=-/opt/gulf-premium-telecom/backend/.env
ExecStart=/usr/bin/node dist/agi/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable gulf-agi
sudo systemctl start gulf-agi
sudo systemctl status gulf-agi
```

## Testing the AGI Server

### 1. Manual AGI Test

```bash
# Connect to AGI server
telnet localhost 4573

# Send AGI headers (simulate Asterisk)
agi_network: yes
agi_network_script: routing
agi_extension: +966501234567
agi_dnid: +966501234567
agi_callerid: +1234567890
agi_uniqueid: 1234567890.123


# Press Enter twice to send
```

### 2. Test Database Query

```typescript
// File: backend/src/agi/test-routing.ts
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'gulf_premium_telecom',
  user: 'asterisk_agi',
  password: 'your_password',
});

async function testRouting() {
  const did = '+966501234567';
  
  const query = `
    SELECT 
      d.destination_number,
      d.routing_type,
      r.action,
      r.action_data
    FROM allocation_numbers a
    JOIN inbound_destinations d ON a.destination_id = d.id
    LEFT JOIN routing_rules r ON d.id = r.destination_id
    WHERE a.allocated_number = $1
      AND a.status = 'active'
    LIMIT 1
  `;
  
  const result = await pool.query(query, [did]);
  console.log('Routing result:', result.rows[0]);
  
  await pool.end();
}

testRouting().catch(console.error);
```

Run test:
```bash
npm run test:routing
```

## Performance Optimization

### 1. Connection Pooling

The AGI server uses PostgreSQL connection pooling with:
- Max 20 connections
- 30s idle timeout
- 2s connection timeout

### 2. Query Optimization

Ensure proper indexes exist:
```sql
CREATE INDEX IF NOT EXISTS idx_allocation_lookup 
ON allocation_numbers(allocated_number, status);

CREATE INDEX IF NOT EXISTS idx_routing_lookup 
ON routing_rules(destination_id, priority, status);
```

### 3. Caching (Optional)

Add Redis caching for frequently accessed routes:

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0,
});

async function getCachedRouting(did: string): Promise<RoutingResult | null> {
  const cached = await redis.get(`routing:${did}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const routing = await getRouting(did);
  if (routing) {
    // Cache for 5 minutes
    await redis.setex(`routing:${did}`, 300, JSON.stringify(routing));
  }
  
  return routing;
}
```

## Monitoring

### 1. Log AGI Performance

```typescript
const startTime = Date.now();
const routing = await getRouting(did);
const duration = Date.now() - startTime;

if (duration > 100) {
  console.warn(`Slow routing query: ${duration}ms for DID ${did}`);
}
```

### 2. Monitor with PM2 (Alternative to systemd)

```bash
npm install -g pm2

# Start AGI server
pm2 start dist/agi/server.js --name gulf-agi

# Monitor
pm2 monit

# View logs
pm2 logs gulf-agi

# Auto-restart on boot
pm2 startup
pm2 save
```

## Troubleshooting

### AGI not connecting:
```bash
# Check if AGI server is running
netstat -tlnp | grep 4573

# Test connection
telnet localhost 4573

# Check Asterisk logs
tail -f /var/log/asterisk/messages | grep AGI
```

### Database connection errors:
```bash
# Test PostgreSQL connection
psql -h localhost -U asterisk_agi -d gulf_premium_telecom -c "SELECT 1"

# Check pool status in logs
journalctl -u gulf-agi -f
```

### No routing returned:
```sql
-- Verify data exists
SELECT * FROM allocation_numbers WHERE allocated_number = '+966501234567';
SELECT * FROM inbound_destinations WHERE id = 'dest-uuid';
SELECT * FROM routing_rules WHERE status = 'active';
```

## Security Considerations

1. **Database User Permissions:**
```sql
-- Create read-only user for AGI
CREATE USER asterisk_agi WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE gulf_premium_telecom TO asterisk_agi;
GRANT SELECT ON allocation_numbers, inbound_destinations, routing_rules TO asterisk_agi;
```

2. **Firewall:**
```bash
# AGI server should only listen on localhost
ufw deny 4573
# Asterisk connects locally, no external access needed
```

3. **Environment Variables:**
```bash
# Store sensitive data in .env file
echo "DB_PASSWORD=your_secure_password" > /opt/gulf-premium-telecom/backend/.env
chmod 600 /opt/gulf-premium-telecom/backend/.env
chown asterisk:asterisk /opt/gulf-premium-telecom/backend/.env
```
