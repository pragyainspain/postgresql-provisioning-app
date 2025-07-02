import React, { useState, useEffect } from 'react';
import { LogOut, Database, Plus, RefreshCw } from 'lucide-react';
import { GitHubUser, InstancesResponse } from '../types';
import { instanceService, cacheService } from '../services/api';
import InstanceList from './InstanceList';
import CreateInstance from './CreateInstance';

interface DashboardProps {
  user: GitHubUser;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [instancesData, setInstancesData] = useState<InstancesResponse | null>(null);
  const [availableInstances, setAvailableInstances] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchInstances = async () => {
    try {
      const data = await instanceService.getInstances();
      setInstancesData(data);
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  };

  const fetchAvailableInstances = async () => {
    try {
      const data = await cacheService.getAvailable();
      setAvailableInstances(data.availableCount);
    } catch (error) {
      console.error('Error fetching available instances:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchInstances(), fetchAvailableInstances()]);
    setLoading(false);
  };

  useEffect(() => {
    const initDashboard = async () => {
      await Promise.all([fetchInstances(), fetchAvailableInstances()]);
      setLoading(false);
    };

    initDashboard();
  }, []);

  const handleInstanceCreated = () => {
    setShowCreateModal(false);
    handleRefresh();
  };

  const handleInstanceDeleted = () => {
    handleRefresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                PostgreSQL Cloud
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.login}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.name || user.login}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Your Instances</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {instancesData?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Plus className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Available Slots</h3>
                <p className="text-2xl font-bold text-green-600">
                  {instancesData ? instancesData.maxInstances - instancesData.count : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RefreshCw className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Cache Available</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {availableInstances}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your PostgreSQL Instances</h2>
          
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!instancesData?.canCreateMore || availableInstances === 0}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Instance
          </button>
        </div>

        {/* Quota Warning */}
        {instancesData && !instancesData.canCreateMore && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              You've reached the maximum limit of {instancesData.maxInstances} instances per user.
              Delete an existing instance to create a new one.
            </p>
          </div>
        )}

        {/* No Available Instances Warning */}
        {availableInstances === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              No PostgreSQL instances are currently available in the cache. Please try again later.
            </p>
          </div>
        )}

        {/* Instances List */}
        {instancesData && (
          <InstanceList
            instances={instancesData.instances}
            onInstanceDeleted={handleInstanceDeleted}
          />
        )}

        {/* Create Instance Modal */}
        {showCreateModal && (
          <CreateInstance
            onClose={() => setShowCreateModal(false)}
            onInstanceCreated={handleInstanceCreated}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
