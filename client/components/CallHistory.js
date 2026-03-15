'use client';

import { useState, useEffect } from 'react';
import { callsApi } from '../lib/api';
import moment from 'moment';

export default function CallHistory() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => {
    fetchCalls(1);
  }, []);

  const fetchCalls = async (page) => {
    setLoading(true);
    try {
      const response = await callsApi.getAll(page, pagination.limit);
      setCalls(response.data.data);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calls:', error);
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCalls(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading call history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Call History</h2>
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} calls
          </div>
        </div>

        {calls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No call history available</p>
        ) : (
          <>
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
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call.callId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{call.callerNumber}</div>
                        <div className="text-sm text-gray-500">{call.callerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge status-${call.status}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.duration > 0 
                          ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${call.revenue?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {moment(call.startTime).format('MMM DD, HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.endTime ? moment(call.endTime).format('MMM DD, HH:mm:ss') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            pagination.page === pageNum
                              ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCall(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Call Details</h2>
              <button onClick={() => setSelectedCall(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Call ID</label>
                  <p className="text-sm text-gray-900">{selectedCall.callId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p><span className={`status-badge status-${selectedCall.status}`}>{selectedCall.status}</span></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Caller Number</label>
                  <p className="text-sm text-gray-900">{selectedCall.callerNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Caller Name</label>
                  <p className="text-sm text-gray-900">{selectedCall.callerName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm text-gray-900">
                    {selectedCall.duration > 0 
                      ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Revenue</label>
                  <p className="text-sm font-bold text-green-600">${selectedCall.revenue?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Time</label>
                  <p className="text-sm text-gray-900">{moment(selectedCall.startTime).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Time</label>
                  <p className="text-sm text-gray-900">
                    {selectedCall.endTime ? moment(selectedCall.endTime).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                  </p>
                </div>
                {selectedCall.hangupCauseText && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Hangup Cause</label>
                    <p className="text-sm text-gray-900">{selectedCall.hangupCauseText}</p>
                  </div>
                )}
              </div>

              {selectedCall.ivrData && Object.keys(selectedCall.ivrData).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">IVR Data</label>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedCall.ivrData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedCall.events && selectedCall.events.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Call Events</label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {selectedCall.events.map((event, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{event.type}</div>
                        <div className="text-gray-600 mt-1">
                          {Object.entries(event).map(([key, value]) => {
                            if (key !== 'type' && key !== '_id' && value) {
                              return (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {value.toString()}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
