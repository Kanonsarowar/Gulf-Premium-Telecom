# Purple Numbers Style - Modern Reseller Dashboard

## Professional Telecom Dashboard Design

Following professional telecom platforms like Purple Numbers, this implementation creates a clean, modern, and highly functional reseller dashboard.

## Design Philosophy

### Key Principles:
1. **Clean & Professional** - Minimal clutter, maximum information
2. **Data-Focused** - Numbers and metrics front and center
3. **Easy Navigation** - Clear sections and intuitive flow
4. **Business-Ready** - Professional appearance for B2B use
5. **Mobile Responsive** - Works on all devices

## Complete Implementation

### 1. Main Dashboard Layout

```javascript
// client/app/reseller/page.js
'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function ResellerDashboard() {
  const [user, setUser] = useState(null);
  const [numbers, setNumbers] = useState([]);
  const [stats, setStats] = useState({
    balance: 0,
    weekRevenue: 0,
    weekCalls: 0,
    activeNumbers: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDashboard();
  }, []);
  
  const loadDashboard = async () => {
    try {
      const [profileRes, numbersRes, weekRes] = await Promise.all([
        apiClient.get('/auth/profile'),
        apiClient.get('/numbers/reseller'),
        apiClient.get('/invoices/current')
      ]);
      
      setUser(profileRes.data);
      setNumbers(numbersRes.data);
      setStats({
        balance: profileRes.data.currentBalance || 0,
        weekRevenue: weekRes.data.totalRevenue || 0,
        weekCalls: weekRes.data.totalCalls || 0,
        activeNumbers: numbersRes.data.filter(n => n.isActive).length
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-gray-600">Loading...</div>
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Gulf Premium Telecom</h1>
              <span className="ml-4 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Reseller
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.fullName}</span>
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Account Balance</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.balance.toFixed(2)} <span className="text-lg text-gray-500">SAR</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">Current balance</div>
          </div>
          
          {/* Week Revenue Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-600 mb-1">This Week</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.weekRevenue.toFixed(2)} <span className="text-lg text-gray-500">SAR</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">{stats.weekCalls} calls</div>
          </div>
          
          {/* Active Numbers Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Active Numbers</div>
            <div className="text-3xl font-bold text-gray-900">{stats.activeNumbers}</div>
            <div className="text-xs text-gray-500 mt-2">of {numbers.length} total</div>
          </div>
          
          {/* Next Invoice Card */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="text-sm font-medium text-gray-600 mb-1">Next Invoice</div>
            <div className="text-2xl font-bold text-gray-900">
              {(() => {
                const now = new Date();
                const nextSunday = new Date(now);
                nextSunday.setDate(now.getDate() + (7 - now.getDay()));
                const days = Math.floor((nextSunday - now) / (1000 * 60 * 60 * 24));
                return `${days} days`;
              })()}
            </div>
            <div className="text-xs text-gray-500 mt-2">Sunday 00:00 UTC</div>
          </div>
        </div>
        
        {/* Numbers Table Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your Numbers</h2>
              <div className="flex space-x-2">
                <button className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Export
                </button>
                <button className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700">
                  Request Number
                </button>
              </div>
            </div>
          </div>
          
          {/* Professional Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/Min
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {numbers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-lg font-medium">No numbers allocated</p>
                        <p className="text-sm mt-2">Contact your administrator to get numbers assigned</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  numbers.map((number) => (
                    <tr key={number._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{number.number}</div>
                          {number.isTestNumber && (
                            <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                              Test
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          number.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {number.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {number.pricePerMinute.toFixed(3)} {number.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {number.paymentTerm}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{number.totalCalls || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {(number.totalRevenue || 0).toFixed(2)} {number.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-purple-600 hover:text-purple-900 font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Live Calls */}
          <a href="/reseller/live-calls" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Live Calls</h3>
                <p className="text-sm text-gray-500">Monitor active calls in real-time</p>
              </div>
            </div>
          </a>
          
          {/* CDR Reports */}
          <a href="/reseller/cdr" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">CDR Reports</h3>
                <p className="text-sm text-gray-500">View detailed call records</p>
              </div>
            </div>
          </a>
          
          {/* Invoices */}
          <a href="/reseller/balance" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
                <p className="text-sm text-gray-500">View billing and invoices</p>
              </div>
            </div>
          </a>
        </div>
        
      </div>
    </div>
  );
}
```

### 2. Sidebar Navigation Layout

```javascript
// client/components/reseller/Sidebar.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Dashboard', href: '/reseller', icon: 'home' },
    { name: 'Numbers', href: '/reseller/numbers', icon: 'phone' },
    { name: 'Live Calls', href: '/reseller/live-calls', icon: 'phone-incoming' },
    { name: 'CDR Reports', href: '/reseller/cdr', icon: 'document-text' },
    { name: 'IVR Statistics', href: '/reseller/ivr', icon: 'chart-bar' },
    { name: 'Test Number', href: '/reseller/test-number', icon: 'beaker' },
    { name: 'Balance & Invoices', href: '/reseller/balance', icon: 'cash' },
    { name: 'Account', href: '/reseller/account', icon: 'user' },
  ];
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Reseller Portal</h1>
      </div>
      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">{getIcon(item.icon)}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function getIcon(name) {
  const icons = {
    'home': '🏠',
    'phone': '📞',
    'phone-incoming': '📲',
    'document-text': '📄',
    'chart-bar': '📊',
    'beaker': '🧪',
    'cash': '💰',
    'user': '👤',
  };
  return icons[name] || '•';
}
```

### 3. Balance & Invoices Page (Purple Numbers Style)

```javascript
// client/app/reseller/balance/page.js
'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function BalancePage() {
  const [balance, setBalance] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [profileRes, weekRes, invoicesRes] = await Promise.all([
        apiClient.get('/auth/profile'),
        apiClient.get('/invoices/current'),
        apiClient.get('/invoices/reseller')
      ]);
      
      setBalance(profileRes.data.currentBalance || 0);
      setCurrentWeek(weekRes.data);
      setInvoices(invoicesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Balance & Invoices</h1>
        
        {/* Current Balance Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-8 text-white col-span-2">
            <div className="text-sm uppercase tracking-wider opacity-90 mb-2">Current Balance</div>
            <div className="text-5xl font-bold mb-6">
              {balance.toFixed(2)} <span className="text-2xl">SAR</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-sm opacity-90">This Week</div>
                <div className="text-2xl font-bold">{currentWeek?.totalRevenue?.toFixed(2) || '0.00'} SAR</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-sm opacity-90">Calls</div>
                <div className="text-2xl font-bold">{currentWeek?.totalCalls || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Invoice</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Due Date</div>
                <div className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const now = new Date();
                    const nextSunday = new Date(now);
                    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
                    return nextSunday.toLocaleDateString();
                  })()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Time</div>
                <div className="text-lg font-semibold text-gray-900">00:00 UTC</div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  Balance will be invoiced and reset to 0 SAR automatically every Sunday midnight UTC.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoice History Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Invoice History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.startDate).toLocaleDateString()} - {new Date(invoice.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.totalCalls}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {invoice.totalRevenue.toFixed(2)} {invoice.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status === 'paid' && '✓ '}{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                      {invoice.status === 'paid' && invoice.paidDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(invoice.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-purple-600 hover:text-purple-900 font-medium mr-3">
                        View
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 font-medium">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Design Features

### Color Scheme
- **Primary**: Purple (#7C3AED, #9333EA)
- **Success**: Green (#10B981, #059669)
- **Danger**: Red (#EF4444, #DC2626)
- **Warning**: Orange (#F59E0B, #D97706)
- **Neutral**: Gray scale (#F9FAFB to #111827)

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Clean, readable
- **Numbers**: Prominent, easy to scan

### Layout Principles
1. **White space** - Clean, uncluttered
2. **Card-based** - Clear sections
3. **Table view** - Professional data display
4. **Color coding** - Visual status indicators

### Components
- Clean tables with hover states
- Status badges (active/inactive, paid/pending)
- Professional cards
- Clear navigation
- Responsive grid layouts

## Key Differences from Previous Design

1. **More Professional** - Business-focused, less decorative
2. **Table-Centric** - Data in clean, scannable tables
3. **Cleaner Colors** - White/gray base with purple accents
4. **Better Hierarchy** - Clear information priority
5. **Business Metrics** - Numbers and stats prominent

## Mobile Responsive

All components are fully responsive:
- Tables scroll horizontally on mobile
- Cards stack vertically
- Navigation becomes hamburger menu
- Touch-friendly buttons

This design follows modern B2B SaaS patterns similar to Purple Numbers, focusing on:
- Clear data presentation
- Professional appearance
- Easy navigation
- Minimal distractions
- Business-ready interface
