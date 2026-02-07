'use client';

import { useState, useEffect } from 'react';
import { getDestinations, createDestination, type Destination } from '@/lib/api';

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDestination, setNewDestination] = useState({
    destinationNumber: '',
    destinationName: '',
    routingType: 'direct',
    status: 'active',
    maxChannels: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const dests = await getDestinations();
      setDestinations(dests);
    } catch (error) {
      console.error('Failed to load destinations:', error);
      alert('Failed to load destinations. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDestination(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createDestination({
        destinationNumber: newDestination.destinationNumber,
        destinationName: newDestination.destinationName || null,
        routingType: newDestination.routingType,
        status: newDestination.status,
        maxChannels: newDestination.maxChannels,
      });
      setShowCreateForm(false);
      setNewDestination({
        destinationNumber: '',
        destinationName: '',
        routingType: 'direct',
        status: 'active',
        maxChannels: 10,
      });
      loadData();
    } catch (error: any) {
      alert(`Failed to create destination: ${error.message}`);
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
          <h1 className="text-2xl font-semibold text-gray-900">Inbound Destinations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure inbound destination numbers and routing rules for Asterisk.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Destination
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Destination</h3>
          <form onSubmit={handleCreateDestination} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Destination Number *
                </label>
                <input
                  type="text"
                  required
                  value={newDestination.destinationNumber}
                  onChange={(e) => setNewDestination({ ...newDestination, destinationNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                  placeholder="e.g., +966112345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Destination Name
                </label>
                <input
                  type="text"
                  value={newDestination.destinationName}
                  onChange={(e) => setNewDestination({ ...newDestination, destinationName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                  placeholder="e.g., Sales Department"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Routing Type *
                </label>
                <select
                  value={newDestination.routingType}
                  onChange={(e) => setNewDestination({ ...newDestination, routingType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="direct">Direct</option>
                  <option value="queue">Queue</option>
                  <option value="ivr">IVR</option>
                  <option value="voicemail">Voicemail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Channels
                </label>
                <input
                  type="number"
                  min="1"
                  value={newDestination.maxChannels}
                  onChange={(e) => setNewDestination({ ...newDestination, maxChannels: parseInt(e.target.value) || 10 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={newDestination.status}
                  onChange={(e) => setNewDestination({ ...newDestination, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
                      Destination Number
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Routing Type
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Channels
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Allocations
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {destinations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                        No inbound destinations found. Create your first destination to get started.
                      </td>
                    </tr>
                  ) : (
                    destinations.map((destination) => (
                      <tr key={destination.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {destination.destinationNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {destination.destinationName || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            destination.routingType === 'direct' ? 'bg-blue-100 text-blue-800' :
                            destination.routingType === 'queue' ? 'bg-purple-100 text-purple-800' :
                            destination.routingType === 'ivr' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {destination.routingType}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {destination.currentChannels}/{destination.maxChannels}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {destination.allocations?.length || 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            destination.status === 'active' ? 'bg-green-100 text-green-800' :
                            destination.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {destination.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <a href="#" className="text-green-600 hover:text-green-900">
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
