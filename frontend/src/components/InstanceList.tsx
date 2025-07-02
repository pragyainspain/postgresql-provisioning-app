import React, { useState } from 'react';
import { Database, Trash2, Copy, Eye, EyeOff, MapPin, Calendar } from 'lucide-react';
import { InstanceMetadata } from '../types';
import { instanceService } from '../services/api';

interface InstanceListProps {
  instances: InstanceMetadata[];
  onInstanceDeleted: () => void;
}

const InstanceList: React.FC<InstanceListProps> = ({ instances, onInstanceDeleted }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const togglePasswordVisibility = (instanceId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(instanceId)) {
      newVisible.delete(instanceId);
    } else {
      newVisible.add(instanceId);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDelete = async (instanceId: string) => {
    if (!confirm('Are you sure you want to delete this instance? This action cannot be undone.')) {
      return;
    }

    setDeletingId(instanceId);
    try {
      await instanceService.deleteInstance(instanceId);
      onInstanceDeleted();
    } catch (error) {
      console.error('Error deleting instance:', error);
      alert('Failed to delete instance. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConnectionString = (instance: InstanceMetadata) => {
    return `postgresql://${instance.adminUser}:${instance.password}@${instance.host}:5432/postgres`;
  };

  if (instances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No PostgreSQL instances</h3>
        <p className="text-gray-500 mb-6">
          You haven't created any PostgreSQL instances yet. Click "Create New Instance" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {instances.map((instance) => (
        <div key={instance.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-primary-100 rounded-lg p-3">
                  <Database className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {instance.instanceName}
                  </h3>
                  <p className="text-sm text-gray-500">Instance ID: {instance.id}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(instance.id)}
                disabled={deletingId === instance.id}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete instance"
              >
                {deletingId === instance.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Instance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Region:</span>
                  <span className="ml-2 font-medium">{instance.region}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(instance.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Connection Details */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Connection Details</h4>
              
              <div className="space-y-3">
                {/* Hostname */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Hostname
                    </label>
                    <code className="text-sm font-mono text-gray-900">{instance.host}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(instance.host, `host-${instance.id}`)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy hostname"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copiedField === `host-${instance.id}` && (
                    <span className="ml-2 text-xs text-green-600">Copied!</span>
                  )}
                </div>

                {/* Username */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Username
                    </label>
                    <code className="text-sm font-mono text-gray-900">{instance.adminUser}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(instance.adminUser, `user-${instance.id}`)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy username"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copiedField === `user-${instance.id}` && (
                    <span className="ml-2 text-xs text-green-600">Copied!</span>
                  )}
                </div>

                {/* Password */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Password
                    </label>
                    <code className="text-sm font-mono text-gray-900">
                      {visiblePasswords.has(instance.id) ? instance.password : '••••••••••••'}
                    </code>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => togglePasswordVisibility(instance.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={visiblePasswords.has(instance.id) ? 'Hide password' : 'Show password'}
                    >
                      {visiblePasswords.has(instance.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(instance.password, `password-${instance.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy password"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {copiedField === `password-${instance.id}` && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </div>
                </div>

                {/* Connection String */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Connection String
                    </label>
                    <code className="text-sm font-mono text-gray-900 break-all">
                      {getConnectionString(instance)}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getConnectionString(instance), `connection-${instance.id}`)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy connection string"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copiedField === `connection-${instance.id}` && (
                    <span className="ml-2 text-xs text-green-600">Copied!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InstanceList; 
