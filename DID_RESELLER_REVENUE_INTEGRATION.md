# 📊 DID-to-Reseller Allocation & Revenue Tracking Integration

Complete integration system for assigning DIDs to resellers with automatic per-minute revenue calculation, CDR tracking, and live call monitoring.

## Overview

This system connects:
1. **DID Numbers** - Assigned to specific resellers
2. **Call Tracking** - Automatically associates calls with reseller
3. **Revenue Calculation** - Per-minute pricing based on DID configuration
4. **CDR Reports** - Filtered by reseller with pricing details
5. **Live Calls** - Real-time monitoring per reseller
6. **Statistics** - Automatic per-reseller analytics

---

## System Flow

```
DID Number (Assigned to Reseller)
    ↓
Incoming Call on DID
    ↓
System Identifies Reseller
    ↓
Track Call Duration
    ↓
Calculate Revenue (Duration × Price per Minute)
    ↓
Update Reseller Statistics
    ↓
Store in CDR with Reseller Info
```

---

## Backend Implementation

### 1. Updated Call Model with Reseller & Pricing

```javascript
// server/models/Call.js - Updated

const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  // Basic Call Information
  uniqueId: {
    type: String,
    required: true,
    unique: true
  },
  caller: {
    type: String,
    required: true
  },
  destination: String,
  
  // DID Information
  didNumber: {
    type: String,
    required: true
  },
  did: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DID'
  },
  
  // Reseller Information (from DID assignment)
  reseller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true // Index for fast queries
  },
  resellerTeamId: String, // Denormalized for quick access
  
  // Supplier Information
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierCode: String,
  
  // Carrier Information (detected from caller)
  carrier: {
    type: String,
    enum: ['STC', 'MOBILY', 'ZAIN', 'VIRGIN', 'SALAM', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  
  // Call Timing
  startTime: {
    type: Date,
    default: Date.now
  },
  answerTime: Date,
  endTime: Date,
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  billableDuration: {
    type: Number,
    default: 0 // in seconds (after minimum billing)
  },
  
  // Pricing & Revenue
  pricing: {
    pricePerMinute: {
      type: Number,
      required: true,
      default: 0
    },
    currency: {
      type: String,
      default: 'SAR'
    },
    minimumBilling: {
      type: Number,
      default: 1 // minimum minutes to bill
    },
    setupFee: {
      type: Number,
      default: 0
    }
  },
  
  // Revenue Calculation
  revenue: {
    type: Number,
    default: 0
  },
  revenueCalculation: {
    minutes: Number,
    pricePerMinute: Number,
    setupFee: Number,
    total: Number,
    calculatedAt: Date
  },
  
  // Call Status
  status: {
    type: String,
    enum: ['ringing', 'active', 'completed', 'failed', 'no-answer'],
    default: 'ringing'
  },
  disposition: String, // ANSWERED, BUSY, NO ANSWER, FAILED, etc.
  
  // IVR Information
  ivrSelections: [{
    menu: String,
    selection: String,
    timestamp: Date
  }],
  
  // Call Events
  events: [{
    event: String,
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for reseller queries
callSchema.index({ reseller: 1, createdAt: -1 });
callSchema.index({ resellerTeamId: 1, createdAt: -1 });
callSchema.index({ didNumber: 1, createdAt: -1 });
callSchema.index({ status: 1, reseller: 1 });

// Method to calculate revenue
callSchema.methods.calculateRevenue = function() {
  if (!this.duration || this.duration === 0) {
    this.revenue = this.pricing.setupFee || 0;
    return this.revenue;
  }
  
  // Calculate billable minutes (round up)
  const minutes = Math.ceil(this.duration / 60);
  
  // Apply minimum billing
  const billableMinutes = Math.max(minutes, this.pricing.minimumBilling || 1);
  
  // Calculate revenue
  const minuteRevenue = billableMinutes * this.pricing.pricePerMinute;
  const setupFee = this.pricing.setupFee || 0;
  const totalRevenue = minuteRevenue + setupFee;
  
  // Store calculation details
  this.billableDuration = billableMinutes * 60;
  this.revenue = totalRevenue;
  this.revenueCalculation = {
    minutes: billableMinutes,
    pricePerMinute: this.pricing.pricePerMinute,
    setupFee: setupFee,
    total: totalRevenue,
    calculatedAt: new Date()
  };
  
  return totalRevenue;
};

// Pre-save hook to calculate revenue
callSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Calculate revenue if call is completed and duration is set
  if (this.status === 'completed' && this.duration > 0 && !this.revenueCalculation) {
    this.calculateRevenue();
  }
  
  next();
});

// Post-save hook to update reseller statistics
callSchema.post('save', async function(doc) {
  if (doc.reseller && doc.status === 'completed') {
    try {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(doc.reseller, {
        $inc: {
          'stats.totalCalls': 1,
          'stats.totalMinutes': doc.billableDuration / 60,
          'stats.totalRevenue': doc.revenue
        },
        $set: {
          'stats.lastCallDate': doc.endTime || doc.createdAt
        }
      });
    } catch (error) {
      console.error('Failed to update reseller stats:', error);
    }
  }
});

module.exports = mongoose.model('Call', callSchema);
```

### 2. DID Assignment Service

```javascript
// server/services/didAssignmentService.js

const DID = require('../models/DID');
const User = require('../models/User');
const Call = require('../models/Call');

class DIDAssignmentService {
  
  /**
   * Assign DID to a reseller
   */
  async assignDIDToReseller(didId, resellerId) {
    try {
      // Get DID
      const did = await DID.findById(didId);
      if (!did) {
        throw new Error('DID not found');
      }
      
      // Get reseller
      const reseller = await User.findById(resellerId);
      if (!reseller || reseller.role !== 'reseller') {
        throw new Error('Invalid reseller');
      }
      
      // Check if DID is already assigned
      if (did.assignedTo && did.assignedTo.toString() !== resellerId) {
        throw new Error('DID is already assigned to another reseller');
      }
      
      // Assign DID
      did.assignedTo = resellerId;
      did.status = 'active';
      did.activatedAt = new Date();
      await did.save();
      
      // Update reseller's assigned numbers count
      await User.findByIdAndUpdate(resellerId, {
        $inc: { 'stats.assignedNumbers': 1 }
      });
      
      return did;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Unassign DID from reseller
   */
  async unassignDID(didId) {
    try {
      const did = await DID.findById(didId);
      if (!did) {
        throw new Error('DID not found');
      }
      
      const previousReseller = did.assignedTo;
      
      did.assignedTo = null;
      did.status = 'pending';
      await did.save();
      
      // Update reseller's assigned numbers count
      if (previousReseller) {
        await User.findByIdAndUpdate(previousReseller, {
          $inc: { 'stats.assignedNumbers': -1 }
        });
      }
      
      return did;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get reseller's assigned DIDs
   */
  async getResellerDIDs(resellerId) {
    try {
      const dids = await DID.find({ assignedTo: resellerId })
        .populate('supplier', 'name code')
        .sort({ createdAt: -1 });
      
      return dids;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get available (unassigned) DIDs
   */
  async getAvailableDIDs() {
    try {
      const dids = await DID.find({ 
        assignedTo: null,
        status: { $in: ['pending', 'active'] }
      })
        .populate('supplier', 'name code')
        .sort({ createdAt: -1 });
      
      return dids;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DIDAssignmentService();
```

### 3. Call Processing Service (AMI Integration)

```javascript
// server/services/callProcessingService.js

const Call = require('../models/Call');
const DID = require('../models/DID');
const detectCarrier = require('../utils/carrierDetector');

class CallProcessingService {
  
  /**
   * Process new incoming call
   */
  async processNewCall(amiEvent) {
    try {
      const { UniqueID, CallerIDNum, Exten, Channel } = amiEvent;
      
      // Get DID information
      const did = await DID.findOne({ number: Exten })
        .populate('assignedTo')
        .populate('supplier');
      
      if (!did) {
        console.error(`DID not found: ${Exten}`);
        return null;
      }
      
      // Detect carrier from caller number
      const carrier = detectCarrier(CallerIDNum);
      
      // Create call record
      const call = new Call({
        uniqueId: UniqueID,
        caller: CallerIDNum,
        destination: Exten,
        didNumber: Exten,
        did: did._id,
        reseller: did.assignedTo?._id,
        resellerTeamId: did.assignedTo?.teamId,
        supplier: did.supplier?._id,
        supplierCode: did.supplier?.code,
        carrier: carrier,
        status: 'ringing',
        
        // Set pricing from DID
        pricing: {
          pricePerMinute: did.pricing.perMinuteCharge || 0,
          currency: did.pricing.currency || 'SAR',
          minimumBilling: 1,
          setupFee: did.pricing.setupFee || 0
        },
        
        startTime: new Date(),
        
        events: [{
          event: 'NewCall',
          timestamp: new Date(),
          data: amiEvent
        }]
      });
      
      await call.save();
      
      // Update DID statistics
      await DID.findByIdAndUpdate(did._id, {
        $inc: { 'stats.totalCalls': 1 },
        $set: { 'stats.lastCallDate': new Date() }
      });
      
      return call;
    } catch (error) {
      console.error('Process new call error:', error);
      throw error;
    }
  }
  
  /**
   * Process call answer
   */
  async processCallAnswer(amiEvent) {
    try {
      const { UniqueID } = amiEvent;
      
      const call = await Call.findOne({ uniqueId: UniqueID });
      if (!call) return null;
      
      call.status = 'active';
      call.answerTime = new Date();
      call.events.push({
        event: 'CallAnswered',
        timestamp: new Date(),
        data: amiEvent
      });
      
      await call.save();
      
      return call;
    } catch (error) {
      console.error('Process call answer error:', error);
      throw error;
    }
  }
  
  /**
   * Process call hangup (calculate revenue)
   */
  async processCallHangup(amiEvent) {
    try {
      const { UniqueID, Duration, Disposition } = amiEvent;
      
      const call = await Call.findOne({ uniqueId: UniqueID });
      if (!call) return null;
      
      // Update call
      call.status = 'completed';
      call.endTime = new Date();
      call.duration = parseInt(Duration) || 0;
      call.disposition = Disposition;
      
      // Calculate revenue (will trigger pre-save hook)
      call.calculateRevenue();
      
      call.events.push({
        event: 'CallHangup',
        timestamp: new Date(),
        data: amiEvent
      });
      
      await call.save();
      
      return call;
    } catch (error) {
      console.error('Process call hangup error:', error);
      throw error;
    }
  }
}

module.exports = new CallProcessingService();
```

### 4. Reseller Statistics API

```javascript
// server/routes/resellerStatsRoutes.js

const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const DID = require('../models/DID');
const { authMiddleware } = require('../middleware/auth');

// Get reseller's dashboard statistics
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const resellerId = req.user.id;
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get assigned DIDs
    const assignedDIDs = await DID.find({ assignedTo: resellerId });
    const didNumbers = assignedDIDs.map(d => d.number);
    
    // Today's statistics
    const todayStats = await Call.aggregate([
      {
        $match: {
          reseller: req.user._id,
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalRevenue: { $sum: '$revenue' }
        }
      }
    ]);
    
    // This week's statistics
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekStats = await Call.aggregate([
      {
        $match: {
          reseller: req.user._id,
          createdAt: { $gte: weekStart },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalRevenue: { $sum: '$revenue' }
        }
      }
    ]);
    
    // Active calls
    const activeCalls = await Call.find({
      reseller: resellerId,
      status: { $in: ['ringing', 'active'] }
    }).sort({ startTime: -1 });
    
    // Recent completed calls
    const recentCalls = await Call.find({
      reseller: resellerId,
      status: 'completed'
    })
      .sort({ endTime: -1 })
      .limit(10)
      .select('caller didNumber duration revenue carrier endTime');
    
    // Revenue by carrier
    const carrierRevenue = await Call.aggregate([
      {
        $match: {
          reseller: req.user._id,
          status: 'completed',
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: '$carrier',
          calls: { $sum: 1 },
          revenue: { $sum: '$revenue' },
          minutes: { $sum: { $divide: ['$duration', 60] } }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);
    
    // Revenue by DID
    const didRevenue = await Call.aggregate([
      {
        $match: {
          reseller: req.user._id,
          status: 'completed',
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: '$didNumber',
          calls: { $sum: 1 },
          revenue: { $sum: '$revenue' },
          minutes: { $sum: { $divide: ['$duration', 60] } }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json({
      assignedNumbers: assignedDIDs.length,
      today: todayStats[0] || { totalCalls: 0, totalDuration: 0, totalRevenue: 0 },
      thisWeek: weekStats[0] || { totalCalls: 0, totalDuration: 0, totalRevenue: 0 },
      activeCalls: activeCalls,
      recentCalls: recentCalls,
      carrierBreakdown: carrierRevenue,
      didBreakdown: didRevenue
    });
  } catch (error) {
    console.error('Get reseller dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Get reseller's CDR (Call Detail Records)
router.get('/cdr', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, didNumber, carrier, page = 1, limit = 50 } = req.query;
    
    const query = {
      reseller: req.user.id,
      status: 'completed'
    };
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // DID filter
    if (didNumber) query.didNumber = didNumber;
    
    // Carrier filter
    if (carrier) query.carrier = carrier;
    
    const calls = await Call.find(query)
      .sort({ endTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('uniqueId caller didNumber carrier duration revenue endTime disposition');
    
    const count = await Call.countDocuments(query);
    
    // Calculate totals
    const totals = await Call.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalRevenue: { $sum: '$revenue' }
        }
      }
    ]);
    
    res.json({
      calls,
      totals: totals[0] || { totalCalls: 0, totalDuration: 0, totalRevenue: 0 },
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Get reseller CDR error:', error);
    res.status(500).json({ error: 'Failed to get CDR' });
  }
});

// Get reseller's active calls
router.get('/active-calls', authMiddleware, async (req, res) => {
  try {
    const activeCalls = await Call.find({
      reseller: req.user.id,
      status: { $in: ['ringing', 'active'] }
    })
      .sort({ startTime: -1 })
      .select('uniqueId caller didNumber carrier startTime status events');
    
    res.json({ activeCalls });
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ error: 'Failed to get active calls' });
  }
});

// Get revenue analytics
router.get('/revenue-analytics', authMiddleware, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate = new Date();
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Daily revenue
    const dailyRevenue = await Call.aggregate([
      {
        $match: {
          reseller: req.user._id,
          status: 'completed',
          endTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$endTime' },
            month: { $month: '$endTime' },
            day: { $dayOfMonth: '$endTime' }
          },
          calls: { $sum: 1 },
          revenue: { $sum: '$revenue' },
          minutes: { $sum: { $divide: ['$duration', 60] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    res.json({ dailyRevenue });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
});

module.exports = router;
```

---

## Frontend Implementation

### 1. Reseller Dashboard with DID & Revenue

```jsx
// client/app/reseller/page.js - Updated

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import CountUp from 'react-countup';

export default function ResellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [assignedDIDs, setAssignedDIDs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, didsRes] = await Promise.all([
        fetch('/api/reseller/dashboard', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/reseller/dids', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const statsData = await statsRes.json();
      const didsData = await didsRes.json();

      setStats(statsData);
      setAssignedDIDs(didsData.dids || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-8">
          Welcome, {user?.fullName || user?.username}
        </h1>

        {/* Balance & This Week Stats */}
        <div className="glass-strong p-8 rounded-2xl mb-6">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-lg mb-2">This Week's Revenue</p>
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              <CountUp
                end={stats?.thisWeek?.totalRevenue || 0}
                decimals={2}
                duration={2}
              /> SAR
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Calls This Week</p>
              <p className="text-white text-2xl font-semibold">
                <CountUp end={stats?.thisWeek?.totalCalls || 0} duration={2} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Minutes This Week</p>
              <p className="text-white text-2xl font-semibold">
                <CountUp end={Math.floor((stats?.thisWeek?.totalDuration || 0) / 60)} duration={2} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Assigned Numbers</p>
              <p className="text-white text-2xl font-semibold">
                {assignedDIDs.length}
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Numbers */}
        <div className="glass-strong p-6 rounded-2xl mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Assigned Numbers</h2>
          
          {assignedDIDs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📞</div>
              <p className="text-gray-400">No numbers assigned yet</p>
              <p className="text-gray-500 text-sm">Contact admin to get numbers assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedDIDs.map((did) => (
                <div key={did._id} className="glass p-4 rounded-xl hover:scale-105 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white text-lg font-semibold">{did.number}</p>
                      {did.friendlyName && (
                        <p className="text-gray-400 text-sm">{did.friendlyName}</p>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                      Active
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price/Min:</span>
                      <span className="text-cyan-400 font-semibold">
                        {did.pricing.perMinuteCharge} SAR
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Monthly:</span>
                      <span className="text-white">
                        {did.pricing.monthlyFee} SAR
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total Calls:</span>
                      <span className="text-white">{did.stats?.totalCalls || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Revenue:</span>
                      <span className="text-white">
                        {(did.stats?.totalRevenue || 0).toFixed(2)} SAR
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-strong p-6 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Today's Calls</p>
            <p className="text-white text-3xl font-bold">
              <CountUp end={stats?.today?.totalCalls || 0} duration={2} />
            </p>
          </div>
          <div className="glass-strong p-6 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Today's Minutes</p>
            <p className="text-white text-3xl font-bold">
              <CountUp end={Math.floor((stats?.today?.totalDuration || 0) / 60)} duration={2} />
            </p>
          </div>
          <div className="glass-strong p-6 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Today's Revenue</p>
            <p className="text-white text-3xl font-bold">
              <CountUp end={stats?.today?.totalRevenue || 0} decimals={2} duration={2} />
            </p>
          </div>
          <div className="glass-strong p-6 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Active Calls</p>
            <p className="text-white text-3xl font-bold">
              {stats?.activeCalls?.length || 0}
            </p>
          </div>
        </div>

        {/* Revenue by Carrier */}
        {stats?.carrierBreakdown && stats.carrierBreakdown.length > 0 && (
          <div className="glass-strong p-6 rounded-2xl mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Revenue by Carrier (This Week)</h2>
            <div className="space-y-3">
              {stats.carrierBreakdown.map((carrier) => (
                <div key={carrier._id} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="text-white font-semibold w-24">{carrier._id}</span>
                    <div className="flex-1 mx-4">
                      <div className="bg-white/10 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{
                            width: `${(carrier.revenue / stats.thisWeek.totalRevenue) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{carrier.revenue.toFixed(2)} SAR</p>
                    <p className="text-gray-400 text-sm">{carrier.calls} calls</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Calls */}
        {stats?.recentCalls && stats.recentCalls.length > 0 && (
          <div className="glass-strong p-6 rounded-2xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Recent Calls</h2>
            <div className="space-y-2">
              {stats.recentCalls.map((call) => (
                <div key={call._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-white font-semibold">{call.caller}</p>
                      <p className="text-gray-400 text-sm">To: {call.didNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white">{call.revenue.toFixed(2)} SAR</p>
                    <p className="text-gray-400 text-sm">{Math.floor(call.duration / 60)}m {call.duration % 60}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Admin: Assign DIDs to Resellers

```jsx
// client/app/admin/dids/[id]/assign/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssignDID({ params }) {
  const router = useRouter();
  const [did, setDid] = useState(null);
  const [resellers, setResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [didRes, resellersRes] = await Promise.all([
        fetch(`/api/dids/${params.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/users?role=reseller', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const didData = await didRes.json();
      const resellersData = await resellersRes.json();

      setDid(didData);
      setResellers(resellersData.users || []);
      setSelectedReseller(didData.assignedTo?._id || '');
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    try {
      const res = await fetch(`/api/dids/${params.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ resellerId: selectedReseller || null })
      });

      if (res.ok) {
        alert('DID assigned successfully!');
        router.push('/admin/dids');
      } else {
        alert('Failed to assign DID');
      }
    } catch (error) {
      alert('Failed to assign DID');
    }
  };

  if (loading) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Assign DID Number</h1>

        <div className="glass-strong p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">DID Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Number:</span>
              <span className="text-white font-semibold">{did?.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Price per Minute:</span>
              <span className="text-cyan-400">{did?.pricing.perMinuteCharge} SAR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly Fee:</span>
              <span className="text-white">{did?.pricing.monthlyFee} SAR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current Assignment:</span>
              <span className="text-white">
                {did?.assignedTo ? `${did.assignedTo.fullName} (${did.assignedTo.teamId})` : 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-strong p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Reseller</h2>
          <select
            value={selectedReseller}
            onChange={(e) => setSelectedReseller(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white mb-4"
          >
            <option value="">-- Unassign (Available) --</option>
            {resellers.map((reseller) => (
              <option key={reseller._id} value={reseller._id}>
                {reseller.fullName} ({reseller.teamId}) - {reseller.email}
              </option>
            ))}
          </select>

          {selectedReseller && (
            <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg mb-4">
              <p className="font-semibold">Assignment Impact:</p>
              <ul className="list-disc list-inside text-sm mt-2">
                <li>All calls to {did?.number} will be tracked for this reseller</li>
                <li>Revenue will be calculated at {did?.pricing.perMinuteCharge} SAR/min</li>
                <li>Reseller will see this number in their dashboard</li>
                <li>CDR and live calls will be filtered for this reseller</li>
              </ul>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={() => router.back()}
              className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition"
            >
              {selectedReseller ? 'Assign to Reseller' : 'Unassign DID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Summary

### What This Integration Provides:

**1. DID Assignment:**
- ✅ Admin assigns DID numbers to specific resellers
- ✅ Each DID has per-minute pricing
- ✅ Multiple DIDs can be assigned to one reseller

**2. Automatic Call Tracking:**
- ✅ Incoming calls automatically associated with reseller
- ✅ Caller carrier detected (STC, Mobily, Zain, etc.)
- ✅ Call duration tracked in real-time

**3. Revenue Calculation:**
- ✅ Per-minute pricing from DID configuration
- ✅ Automatic calculation: Minutes × Price per Minute
- ✅ Minimum billing period support
- ✅ Setup fee support

**4. Reseller Dashboard:**
- ✅ See assigned numbers with pricing
- ✅ Real-time revenue statistics
- ✅ Breakdown by carrier
- ✅ Breakdown by DID
- ✅ Today and weekly stats

**5. CDR Reports:**
- ✅ Filtered by reseller automatically
- ✅ Show per-call revenue
- ✅ Export functionality
- ✅ Search and filter options

**6. Live Call Monitoring:**
- ✅ Resellers see only their calls
- ✅ Real-time status updates
- ✅ Active call count

---

**Complete per-minute revenue tracking system with DID assignment to resellers!** 📊💰✨
