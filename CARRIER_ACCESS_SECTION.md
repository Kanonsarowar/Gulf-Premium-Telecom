# Carrier Access Tracking - Saudi Telecom Providers

## Ultra-Modern Carrier Access Section

Beautiful visualization showing calls and revenue from different Saudi telecom carriers: STC, Mobily, Zain, Redbull, and Salam.

## Backend Implementation

### 1. Update Call Model for Carrier Tracking

```javascript
// server/models/Call.js - Add carrier field
const CallSchema = new mongoose.Schema({
  // ... existing fields ...
  
  carrier: {
    type: String,
    enum: ['STC', 'Mobily', 'Zain', 'Redbull', 'Salam', 'Unknown'],
    default: 'Unknown',
    index: true
  },
  
  // Carrier detection metadata
  carrierPrefix: String, // e.g., '050' for Mobily
  carrierDetectedAt: Date
});

// Method to detect carrier from number
CallSchema.methods.detectCarrier = function() {
  const number = this.callerNumber;
  if (!number) return 'Unknown';
  
  // Saudi Arabia mobile prefixes
  const prefixes = {
    'STC': ['050', '053', '054', '055', '056', '059'],
    'Mobily': ['050', '054', '055', '056'],
    'Zain': ['057', '058', '059'],
    'Redbull': ['051', '052'],
    'Salam': ['053']
  };
  
  // Extract prefix (first 3 digits after country code)
  const prefix = number.replace(/[^0-9]/g, '').slice(-9, -6);
  
  for (const [carrier, carrierPrefixes] of Object.entries(prefixes)) {
    if (carrierPrefixes.includes(prefix)) {
      this.carrier = carrier;
      this.carrierPrefix = prefix;
      this.carrierDetectedAt = new Date();
      return carrier;
    }
  }
  
  this.carrier = 'Unknown';
  return 'Unknown';
};

// Auto-detect carrier before saving
CallSchema.pre('save', function(next) {
  if (this.isNew && !this.carrier) {
    this.detectCarrier();
  }
  next();
});
```

### 2. Carrier Statistics API

```javascript
// server/routes/carrierRoutes.js
const express = require('express');
const router = express.Router();
const Call = require('../models/Call');
const { authMiddleware } = require('../middleware/auth');

// Get carrier statistics for reseller
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {
      resellerId: req.user._id,
      status: 'completed'
    };
    
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Aggregate by carrier
    const carrierStats = await Call.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$carrier',
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalRevenue: { $sum: '$revenue' },
          avgDuration: { $avg: '$duration' },
          avgRevenue: { $avg: '$revenue' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    // Calculate total for percentages
    const totals = carrierStats.reduce((acc, stat) => ({
      calls: acc.calls + stat.totalCalls,
      revenue: acc.revenue + stat.totalRevenue,
      duration: acc.duration + stat.totalDuration
    }), { calls: 0, revenue: 0, duration: 0 });
    
    // Add percentages
    const statsWithPercentages = carrierStats.map(stat => ({
      carrier: stat._id,
      totalCalls: stat.totalCalls,
      totalDuration: stat.totalDuration,
      totalRevenue: stat.totalRevenue,
      avgDuration: stat.avgDuration,
      avgRevenue: stat.avgRevenue,
      percentageCalls: (stat.totalCalls / totals.calls * 100).toFixed(1),
      percentageRevenue: (stat.totalRevenue / totals.revenue * 100).toFixed(1)
    }));
    
    res.json({
      carriers: statsWithPercentages,
      totals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get calls by specific carrier
router.get('/:carrier/calls', authMiddleware, async (req, res) => {
  try {
    const { carrier } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const calls = await Call.find({
      resellerId: req.user._id,
      carrier: carrier,
      status: 'completed'
    })
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Call.countDocuments({
      resellerId: req.user._id,
      carrier: carrier,
      status: 'completed'
    });
    
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

module.exports = router;
```

### 3. Add to Server Index

```javascript
// server/index.js
app.use('/api/carriers', require('./routes/carrierRoutes'));
```

## Frontend Implementation

### 1. Carrier Access Section Component

```javascript
// client/components/reseller/CarrierAccessSection.js
'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import CountUp from 'react-countup';

export default function CarrierAccessSection() {
  const [carrierData, setCarrierData] = useState([]);
  const [totals, setTotals] = useState({ calls: 0, revenue: 0, duration: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCarrierStats();
  }, []);
  
  const loadCarrierStats = async () => {
    try {
      const response = await apiClient.get('/carriers/stats');
      setCarrierData(response.data.carriers);
      setTotals(response.data.totals);
      setLoading(false);
    } catch (error) {
      console.error('Error loading carrier stats:', error);
      setLoading(false);
    }
  };
  
  // Carrier configurations with colors and icons
  const carrierConfig = {
    'STC': {
      name: 'STC',
      fullName: 'Saudi Telecom Company',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-300',
      icon: '📱',
      gradient: 'from-blue-400 via-blue-500 to-blue-600'
    },
    'Mobily': {
      name: 'Mobily',
      fullName: 'Etihad Etisalat (Mobily)',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500',
      textColor: 'text-green-300',
      icon: '📞',
      gradient: 'from-green-400 via-green-500 to-emerald-600'
    },
    'Zain': {
      name: 'Zain',
      fullName: 'Zain Saudi Arabia',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-300',
      icon: '📲',
      gradient: 'from-purple-400 via-purple-500 to-purple-600'
    },
    'Redbull': {
      name: 'Redbull',
      fullName: 'Redbull Mobile',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500',
      textColor: 'text-red-300',
      icon: '📡',
      gradient: 'from-red-400 via-red-500 to-red-600'
    },
    'Salam': {
      name: 'Salam',
      fullName: 'Salam Mobile',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-300',
      icon: '📶',
      gradient: 'from-orange-400 via-orange-500 to-orange-600'
    },
    'Unknown': {
      name: 'Unknown',
      fullName: 'Unknown Carrier',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500',
      textColor: 'text-gray-300',
      icon: '❓',
      gradient: 'from-gray-400 via-gray-500 to-gray-600'
    }
  };
  
  if (loading) {
    return (
      <div className="glass-strong rounded-3xl p-8 mb-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-32 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-strong rounded-3xl p-8 mb-8">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white neon-cyan flex items-center mb-2">
          <span className="text-4xl mr-3">📡</span>
          Access by Carrier
        </h2>
        <p className="text-gray-400">Calls breakdown by Saudi telecom providers</p>
      </div>
      
      {/* Total Summary Bar */}
      <div className="mb-8 p-6 glass rounded-2xl border border-white/20">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Total Calls</div>
            <div className="text-3xl font-bold text-white">
              <CountUp end={totals.calls} duration={2} />
            </div>
          </div>
          <div className="text-center border-l border-r border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-green-400">
              <CountUp end={totals.revenue} decimals={2} duration={2} /> SAR
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Total Duration</div>
            <div className="text-3xl font-bold text-cyan-400">
              <CountUp end={Math.floor(totals.duration / 60)} duration={2} /> min
            </div>
          </div>
        </div>
      </div>
      
      {/* Carrier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {carrierData.map((carrier, index) => {
          const config = carrierConfig[carrier.carrier] || carrierConfig['Unknown'];
          
          return (
            <div 
              key={carrier.carrier}
              className="glow-border glass-strong rounded-2xl p-6 card-3d group cursor-pointer"
              style={{animationDelay: `${index * 100}ms`}}
            >
              {/* Carrier Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="text-4xl mr-3 group-hover:animate-bounce">{config.icon}</div>
                  <div>
                    <div className={`text-xl font-bold ${config.textColor}`}>
                      {config.name}
                    </div>
                    <div className="text-xs text-gray-500">{config.fullName}</div>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="space-y-3 mb-4">
                {/* Calls */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Calls</span>
                  <div className="flex items-center">
                    <span className="text-white font-bold text-lg mr-2">
                      <CountUp end={carrier.totalCalls} duration={2} />
                    </span>
                    <span className={`text-xs ${config.textColor} font-semibold`}>
                      ({carrier.percentageCalls}%)
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar for Calls */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-1000 ease-out`}
                    style={{ width: `${carrier.percentageCalls}%` }}
                  ></div>
                </div>
                
                {/* Revenue */}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-gray-400 text-sm">Revenue</span>
                  <div className="flex items-center">
                    <span className="text-green-400 font-bold text-lg mr-2">
                      <CountUp end={carrier.totalRevenue} decimals={2} duration={2} /> SAR
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar for Revenue */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${carrier.percentageRevenue}%` }}
                  ></div>
                </div>
                
                {/* Duration */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Avg Duration</span>
                  <span className="text-cyan-400 font-semibold">
                    {Math.floor(carrier.avgDuration / 60)}m {Math.floor(carrier.avgDuration % 60)}s
                  </span>
                </div>
                
                {/* Avg Revenue */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Avg Revenue</span>
                  <span className="text-purple-400 font-semibold">
                    {carrier.avgRevenue.toFixed(2)} SAR
                  </span>
                </div>
              </div>
              
              {/* Hover Button */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button className={`w-full py-2 bg-gradient-to-r ${config.gradient} rounded-xl text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all`}>
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Visual Chart - Donut/Pie representation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calls Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Calls Distribution</h3>
          <div className="space-y-3">
            {carrierData.map((carrier) => {
              const config = carrierConfig[carrier.carrier] || carrierConfig['Unknown'];
              return (
                <div key={`calls-${carrier.carrier}`} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={config.textColor}>{config.icon} {config.name}</span>
                      <span className="text-white font-semibold">{carrier.percentageCalls}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-1000`}
                        style={{ width: `${carrier.percentageCalls}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Revenue Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Distribution</h3>
          <div className="space-y-3">
            {carrierData.map((carrier) => {
              const config = carrierConfig[carrier.carrier] || carrierConfig['Unknown'];
              return (
                <div key={`revenue-${carrier.carrier}`} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={config.textColor}>{config.icon} {config.name}</span>
                      <span className="text-green-400 font-semibold">{carrier.percentageRevenue}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${carrier.percentageRevenue}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2. Add to Main Dashboard

```javascript
// client/app/reseller/page.js - Add after numbers section
import CarrierAccessSection from '@/components/reseller/CarrierAccessSection';

export default function UltraModernDashboard() {
  // ... existing code ...
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient-xy relative overflow-hidden">
      {/* ... existing header and balance section ... */}
      
      {/* Numbers Section */}
      <div className="glass-strong rounded-3xl p-8 mb-8">
        {/* ... numbers cards ... */}
      </div>
      
      {/* NEW: CARRIER ACCESS SECTION */}
      <CarrierAccessSection />
      
      {/* ... rest of dashboard ... */}
    </div>
  );
}
```

## Visual Features

### Carrier Colors & Branding

**STC (Blue):**
- Gradient: Blue-400 → Blue-500 → Blue-600
- Icon: 📱
- Primary color: #3B82F6

**Mobily (Green):**
- Gradient: Green-400 → Green-500 → Emerald-600
- Icon: 📞
- Primary color: #10B981

**Zain (Purple):**
- Gradient: Purple-400 → Purple-500 → Purple-600
- Icon: 📲
- Primary color: #8B5CF6

**Redbull (Red):**
- Gradient: Red-400 → Red-500 → Red-600
- Icon: 📡
- Primary color: #EF4444

**Salam (Orange):**
- Gradient: Orange-400 → Orange-500 → Orange-600
- Icon: 📶
- Primary color: #F59E0B

### Design Elements

1. **Carrier Cards:**
   - Glassmorphism background
   - Animated glow borders
   - 3D hover effects
   - Progress bars
   - Count-up animations
   - Reveal buttons

2. **Summary Bar:**
   - Total calls, revenue, duration
   - Glassmorphism container
   - Large numbers
   - Center alignment

3. **Distribution Charts:**
   - Horizontal progress bars
   - Color-coded by carrier
   - Percentage labels
   - Smooth animations

4. **Interactive Elements:**
   - Hover scale transforms
   - Bounce animations on icons
   - Smooth transitions
   - Click-through to details

## Data Flow

```
Call Received → Detect Carrier (by prefix) → Store in DB
                                             ↓
                                    Update Carrier Stats
                                             ↓
                              Dashboard Shows Real-time Data
```

## Saudi Mobile Prefixes

```javascript
STC:      050, 053, 054, 055, 056, 059
Mobily:   050, 054, 055, 056
Zain:     057, 058, 059
Redbull:  051, 052
Salam:    053
```

## API Endpoints

```
GET /api/carriers/stats              - Get all carrier statistics
GET /api/carriers/:carrier/calls     - Get calls for specific carrier
```

## Features Summary

✅ **Automatic carrier detection** from phone numbers
✅ **Real-time statistics** per carrier
✅ **Beautiful visualizations** with brand colors
✅ **Percentage breakdowns** for calls and revenue
✅ **Progress bars** with animations
✅ **Count-up effects** for numbers
✅ **Interactive cards** with hover effects
✅ **Distribution charts** for easy comparison
✅ **Click-through details** for each carrier

This creates a stunning, informative section that shows exactly where calls are coming from!
