# Gulf Premium Telecom - API Documentation

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, the API does not require authentication. For production deployments, implement JWT or API key authentication.

## API Endpoints

### Health Check

#### GET /health

Check server and Asterisk connection status.

**Response:**
```json
{
  "status": "ok",
  "message": "Gulf Premium Telecom Server is running",
  "asterisk": "connected"
}
```

---

## Call Management Endpoints

### Get All Calls

#### GET /api/calls

Retrieve all calls with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "callId": "uuid",
      "channelId": "SIP/trunk-00000001",
      "callerNumber": "+1234567890",
      "callerName": "John Doe",
      "direction": "inbound",
      "status": "completed",
      "startTime": "2024-01-01T10:00:00.000Z",
      "answerTime": "2024-01-01T10:00:05.000Z",
      "endTime": "2024-01-01T10:05:00.000Z",
      "duration": 295,
      "revenue": 0.49,
      "ivrData": {
        "IVR_OPTION": "sales"
      },
      "events": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### Get Active Calls

#### GET /api/calls/active

Retrieve currently active calls.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "callId": "uuid",
      "channelId": "SIP/trunk-00000001",
      "callerNumber": "+1234567890",
      "status": "answered",
      "startTime": "2024-01-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Call by ID

#### GET /api/calls/:callId

Retrieve details of a specific call.

**Parameters:**
- `callId`: Unique call identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "callId": "uuid",
    "channelId": "SIP/trunk-00000001",
    "callerNumber": "+1234567890",
    "status": "completed",
    "duration": 295,
    "revenue": 0.49
  }
}
```

### Get Calls by Caller Number

#### GET /api/calls/caller/:number

Retrieve all calls from a specific caller.

**Parameters:**
- `number`: Caller phone number

**Response:**
```json
{
  "success": true,
  "data": [],
  "count": 10
}
```

### Get Calls by Date Range

#### POST /api/calls/date-range

Retrieve calls within a specific date range.

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": [],
  "count": 50
}
```

### Hangup Channel

#### POST /api/calls/hangup/:channel

Hangup a specific call channel.

**Parameters:**
- `channel`: Asterisk channel ID

**Response:**
```json
{
  "success": true,
  "message": "Hangup command sent"
}
```

---

## Revenue Analytics Endpoints

### Get Today's Revenue

#### GET /api/revenue/today

Get revenue statistics for today.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCalls": 50,
    "totalDuration": 5000,
    "totalRevenue": 8.33,
    "avgDuration": 100,
    "avgRevenue": 0.17
  }
}
```

### Get Revenue by Date Range

#### POST /api/revenue/range

Get revenue statistics for a specific date range.

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCalls": 500,
    "totalDuration": 50000,
    "totalRevenue": 83.33,
    "avgDuration": 100,
    "avgRevenue": 0.17
  }
}
```

### Get Hourly Revenue

#### GET /api/revenue/hourly/:date

Get hourly breakdown of calls and revenue for a specific date.

**Parameters:**
- `date`: Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": 0,
      "count": 5,
      "totalRevenue": 2.50
    },
    {
      "hour": 1,
      "count": 3,
      "totalRevenue": 1.75
    }
  ]
}
```

### Get Monthly Revenue

#### GET /api/revenue/monthly/:year/:month

Get daily breakdown for a specific month.

**Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-12)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": 1,
      "count": 25,
      "totalRevenue": 15.50,
      "totalDuration": 1500
    }
  ]
}
```

### Get Top Callers

#### GET /api/revenue/top-callers/:limit?

Get top callers by revenue.

**Parameters:**
- `limit` (optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "+1234567890",
      "totalCalls": 50,
      "totalRevenue": 25.00,
      "totalDuration": 15000,
      "avgDuration": 300
    }
  ]
}
```

### Get Real-time Dashboard Data

#### GET /api/revenue/dashboard/realtime

Get comprehensive dashboard data including today's stats, current hour, and 7-day trend.

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "totalCalls": 50,
      "totalRevenue": 25.00
    },
    "thisHour": {
      "totalCalls": 5,
      "totalRevenue": 2.50
    },
    "last7Days": [
      {
        "date": "2024-01-01",
        "stats": {
          "totalCalls": 45,
          "totalRevenue": 22.50
        }
      }
    ]
  }
}
```

---

## WebSocket API

### Connection

Connect to WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Events

#### connected
Sent when WebSocket connection is established.

```json
{
  "type": "connected",
  "message": "Connected to Gulf Premium Telecom"
}
```

#### call_new
Sent when a new call is received.

```json
{
  "type": "call_new",
  "data": {
    "callId": "uuid",
    "channelId": "SIP/trunk-00000001",
    "callerNumber": "+1234567890",
    "callerName": "John Doe",
    "status": "ringing",
    "startTime": "2024-01-01T10:00:00.000Z"
  }
}
```

#### call_update
Sent when call status changes.

```json
{
  "type": "call_update",
  "data": {
    "callId": "uuid",
    "status": "answered",
    "answerTime": "2024-01-01T10:00:05.000Z"
  }
}
```

#### call_ended
Sent when a call is completed.

```json
{
  "type": "call_ended",
  "data": {
    "callId": "uuid",
    "status": "completed",
    "duration": 295,
    "revenue": 0.49,
    "endTime": "2024-01-01T10:05:00.000Z"
  }
}
```

#### ivr_update
Sent when IVR option is selected.

```json
{
  "type": "ivr_update",
  "data": {
    "callId": "uuid",
    "channelId": "SIP/trunk-00000001",
    "ivrData": {
      "IVR_OPTION": "sales"
    }
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production deployments, consider implementing rate limiting using packages like `express-rate-limit`.

---

## Data Models

### Call Object

```javascript
{
  callId: String,           // Unique identifier
  channelId: String,        // Asterisk channel ID
  callerNumber: String,     // Caller phone number
  callerName: String,       // Caller name
  direction: String,        // "inbound" or "outbound"
  status: String,           // "ringing", "answered", "connected", "completed", "failed"
  startTime: Date,          // Call start timestamp
  answerTime: Date,         // When answered
  bridgeTime: Date,         // When bridged
  endTime: Date,            // Call end timestamp
  duration: Number,         // Duration in seconds
  revenue: Number,          // Generated revenue
  hangupCause: String,      // Hangup reason code
  hangupCauseText: String,  // Hangup description
  ivrData: Object,          // IVR selections
  events: Array             // Call events timeline
}
```

### Event Object

```javascript
{
  type: String,        // Event type
  state: String,       // State description
  destination: String, // Destination (for dial events)
  channel1: String,    // Bridge channel 1
  channel2: String,    // Bridge channel 2
  timestamp: Date      // Event timestamp
}
```

---

## Example Usage

### JavaScript (Fetch API)

```javascript
// Get today's revenue
fetch('http://localhost:3001/api/revenue/today')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Get active calls
fetch('http://localhost:3001/api/calls/active')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### cURL

```bash
# Get health status
curl http://localhost:3001/health

# Get all calls
curl http://localhost:3001/api/calls?page=1&limit=10

# Get revenue for date range
curl -X POST http://localhost:3001/api/revenue/range \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2024-01-01","endDate":"2024-01-31"}'
```

### Python (requests)

```python
import requests

# Get today's revenue
response = requests.get('http://localhost:3001/api/revenue/today')
data = response.json()
print(data)

# Get calls by date range
payload = {
    'startDate': '2024-01-01T00:00:00.000Z',
    'endDate': '2024-01-31T23:59:59.999Z'
}
response = requests.post('http://localhost:3001/api/calls/date-range', json=payload)
data = response.json()
print(data)
```

---

## Support

For API support and questions:
- GitHub Issues: https://github.com/Kanonsarowar/Gulf-Premium-Telecom/issues
- Email: api@gulfpremiumtelecom.com