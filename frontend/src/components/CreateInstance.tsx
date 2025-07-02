import React, { useState } from 'react';
import { X, Database, Zap, CheckCircle } from 'lucide-react';
import { instanceService } from '../services/api';
import { CreateInstanceResponse } from '../types';

interface CreateInstanceProps {
  onClose: () => void;
  onInstanceCreated: () => void;
}

const CreateInstance: React.FC<CreateInstanceProps> = ({ onClose, onInstanceCreated }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdInstance, setCreatedInstance] = useState<CreateInstanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await instanceService.createInstance();
      setCreatedInstance(response);
      setSuccess(true);
      
      // Auto-close after 3 seconds and refresh parent
      setTimeout(() => {
        onInstanceCreated();
      }, 3000);

    } catch (err: any) {
      console.error('Error creating instance:', err);
      setError(
        err.response?.data?.error || 
        'Failed to create instance. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onInstanceCreated();
    } else {
      onClose();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {success ? 'Instance Created!' : 'Create New PostgreSQL Instance'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!success && !loading && (
            <>
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Database className="h-8 w-8 text-primary-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Free Tier PostgreSQL
                    </h3>
                    <p className="text-sm text-gray-500">
                      Instantly provision a managed PostgreSQL database
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        What you'll get:
                      </h4>
                      <ul className="text-sm text-blue-800 mt-1 space-y-1">
                        <li>• Pre-configured PostgreSQL 14+ instance</li>
                        <li>• Fully managed with automatic backups</li>
                        <li>• SSL-enabled secure connections</li>
                        <li>• Admin access with full privileges</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Create Instance
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Creating your PostgreSQL instance...
              </h3>
              <p className="text-gray-500">
                This should take just a few seconds
              </p>
            </div>
          )}

          {success && createdInstance && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Instance Created Successfully!
              </h3>
              
              <p className="text-gray-500 mb-6">
                Your PostgreSQL instance is ready to use
              </p>

              {/* Instance Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Connection Details:
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Instance:</span>
                    <span className="ml-2 font-mono">{createdInstance.instance.instanceName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Host:</span>
                    <span className="ml-2 font-mono">{createdInstance.instance.host}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Username:</span>
                    <span className="ml-2 font-mono">{createdInstance.instance.adminUser}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Region:</span>
                    <span className="ml-2">{createdInstance.instance.region}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <span className="text-gray-500 text-sm">Connection String:</span>
                  <div className="mt-1 p-2 bg-white border rounded font-mono text-xs break-all">
                    {createdInstance.connectionString}
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdInstance.connectionString)}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                  >
                    Copy connection string
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                This dialog will close automatically in a few seconds...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInstance;
