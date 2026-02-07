'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../lib/websocket';
import { revenueApi } from '../lib/api';
import moment from 'moment';

export default function RealtimeDashboard() {
  const { callData } = useWebSocket();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await revenueApi.getDashboard();
      setDashboardData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const todayStats = dashboardData?.today || {};
  const hourStats = dashboardData?.thisHour || {};

  return (
    <div className="space-y-6">
      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Active Calls</h3>
          <p className="text-4xl font-bold mt-2">{callData.activeCalls.length}</p>
          <p className="text-sm opacity-75 mt-1">Currently in progress</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Today's Calls</h3>
          <p className="text-4xl font-bold mt-2">{todayStats.totalCalls || 0}</p>
          <p className="text-sm opacity-75 mt-1">Total calls today</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Today's Revenue</h3>
          <p className="text-4xl font-bold mt-2">
            ${(todayStats.totalRevenue || 0).toFixed(2)}
          </p>
          <p className="text-sm opacity-75 mt-1">Revenue generated</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <h3 className="text-sm font-medium opacity-90">This Hour</h3>
          <p className="text-4xl font-bold mt-2">{hourStats.totalCalls || 0}</p>
          <p className="text-sm opacity-75 mt-1">
            ${(hourStats.totalRevenue || 0).toFixed(2)} revenue
          </p>
        </div>
      </div>

      {/* Active Calls Table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Active Calls</h2>
        {callData.activeCalls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active calls at the moment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IVR Option
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {callData.activeCalls.map((call) => (
                  <tr key={call.callId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {call.callerNumber}
                      </div>
                      <div className="text-sm text-gray-500">{call.callerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge status-${call.status}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.answerTime 
                        ? moment.duration(moment().diff(moment(call.answerTime))).humanize()
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.ivrData?.IVR_OPTION || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(call.startTime).format('HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Completed Calls */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Completed Calls</h2>
        {callData.recentCalls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent calls</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {callData.recentCalls.slice(0, 10).map((call) => (
                  <tr key={call.callId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {call.callerNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.floor(call.duration / 60)}m {call.duration % 60}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${call.revenue?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(call.endTime).format('HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7-Day Trend */}
      {dashboardData?.last7Days && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">7-Day Trend</h2>
          <div className="grid grid-cols-7 gap-2">
            {dashboardData.last7Days.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {moment(day.date).format('ddd')}
                </div>
                <div className="bg-primary-100 rounded p-2">
                  <div className="text-lg font-bold text-primary-700">
                    {day.stats.totalCalls || 0}
                  </div>
                  <div className="text-xs text-gray-600">calls</div>
                  <div className="text-sm font-medium text-green-600 mt-1">
                    ${(day.stats.totalRevenue || 0).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
