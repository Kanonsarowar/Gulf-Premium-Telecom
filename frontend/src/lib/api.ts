const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Allocation {
  id: string;
  allocatedNumber: string;
  destinationId?: string | null;
  customerId?: string | null;
  status: string;
  allocatedAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  destination?: Destination | null;
  customer?: any;
}

export interface Destination {
  id: string;
  destinationNumber: string;
  destinationName?: string | null;
  routingType: string;
  countryCode?: string | null;
  areaCode?: string | null;
  trunkId?: string | null;
  status: string;
  maxChannels: number;
  currentChannels: number;
  createdAt: string;
  updatedAt: string;
  allocations?: Allocation[];
  trunk?: any;
}

export interface SystemStatus {
  asterisk: {
    connected: boolean;
    status: string;
  };
  database: {
    connected: boolean;
    status: string;
  };
  statistics: {
    totalAllocations: number;
    activeAllocations: number;
    totalDestinations: number;
  };
  timestamp: string;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_URL}/api/system/status`, {
    cache: 'no-store',
  });
  const data = await res.json();
  return data.data;
}

export async function syncToAsterisk(): Promise<any> {
  const res = await fetch(`${API_URL}/api/system/sync-asterisk`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to sync');
  }
  return data;
}

export async function getAllocations(): Promise<Allocation[]> {
  const res = await fetch(`${API_URL}/api/allocations`, {
    cache: 'no-store',
  });
  const data = await res.json();
  return data.data || [];
}

export async function createAllocation(allocation: Partial<Allocation>): Promise<Allocation> {
  const res = await fetch(`${API_URL}/api/allocations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(allocation),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to create allocation');
  }
  return data.data;
}

export async function updateAllocation(id: string, allocation: Partial<Allocation>): Promise<Allocation> {
  const res = await fetch(`${API_URL}/api/allocations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(allocation),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update allocation');
  }
  return data.data;
}

export async function deleteAllocation(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/allocations/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete allocation');
  }
}

export async function linkAllocation(id: string, destinationId: string): Promise<Allocation> {
  const res = await fetch(`${API_URL}/api/allocations/${id}/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ destinationId }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to link allocation');
  }
  return data.data;
}

export async function getDestinations(): Promise<Destination[]> {
  const res = await fetch(`${API_URL}/api/destinations`, {
    cache: 'no-store',
  });
  const data = await res.json();
  return data.data || [];
}

export async function createDestination(destination: Partial<Destination>): Promise<Destination> {
  const res = await fetch(`${API_URL}/api/destinations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(destination),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to create destination');
  }
  return data.data;
}

export async function updateDestination(id: string, destination: Partial<Destination>): Promise<Destination> {
  const res = await fetch(`${API_URL}/api/destinations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(destination),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update destination');
  }
  return data.data;
}

export async function deleteDestination(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/destinations/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete destination');
  }
}
