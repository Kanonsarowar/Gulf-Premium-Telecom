'use client';

import { useState, useEffect } from 'react';
import RealtimeDashboard from '../components/RealtimeDashboard';
import ActiveCalls from '../components/ActiveCalls';
import RevenueStats from '../components/RevenueStats';
import CallHistory from '../components/CallHistory';
import { useWebSocket } from '../lib/websocket';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isConnected, callData } = useWebSocket();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-primary-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Gulf Premium Telecom</h1>
              <p className="text-primary-100 mt-1">Real-time Call Monitoring & Revenue Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('active-calls')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'active-calls'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Calls
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'revenue'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Call History
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <RealtimeDashboard />}
        {activeTab === 'active-calls' && <ActiveCalls />}
        {activeTab === 'revenue' && <RevenueStats />}
        {activeTab === 'history' && <CallHistory />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Gulf Premium Telecom. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
