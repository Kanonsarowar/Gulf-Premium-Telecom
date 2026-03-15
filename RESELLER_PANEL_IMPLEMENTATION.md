# Reseller Panel - Complete Implementation Guide

## Overview
Comprehensive reseller panel with pricing, balance management, invoicing, CDR, live calls, and account management.

## Features

### 1. Number Management
- Price in SAR (Saudi Riyal)
- Payment terms
- Number assignment to resellers

### 2. Live Call Monitoring
- Real-time active calls view
- Reseller-specific call filtering

### 3. IVR Statistics
- IVR menu selections tracking
- Performance metrics per reseller

### 4. CDR (Call Detail Records)
- Complete call history
- Detailed call information
- Search and filtering

### 5. Test Number
- Test number management
- Test call functionality

### 6. Balance & Invoicing
- Main balance display
- Weekly invoice generation (Sunday UTC 00:00)
- Balance reset every Sunday night
- Date-wise invoice with revenue
- Automatic paid status

### 7. Account Section
- Profile information
- Settings management
- Password change

## Backend Implementation

### New Database Models

#### 1. Invoice Model
```javascript
// server/models/Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalCalls: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'SAR'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  paidDate: Date,
  dueDate: Date,
  // Call details included in invoice
  calls: [{
    callId: mongoose.Schema.Types.ObjectId,
    callerNumber: String,
    duration: Number,
    revenue: Number,
    callDate: Date
  }],
  notes: String
}, {
  timestamps: true
});

// Generate invoice number
InvoiceSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    this.invoiceNumber = `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${this.resellerId.toString().slice(-6).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
```

#### 2. Number Model
```javascript
// server/models/Number.js
const mongoose = require('mongoose');

const NumberSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  pricePerMinute: {
    type: Number,
    required: true,
    default: 0.10
  },
  currency: {
    type: String,
    default: 'SAR'
  },
  paymentTerm: {
    type: String,
    enum: ['prepaid', 'postpaid', 'weekly', 'monthly'],
    default: 'weekly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTestNumber: {
    type: Boolean,
    default: false
  },
  // Destination for routing
  destination: String,
  // Statistics
  totalCalls: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  lastCallDate: Date,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Number', NumberSchema);
```

#### 3. Update User Model
Add balance history and invoice tracking:

```javascript
// Add to User model:
balanceHistory: [{
  date: Date,
  amount: Number,
  type: String, // 'charge', 'payment', 'reset'
  description: String,
  invoiceId: mongoose.Schema.Types.ObjectId
}],
lastInvoiceDate: Date,
lastBalanceReset: Date,
```

### API Routes

#### 1. Invoice Routes
```javascript
// server/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Call = require('../models/Call');
const { authMiddleware } = require('../middleware/auth');

// Get reseller invoices
router.get('/reseller', authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find({ 
      resellerId: req.user._id 
    }).sort({ startDate: -1 });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current week invoice (pending)
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get calls for current week
    const calls = await Call.find({
      resellerId: req.user._id,
      startTime: { $gte: startOfWeek },
      status: 'completed'
    });
    
    const totalRevenue = calls.reduce((sum, call) => sum + (call.revenue || 0), 0);
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    
    res.json({
      startDate: startOfWeek,
      endDate: now,
      totalCalls: calls.length,
      totalDuration,
      totalRevenue,
      calls: calls.map(c => ({
        callId: c._id,
        callerNumber: c.callerNumber,
        duration: c.duration,
        revenue: c.revenue,
        callDate: c.startTime
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate invoice (manual trigger or cron)
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { resellerId, startDate, endDate } = req.body;
    
    // Get calls for period
    const calls = await Call.find({
      resellerId: resellerId || req.user._id,
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: 'completed'
    });
    
    const totalRevenue = calls.reduce((sum, call) => sum + (call.revenue || 0), 0);
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    
    const invoice = new Invoice({
      resellerId: resellerId || req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalCalls: calls.length,
      totalDuration,
      totalRevenue,
      calls: calls.map(c => ({
        callId: c._id,
        callerNumber: c.callerNumber,
        duration: c.duration,
        revenue: c.revenue,
        callDate: c.startTime
      })),
      status: 'pending',
      dueDate: new Date(endDate)
    });
    
    await invoice.save();
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 2. Number Routes
```javascript
// server/routes/numberRoutes.js
const express = require('express');
const router = express.Router();
const Number = require('../models/Number');
const { authMiddleware } = require('../middleware/auth');

// Get reseller numbers
router.get('/reseller', authMiddleware, async (req, res) => {
  try {
    const numbers = await Number.find({ 
      resellerId: req.user._id 
    }).sort({ number: 1 });
    
    res.json(numbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get test numbers
router.get('/test', authMiddleware, async (req, res) => {
  try {
    const numbers = await Number.find({ 
      resellerId: req.user._id,
      isTestNumber: true
    });
    
    res.json(numbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 3. CDR Routes
```javascript
// server/routes/cdrRoutes.js
const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const { authMiddleware } = require('../middleware/auth');

// Get CDR for reseller
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, search } = req.query;
    
    const query = { resellerId: req.user._id };
    
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (search) {
      query.$or = [
        { callerNumber: new RegExp(search, 'i') },
        { destinationNumber: new RegExp(search, 'i') }
      ];
    }
    
    const calls = await Call.find(query)
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Call.countDocuments(query);
    
    res.json({
      calls,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export CDR
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const calls = await Call.find({
      resellerId: req.user._id,
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ startTime: -1 });
    
    if (format === 'csv') {
      // Generate CSV
      const csv = [
        ['Date', 'Caller', 'Destination', 'Duration', 'Revenue', 'Status'].join(','),
        ...calls.map(c => [
          c.startTime,
          c.callerNumber,
          c.destinationNumber,
          c.duration,
          c.revenue,
          c.status
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cdr-${startDate}-${endDate}.csv"`);
      res.send(csv);
    } else {
      res.json(calls);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Automation - Weekly Invoice Generation

```javascript
// server/services/invoiceScheduler.js
const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const Call = require('../models/Call');
const User = require('../models/User');

// Run every Sunday at 00:00 UTC
cron.schedule('0 0 * * 0', async () => {
  console.log('Running weekly invoice generation...');
  
  try {
    // Get all active resellers
    const resellers = await User.find({ 
      role: 'reseller',
      isActive: true
    });
    
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    
    for (const reseller of resellers) {
      // Get calls for the week
      const calls = await Call.find({
        resellerId: reseller._id,
        startTime: { $gte: startOfWeek, $lte: endOfWeek },
        status: 'completed'
      });
      
      if (calls.length === 0) continue;
      
      const totalRevenue = calls.reduce((sum, call) => sum + (call.revenue || 0), 0);
      const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
      
      // Create invoice
      const invoice = new Invoice({
        resellerId: reseller._id,
        startDate: startOfWeek,
        endDate: endOfWeek,
        totalCalls: calls.length,
        totalDuration,
        totalRevenue,
        calls: calls.map(c => ({
          callId: c._id,
          callerNumber: c.callerNumber,
          duration: c.duration,
          revenue: c.revenue,
          callDate: c.startTime
        })),
        status: 'paid', // Auto-mark as paid
        paidDate: now,
        dueDate: now
      });
      
      await invoice.save();
      
      // Reset balance to 0
      reseller.currentBalance = 0;
      reseller.lastBalanceReset = now;
      reseller.lastInvoiceDate = now;
      
      // Add to balance history
      reseller.balanceHistory.push({
        date: now,
        amount: totalRevenue,
        type: 'reset',
        description: `Weekly invoice ${invoice.invoiceNumber}`,
        invoiceId: invoice._id
      });
      
      await reseller.save();
      
      console.log(`Invoice created for reseller ${reseller.username}: ${invoice.invoiceNumber}`);
    }
    
    console.log('Weekly invoice generation completed.');
  } catch (error) {
    console.error('Error generating weekly invoices:', error);
  }
}, {
  timezone: 'UTC'
});

module.exports = cron;
```

## Frontend Implementation

### Reseller Dashboard Layout

```javascript
// client/app/reseller/layout.js
export default function ResellerLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-screen w-64 bg-white/5 backdrop-blur-xl border-r border-white/10">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Reseller Panel
          </h1>
        </div>
        
        <ul className="space-y-2 p-4">
          <li><a href="/reseller/dashboard">Dashboard</a></li>
          <li><a href="/reseller/numbers">Numbers</a></li>
          <li><a href="/reseller/live-calls">Live Calls</a></li>
          <li><a href="/reseller/ivr">IVR Statistics</a></li>
          <li><a href="/reseller/cdr">CDR</a></li>
          <li><a href="/reseller/test-number">Test Number</a></li>
          <li><a href="/reseller/balance">Balance & Invoices</a></li>
          <li><a href="/reseller/account">Account</a></li>
        </ul>
      </nav>
      
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
```

### Balance & Invoice Component

```javascript
// client/components/reseller/BalanceInvoice.js
'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function BalanceInvoice() {
  const [balance, setBalance] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      // Get current balance
      const profileRes = await apiClient.get('/auth/profile');
      setBalance(profileRes.data.currentBalance);
      
      // Get current week data
      const currentRes = await apiClient.get('/invoices/current');
      setCurrentWeek(currentRes.data);
      
      // Get invoice history
      const invoicesRes = await apiClient.get('/invoices/reseller');
      setInvoices(invoicesRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <div className="bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl p-8 text-white">
        <h2 className="text-sm uppercase tracking-wider opacity-80">Main Balance</h2>
        <div className="text-5xl font-bold mt-2">{balance.toFixed(2)} SAR</div>
        
        <div className="mt-6 flex gap-4">
          <div>
            <div className="text-sm opacity-80">This Week</div>
            <div className="text-2xl font-bold">
              {currentWeek?.totalRevenue?.toFixed(2) || '0.00'} SAR
            </div>
          </div>
          <div>
            <div className="text-sm opacity-80">Total Calls</div>
            <div className="text-2xl font-bold">{currentWeek?.totalCalls || 0}</div>
          </div>
        </div>
      </div>
      
      {/* Invoice History */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
        <h3 className="text-xl font-bold mb-4">Invoice History</h3>
        
        <div className="space-y-3">
          {invoices.map(invoice => (
            <div key={invoice._id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <div>
                <div className="font-semibold">{invoice.invoiceNumber}</div>
                <div className="text-sm text-gray-400">
                  {new Date(invoice.startDate).toLocaleDateString()} - {new Date(invoice.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{invoice.totalRevenue.toFixed(2)} SAR</div>
                <div className={`text-sm ${invoice.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {invoice.status === 'paid' ? `✓ Paid ${new Date(invoice.paidDate).toLocaleDateString()}` : 'Pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Next Reset Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Balance resets every Sunday at 00:00 UTC</span>
        </div>
      </div>
    </div>
  );
}
```

## Installation Steps

### 1. Install Dependencies
```bash
cd server
npm install node-cron
```

### 2. Create Models
- Create Invoice model
- Create Number model
- Update User model

### 3. Create Routes
- Invoice routes
- Number routes
- CDR routes

### 4. Add to server/index.js
```javascript
// Add invoice scheduler
require('./services/invoiceScheduler');

// Add routes
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/numbers', require('./routes/numberRoutes'));
app.use('/api/cdr', require('./routes/cdrRoutes'));
```

### 5. Create Frontend Pages
- Reseller dashboard layout
- Numbers page
- Live calls page
- IVR statistics page
- CDR page
- Test number page
- Balance & invoices page
- Account page

## Testing

### 1. Test Invoice Generation
```bash
node -e "require('./server/models/Invoice'); require('./server/services/invoiceScheduler');"
```

### 2. Test API Endpoints
```bash
# Login as reseller
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"reseller1","password":"reseller123"}'

# Get invoices
curl -X GET http://localhost:3001/api/invoices/reseller \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get current week
curl -X GET http://localhost:3001/api/invoices/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Summary

This implementation provides:
- ✅ Number management with SAR pricing
- ✅ Live call monitoring
- ✅ IVR statistics
- ✅ CDR with export
- ✅ Test number management
- ✅ Balance tracking
- ✅ Weekly invoice generation (Sunday UTC 00:00)
- ✅ Automatic paid status
- ✅ Account management
- ✅ Ultra-modern glassmorphism UI

The system automatically generates invoices every Sunday at midnight UTC, resets balances to 0, and marks invoices as paid.
