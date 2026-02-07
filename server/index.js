const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const asteriskService = require('./services/asteriskService');
const callRoutes = require('./routes/callRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/calls', callRoutes);
app.use('/api/revenue', revenueRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Gulf Premium Telecom Server is running',
    asterisk: asteriskService.isConnected() ? 'connected' : 'disconnected'
  });
});

// WebSocket connection handling
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });

  // Send initial connection success message
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to Gulf Premium Telecom' }));
});

// Broadcast function for real-time updates
global.broadcast = (data) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Connect to Database
db.connect().then(() => {
  console.log('Database connected successfully');
}).catch((err) => {
  console.error('Database connection error:', err);
});

// Initialize Asterisk connection
asteriskService.connect().then(() => {
  console.log('Asterisk Manager Interface connected');
}).catch((err) => {
  console.error('Failed to connect to Asterisk:', err);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on the same port`);
});

module.exports = { app, server, wss };
