'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../lib/websocket';
import { callsApi } from '../lib/api';
import moment from 'moment';

export default function ActiveCalls() {
  const { callData } = useWebSocket();
  const [selectedCall, setSelectedCall] = useState(null);

  const handleHangup = async (channel) => {
    if (confirm('Are you sure you want to hangup this call?')) {
      try {
        await callsApi.hangup(channel);
        alert('Hangup command sent successfully');
      } catch (error) {
        console.error('Error hanging up call:', error);
        alert('Failed to hangup call');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Active Calls ({callData.activeCalls.length})</h2>
        </div>

        {callData.activeCalls.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active calls</h3>
            <p className="mt-1 text-sm text-gray-500">Waiting for incoming calls...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {callData.activeCalls.map((call) => (
              <div key={call.callId} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCall(call)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{call.callerNumber}</h3>
                        <p className="text-sm text-gray-500">{call.callerName || 'Unknown Caller'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`status-badge status-${call.status}`}>
                            {call.status}
                          </span>
                          {call.ivrData?.IVR_OPTION && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              IVR: {call.ivrData.IVR_OPTION}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {call.answerTime 
                        ? moment.duration(moment().diff(moment(call.answerTime))).humanize()
                        : 'Ringing...'
                      }
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Started: {moment(call.startTime).format('HH:mm:ss')}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHangup(call.channelId);
                      }}
                      className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                    >
                      Hangup
                    </button>
                  </div>
                </div>

                {/* Call Events Timeline */}
                {call.events && call.events.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Call Timeline</h4>
                    <div className="space-y-2">
                      {call.events.slice(-5).map((event, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                          <span className="font-medium mr-2">{event.type}:</span>
                          <span>{event.state || event.destination || 'Event occurred'}</span>
                          <span className="ml-auto text-gray-400">
                            {moment(event.timestamp).format('HH:mm:ss')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                  <label className="text-sm font-medium text-gray-500">Channel ID</label>
                  <p className="text-sm text-gray-900">{selectedCall.channelId}</p>
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
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm"><span className={`status-badge status-${selectedCall.status}`}>{selectedCall.status}</span></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Direction</label>
                  <p className="text-sm text-gray-900">{selectedCall.direction}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Time</label>
                  <p className="text-sm text-gray-900">{moment(selectedCall.startTime).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
                {selectedCall.answerTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Answer Time</label>
                    <p className="text-sm text-gray-900">{moment(selectedCall.answerTime).format('YYYY-MM-DD HH:mm:ss')}</p>
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
                  <label className="text-sm font-medium text-gray-500">All Events</label>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {selectedCall.events.map((event, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{event.type}</div>
                        <div className="text-gray-600 mt-1">
                          {Object.entries(event).map(([key, value]) => {
                            if (key !== 'type' && value) {
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
