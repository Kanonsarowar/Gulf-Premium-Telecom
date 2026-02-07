'use client';

import { useState, useEffect } from 'react';
import { revenueApi } from '../lib/api';
import moment from 'moment';

export default function RevenueStats() {
  const [todayStats, setTodayStats] = useState(null);
  const [topCallers, setTopCallers] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const [todayRes, callersRes, hourlyRes] = await Promise.all([
        revenueApi.getToday(),
        revenueApi.getTopCallers(10),
        revenueApi.getHourly(moment().format('YYYY-MM-DD'))
      ]);

      setTodayStats(todayRes.data.data);
      setTopCallers(callersRes.data.data);
      setHourlyData(hourlyRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
          <p className="text-4xl font-bold mt-2">${(todayStats?.totalRevenue || 0).toFixed(2)}</p>
          <p className="text-sm opacity-75 mt-1">Today's earnings</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Calls</h3>
          <p className="text-4xl font-bold mt-2">{todayStats?.totalCalls || 0}</p>
          <p className="text-sm opacity-75 mt-1">Completed today</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Average Revenue</h3>
          <p className="text-4xl font-bold mt-2">${(todayStats?.avgRevenue || 0).toFixed(2)}</p>
          <p className="text-sm opacity-75 mt-1">Per call</p>
        </div>
      </div>

      {/* Hourly Revenue Chart */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Today's Hourly Revenue</h2>
        <div className="overflow-x-auto">
          <div className="flex items-end space-x-2 h-64 min-w-[800px]">
            {hourlyData.map((data) => {
              const maxRevenue = Math.max(...hourlyData.map(d => d.totalRevenue));
              const height = maxRevenue > 0 ? (data.totalRevenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={data.hour} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full">
                    <div 
                      className="bg-primary-500 hover:bg-primary-600 rounded-t transition-all duration-300 cursor-pointer"
                      style={{ height: `${height * 2}px`, minHeight: data.totalRevenue > 0 ? '20px' : '0px' }}
                      title={`${data.hour}:00 - ${data.count} calls, $${data.totalRevenue.toFixed(2)}`}
                    >
                      {data.totalRevenue > 0 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                          ${data.totalRevenue.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{data.hour}h</div>
                  <div className="text-xs text-gray-400">{data.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Callers by Revenue */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Top Callers by Revenue</h2>
        {topCallers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caller Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Calls
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCallers.map((caller, index) => (
                  <tr key={caller._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{caller._id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{caller.totalCalls}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Math.floor(caller.totalDuration / 60)}m {Math.floor(caller.totalDuration % 60)}s
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Math.floor(caller.avgDuration / 60)}m {Math.floor(caller.avgDuration % 60)}s
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        ${caller.totalRevenue.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Call Duration Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Duration</span>
              <span className="font-semibold">
                {Math.floor((todayStats?.totalDuration || 0) / 60)}m {Math.floor((todayStats?.totalDuration || 0) % 60)}s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Duration</span>
              <span className="font-semibold">
                {Math.floor((todayStats?.avgDuration || 0) / 60)}m {Math.floor((todayStats?.avgDuration || 0) % 60)}s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue Rate</span>
              <span className="font-semibold">${process.env.NEXT_PUBLIC_CALL_RATE || '0.10'}/min</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-green-600">
                ${(todayStats?.totalRevenue || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Revenue per Call</span>
              <span className="font-semibold">
                ${(todayStats?.avgRevenue || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Efficiency</span>
              <span className="font-semibold">
                {todayStats?.avgDuration > 0 
                  ? ((todayStats?.avgRevenue / (todayStats?.avgDuration / 60)) * 60).toFixed(2)
                  : '0.00'} $/hr
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
