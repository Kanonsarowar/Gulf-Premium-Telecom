import { useState, useEffect, useRef } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [callData, setCallData] = useState({
    activeCalls: [],
    recentCalls: [],
    stats: {
      totalCalls: 0,
      activeCalls: 0,
      totalRevenue: 0
    }
  });
  
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = () => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleMessage = (message) => {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed');
        break;
        
      case 'call_new':
        setCallData(prev => ({
          ...prev,
          activeCalls: [...prev.activeCalls, message.data],
          stats: {
            ...prev.stats,
            activeCalls: prev.stats.activeCalls + 1,
            totalCalls: prev.stats.totalCalls + 1
          }
        }));
        break;
        
      case 'call_update':
        setCallData(prev => ({
          ...prev,
          activeCalls: prev.activeCalls.map(call =>
            call.callId === message.data.callId ? message.data : call
          )
        }));
        break;
        
      case 'call_ended':
        setCallData(prev => ({
          ...prev,
          activeCalls: prev.activeCalls.filter(call => call.callId !== message.data.callId),
          recentCalls: [message.data, ...prev.recentCalls].slice(0, 50),
          stats: {
            ...prev.stats,
            activeCalls: Math.max(0, prev.stats.activeCalls - 1),
            totalRevenue: prev.stats.totalRevenue + (message.data.revenue || 0)
          }
        }));
        break;
        
      case 'ivr_update':
        setCallData(prev => ({
          ...prev,
          activeCalls: prev.activeCalls.map(call =>
            call.callId === message.data.callId 
              ? { ...call, ivrData: message.data.ivrData }
              : call
          )
        }));
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { isConnected, callData, ws: ws.current };
}
