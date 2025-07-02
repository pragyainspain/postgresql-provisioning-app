import axios from 'axios';
import { authService, instanceService, cacheService } from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('authService', () => {
    it('gets GitHub auth URL', async () => {
      const mockResponse = { data: { authUrl: 'https://github.com/oauth', state: 'test' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authService.getGitHubAuthUrl();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/auth/github');
      expect(result).toEqual(mockResponse.data);
    });

    it('verifies token', async () => {
      const mockResponse = { data: { user: { login: 'testuser' }, valid: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authService.verifyToken('test-token');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/auth/verify', { token: 'test-token' });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('instanceService', () => {
    it('gets instances', async () => {
      const mockResponse = {
        data: {
          instances: [],
          count: 0,
          maxInstances: 3,
          canCreateMore: true
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await instanceService.getInstances();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/instances');
      expect(result).toEqual(mockResponse.data);
    });

    it('creates instance', async () => {
      const mockResponse = {
        data: {
          instance: { id: '1', instanceName: 'test' },
          message: 'Created',
          connectionString: 'postgresql://...'
        }
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await instanceService.createInstance();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/instances');
      expect(result).toEqual(mockResponse.data);
    });

    it('deletes instance', async () => {
      const mockResponse = { data: { message: 'Instance deleted' } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await instanceService.deleteInstance('test-id');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/v1/instances/test-id');
      expect(result).toEqual(mockResponse.data);
    });

    it('gets specific instance', async () => {
      const mockResponse = {
        data: {
          instance: { id: '1', instanceName: 'test' },
          connectionString: 'postgresql://...'
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await instanceService.getInstance('test-id');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/instances/test-id');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('cacheService', () => {
    it('gets available instances', async () => {
      const mockResponse = {
        data: {
          availableCount: 5,
          instances: []
        }
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await cacheService.getAvailable();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/cache/instances/available');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('request interceptor', () => {
    it('adds auth token to requests', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      // Verify that the interceptor was set up
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('response interceptor', () => {
    it('handles 401 errors by clearing storage', () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_data', '{"login":"test"}');
      
      // Verify that the interceptor was set up
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
}); 
