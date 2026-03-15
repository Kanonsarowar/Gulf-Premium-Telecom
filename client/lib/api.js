import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const callsApi = {
  getAll: (page = 1, limit = 50) => 
    api.get(`/api/calls?page=${page}&limit=${limit}`),
  
  getActive: () => 
    api.get('/api/calls/active'),
  
  getById: (callId) => 
    api.get(`/api/calls/${callId}`),
  
  getByCaller: (number) => 
    api.get(`/api/calls/caller/${number}`),
  
  getByDateRange: (startDate, endDate) => 
    api.post('/api/calls/date-range', { startDate, endDate }),
  
  hangup: (channel) => 
    api.post(`/api/calls/hangup/${channel}`),
};

export const revenueApi = {
  getToday: () => 
    api.get('/api/revenue/today'),
  
  getRange: (startDate, endDate) => 
    api.post('/api/revenue/range', { startDate, endDate }),
  
  getHourly: (date) => 
    api.get(`/api/revenue/hourly/${date}`),
  
  getMonthly: (year, month) => 
    api.get(`/api/revenue/monthly/${year}/${month}`),
  
  getTopCallers: (limit = 10) => 
    api.get(`/api/revenue/top-callers/${limit}`),
  
  getDashboard: () => 
    api.get('/api/revenue/dashboard/realtime'),
};

export const healthCheck = () => 
  api.get('/health');

export default api;
