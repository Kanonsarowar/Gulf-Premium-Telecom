# Reseller Dashboard - Numbers & Balance First View

## Updated Implementation: After Login Default View

When a reseller logs in, they immediately see:
1. **Balance Section** (top priority)
2. **Allocated Numbers** (with pricing and payment terms)
3. **Quick Statistics**

## Implementation

### 1. Updated Reseller Dashboard Component

```javascript
// client/app/reseller/page.js
'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ResellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [numbers, setNumbers] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      // Get user profile with balance
      const profileRes = await apiClient.get('/auth/profile');
      setUser(profileRes.data);
      setBalance(profileRes.data.currentBalance || 0);
      
      // Get allocated numbers
      const numbersRes = await apiClient.get('/numbers/reseller');
      setNumbers(numbersRes.data);
      
      // Get current week revenue
      const weekRes = await apiClient.get('/invoices/current');
      setCurrentWeek(weekRes.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your dashboard...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome, {user?.fullName}
            </h1>
            <p className="text-gray-400">Reseller Code: {user?.resellerCode}</p>
          </div>
          <button 
            onClick={() => router.push('/reseller/account')}
            className="px-6 py-3 bg-white/10 backdrop-blur-xl rounded-xl hover:bg-white/20 transition text-white border border-white/20"
          >
            Account Settings
          </button>
        </div>
        
        {/* SECTION 1: BALANCE - TOP PRIORITY */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm uppercase tracking-wider opacity-80 mb-2">
                💰 Main Balance
              </h2>
              <div className="text-6xl font-bold mb-4">
                {balance.toFixed(2)} <span className="text-3xl">SAR</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                  <div className="text-sm opacity-80">This Week</div>
                  <div className="text-2xl font-bold mt-1">
                    {currentWeek?.totalRevenue?.toFixed(2) || '0.00'} SAR
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                  <div className="text-sm opacity-80">Total Calls</div>
                  <div className="text-2xl font-bold mt-1">
                    {currentWeek?.totalCalls || 0}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                  <div className="text-sm opacity-80">Duration</div>
                  <div className="text-2xl font-bold mt-1">
                    {Math.floor((currentWeek?.totalDuration || 0) / 60)}m
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 mb-3">
                <div className="text-sm opacity-80">Next Reset</div>
                <div className="text-lg font-semibold">Sunday 00:00 UTC</div>
              </div>
              <button 
                onClick={() => router.push('/reseller/balance')}
                className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg"
              >
                View Invoices →
              </button>
            </div>
          </div>
        </div>
        
        {/* SECTION 2: ALLOCATED NUMBERS - SECOND PRIORITY */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">
              📞 Your Allocated Numbers
            </h2>
            <div className="text-white/60">
              {numbers.length} number{numbers.length !== 1 ? 's' : ''} assigned
            </div>
          </div>
          
          {numbers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                No numbers allocated yet
              </div>
              <p className="text-gray-500">
                Contact your administrator to get numbers assigned
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {numbers.map((number) => (
                <div 
                  key={number._id}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20"
                >
                  {/* Number Display */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-white">
                      {number.number}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      number.isActive 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {number.isActive ? '● Active' : '● Inactive'}
                    </div>
                  </div>
                  
                  {/* Test Number Badge */}
                  {number.isTestNumber && (
                    <div className="mb-3">
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold border border-yellow-500/30">
                        🧪 Test Number
                      </span>
                    </div>
                  )}
                  
                  {/* Pricing Information */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Price/Minute</span>
                      <span className="text-white font-bold text-lg">
                        {number.pricePerMinute.toFixed(3)} {number.currency}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Payment Term</span>
                      <span className="text-purple-300 font-semibold capitalize">
                        {number.paymentTerm}
                      </span>
                    </div>
                    
                    {/* Statistics */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Calls</span>
                        <span className="text-white font-semibold">
                          {number.totalCalls || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">Total Revenue</span>
                        <span className="text-green-300 font-semibold">
                          {(number.totalRevenue || 0).toFixed(2)} {number.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Last Call Info */}
                  {number.lastCallDate && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-gray-500">
                        Last call: {new Date(number.lastCallDate).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* SECTION 3: Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/reseller/live-calls')}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400 transition-all group text-left"
          >
            <div className="text-4xl mb-2">📞</div>
            <div className="text-white font-semibold mb-1">Live Calls</div>
            <div className="text-blue-300 text-sm group-hover:text-blue-200">
              Monitor active calls
            </div>
          </button>
          
          <button
            onClick={() => router.push('/reseller/cdr')}
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 hover:border-green-400 transition-all group text-left"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="text-white font-semibold mb-1">CDR Reports</div>
            <div className="text-green-300 text-sm group-hover:text-green-200">
              View call details
            </div>
          </button>
          
          <button
            onClick={() => router.push('/reseller/ivr')}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400 transition-all group text-left"
          >
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-white font-semibold mb-1">IVR Stats</div>
            <div className="text-purple-300 text-sm group-hover:text-purple-200">
              Menu analytics
            </div>
          </button>
          
          <button
            onClick={() => router.push('/reseller/test-number')}
            className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 hover:border-yellow-400 transition-all group text-left"
          >
            <div className="text-4xl mb-2">🧪</div>
            <div className="text-white font-semibold mb-1">Test Number</div>
            <div className="text-yellow-300 text-sm group-hover:text-yellow-200">
              Make test calls
            </div>
          </button>
        </div>
        
        {/* SECTION 4: Recent Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Performance */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">📈 Today's Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Calls</span>
                <span className="text-white text-2xl font-bold">
                  {currentWeek?.calls?.filter(c => 
                    new Date(c.callDate).toDateString() === new Date().toDateString()
                  ).length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Today's Revenue</span>
                <span className="text-green-300 text-2xl font-bold">
                  {(currentWeek?.calls?.filter(c => 
                    new Date(c.callDate).toDateString() === new Date().toDateString()
                  ).reduce((sum, call) => sum + (call.revenue || 0), 0) || 0).toFixed(2)} SAR
                </span>
              </div>
            </div>
          </div>
          
          {/* Invoice Alert */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
            <h3 className="text-xl font-bold text-white mb-4">📅 Next Invoice</h3>
            <div className="space-y-2">
              <p className="text-orange-200">
                Your balance will be automatically invoiced and reset to 0 SAR every Sunday at midnight UTC.
              </p>
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-gray-300">Next Reset In</div>
                <div className="text-2xl font-bold text-white">
                  {(() => {
                    const now = new Date();
                    const nextSunday = new Date(now);
                    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
                    nextSunday.setUTCHours(0, 0, 0, 0);
                    const diff = nextSunday - now;
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    return `${days}d ${hours}h`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
```

### 2. Update Login to Redirect to Dashboard

```javascript
// client/app/login/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await apiClient.post('/auth/login', formData);
      
      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      if (response.data.user.role === 'admin') {
        router.push('/admin');
      } else if (response.data.user.role === 'reseller') {
        // AUTOMATICALLY REDIRECT TO RESELLER DASHBOARD
        // This shows numbers and balance first
        router.push('/reseller');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Gulf Premium Telecom
          </h1>
          <p className="text-gray-300 text-center mb-8">
            Reseller Portal Login
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### 3. Backend Route to Get Numbers

```javascript
// server/routes/numberRoutes.js - Updated
const express = require('express');
const router = express.Router();
const Number = require('../models/Number');
const { authMiddleware } = require('../middleware/auth');

// Get reseller's allocated numbers
router.get('/reseller', authMiddleware, async (req, res) => {
  try {
    const numbers = await Number.find({ 
      resellerId: req.user._id,
      isActive: true // Can remove this to show inactive too
    }).sort({ number: 1 });
    
    res.json(numbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get number details with statistics
router.get('/reseller/:numberId', authMiddleware, async (req, res) => {
  try {
    const number = await Number.findOne({
      _id: req.params.numberId,
      resellerId: req.user._id
    });
    
    if (!number) {
      return res.status(404).json({ error: 'Number not found' });
    }
    
    res.json(number);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 4. Auth Profile Route with Balance

```javascript
// server/routes/authRoutes.js - Updated
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Include balance and related info
    const profileData = {
      ...user.toObject(),
      currentBalance: user.currentBalance || 0,
      lastBalanceReset: user.lastBalanceReset,
      lastInvoiceDate: user.lastInvoiceDate
    };
    
    res.json(profileData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Key Features of Updated Dashboard

### 1. **Balance Section (Top)**
- Large, prominent display
- Shows current balance in SAR
- This week's revenue
- Quick stats (calls, duration)
- Next reset countdown
- Direct link to invoices

### 2. **Allocated Numbers (Second)**
- Grid layout for all numbers
- Each card shows:
  - Number with active status
  - Test number badge (if applicable)
  - Price per minute in SAR
  - Payment term
  - Total calls and revenue
  - Last call date
- Beautiful glassmorphism design
- Hover effects

### 3. **Quick Actions**
- Easy navigation to other sections
- Visual icons
- Live calls, CDR, IVR, Test number

### 4. **Today's Performance**
- Current day statistics
- Invoice alert with countdown

## Visual Design Features

- ✅ Gradient background (slate-900 → purple-900)
- ✅ Glassmorphism cards
- ✅ Large, readable numbers
- ✅ Color-coded status badges
- ✅ Smooth hover effects
- ✅ Responsive grid layout
- ✅ SAR currency prominently displayed
- ✅ Payment terms clearly shown

## User Flow

1. User logs in with credentials
2. System checks role
3. If reseller → Automatically redirects to `/reseller`
4. Dashboard loads showing:
   - **Balance at top** (most important)
   - **Numbers below** (what they can use)
   - Quick actions and stats

## Implementation Steps

1. Create the updated dashboard component
2. Update login redirect logic
3. Ensure API routes return correct data
4. Test the automatic redirect
5. Verify all data displays correctly

This gives resellers an immediate, clear view of:
- How much they've earned (balance)
- What numbers they can use (allocated numbers with pricing)
- Quick access to other features
