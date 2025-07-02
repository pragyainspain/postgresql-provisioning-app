import axios from 'axios';
import { InstancesResponse, CreateInstanceResponse, GitHubUser, InstanceMetadata } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  getGitHubAuthUrl: async () => {
    const response = await api.get('/api/v1/auth/github');
    return response.data;
  },

  verifyToken: async (token: string): Promise<{ user: GitHubUser; valid: boolean }> => {
    const response = await api.post('/api/v1/auth/verify', { token });
    return response.data;
  },
};

export const instanceService = {
  getInstances: async (): Promise<InstancesResponse> => {
    const response = await api.get('/api/v1/instances');
    return response.data;
  },

  createInstance: async (): Promise<CreateInstanceResponse> => {
    const response = await api.post('/api/v1/instances');
    return response.data;
  },

  deleteInstance: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/v1/instances/${id}`);
    return response.data;
  },

  getInstance: async (id: string): Promise<{ instance: InstanceMetadata; connectionString: string }> => {
    const response = await api.get(`/api/v1/instances/${id}`);
    return response.data;
  },
};

export const cacheService = {
  getAvailable: async () => {
    const response = await api.get('/api/v1/cache/instances/available');
    return response.data;
  },
};

export default api;
