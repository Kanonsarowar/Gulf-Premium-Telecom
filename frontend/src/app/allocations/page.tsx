'use client';

import { useState, useEffect } from 'react';
import { getAllocations, getDestinations, createAllocation, linkAllocation, type Allocation, type Destination } from '@/lib/api';

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    allocatedNumber: '',
    destinationId: '',
    status: 'active',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [allocs, dests] = await Promise.all([
        getAllocations(),
        getDestinations(),
      ]);
      setAllocations(allocs);
      setDestinations(dests);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAllocation(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAllocation({
        allocatedNumber: newAllocation.allocatedNumber,
        destinationId: newAllocation.destinationId || null,
        status: newAllocation.status,
      });
      setShowCreateForm(false);
      setNewAllocation({ allocatedNumber: '', destinationId: '', status: 'active' });
      alert(`✅ Allocation number ${newAllocation.allocatedNumber} created successfully!\n\n${
        newAllocation.destinationId 
          ? '🎯 Asterisk has been automatically configured for IP-to-IP routing.'
          : 'ℹ️  Link to a destination to enable Asterisk routing.'
      }`);
      loadData();
    } catch (error: any) {
      alert(`Failed to create allocation: ${error.message}`);
    }
  }

  async function handleLinkDestination(allocationId: string, destinationId: string) {
    try {
      await linkAllocation(allocationId, destinationId);
      alert('✅ Allocation linked to destination successfully!\n\n🎯 Asterisk has been automatically configured for IP-to-IP routing.');
      loadData();
    } catch (error: any) {
      alert(`Failed to link allocation: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Allocation Numbers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage allocation numbers and link them to inbound destinations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Allocation
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Allocation</h3>
          <form onSubmit={handleCreateAllocation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allocated Number *
              </label>
              <input
                type="text"
                required
                value={newAllocation.allocatedNumber}
                onChange={(e) => setNewAllocation({ ...newAllocation, allocatedNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g., +966501234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Destination (Optional)
              </label>
              <select
                value={newAllocation.destinationId}
                onChange={(e) => setNewAllocation({ ...newAllocation, destinationId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="">-- Select Destination --</option>
                {destinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.destinationNumber} - {dest.destinationName || 'Unnamed'} ({dest.routingType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={newAllocation.status}
                onChange={(e) => setNewAllocation({ ...newAllocation, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Allocated Number
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Linked Destination
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Allocated At
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                        No allocation numbers found. Create your first allocation to get started.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((allocation) => (
                      <tr key={allocation.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {allocation.allocatedNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {allocation.destination ? (
                            <div>
                              <div className="font-medium text-gray-900">
                                {allocation.destination.destinationNumber}
                              </div>
                              <div className="text-gray-500">
                                {allocation.destination.destinationName || 'Unnamed'} ({allocation.destination.routingType})
                              </div>
                            </div>
                          ) : (
                            <select
                              onChange={(e) => e.target.value && handleLinkDestination(allocation.id, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">-- Link to Destination --</option>
                              {destinations.map((dest) => (
                                <option key={dest.id} value={dest.id}>
                                  {dest.destinationNumber} - {dest.destinationName || 'Unnamed'}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            allocation.status === 'active' ? 'bg-green-100 text-green-800' :
                            allocation.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {allocation.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(allocation.allocatedAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <a href="#" className="text-blue-600 hover:text-blue-900">
                            Edit
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
