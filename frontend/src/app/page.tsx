'use client';

import { useState, useEffect } from 'react';
import { getSystemStatus, type SystemStatus } from '@/lib/api';

export default function HomePage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Gulf Premium Telecom IPRN
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your allocation numbers and inbound destinations with automatic Asterisk integration.
        </p>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Allocation Numbers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {systemStatus ? `${systemStatus.statistics.activeAllocations}/${systemStatus.statistics.totalAllocations} Active` : '-'}
                    </dd>
                    <dd className="text-sm text-blue-600">
                      <a href="/allocations" className="hover:text-blue-500">
                        Manage →
                      </a>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inbound Destinations
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {systemStatus ? systemStatus.statistics.totalDestinations : '-'}
                    </dd>
                    <dd className="text-sm text-green-600">
                      <a href="/destinations" className="hover:text-green-500">
                        Manage →
                      </a>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-6 w-6 ${systemStatus?.asterisk.connected ? 'text-green-600' : 'text-red-600'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Asterisk PBX
                    </dt>
                    <dd className={`text-lg font-medium ${systemStatus?.asterisk.connected ? 'text-green-600' : 'text-red-600'}`}>
                      {loading ? 'Checking...' : (systemStatus?.asterisk.connected ? 'Online' : 'Offline')}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      Auto-configured
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Automatic Asterisk Configuration
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  When you create an allocation number from the frontend, it automatically:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Adds the number to the backend database</li>
                  <li>Configures Asterisk dialplan for inbound routing</li>
                  <li>Sets up IP-to-IP routing rules</li>
                  <li>Reloads Asterisk configuration automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Start</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Create an inbound destination with routing configuration</li>
            <li>Create an allocation number</li>
            <li>Link the allocation number to the inbound destination</li>
            <li>Asterisk is automatically configured for IP-to-IP routing!</li>
            <li>Start receiving calls on your allocated numbers</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
