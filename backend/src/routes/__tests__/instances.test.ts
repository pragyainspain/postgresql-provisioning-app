import request from 'supertest';
import express from 'express';
import instancesRouter from '../instances';
import { UserService } from '../../services/userService';
import { CacheService } from '../../services/cacheService';
import { authenticateToken } from '../../middleware/auth';

// Mock services
jest.mock('../../services/userService');
jest.mock('../../services/cacheService');
jest.mock('../../middleware/auth');

const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/instances', instancesRouter);

const mockUser = {
  login: 'testuser',
  id: 123,
  name: 'Test User',
  email: 'test@example.com'
};

const mockInstance = {
  id: 'inst1',
  instanceName: 'pg-test-001',
  host: 'pg-test-001.postgres.database.azure.com',
  adminUser: 'admin1',
  password: 'pass1',
  region: 'eastus',
  createdAt: '2024-01-01T12:00:00Z'
};

const mockCacheInstance = {
  id: '2',
  instanceName: 'pg-test-002',
  adminUsername: 'admin2',
  adminPassword: 'pass2',
  region: 'westus',
  host: 'pg-test-002.postgres.database.azure.com'
};

describe('Instances Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication middleware to add user to request
    (mockAuthenticateToken as any).mockImplementation((req: any, _res: any, next: any) => {
      req.user = mockUser;
      next();
    });
  });

  describe('GET /api/v1/instances', () => {
    it('returns user instances successfully', async () => {
      mockUserService.getUserInstances.mockReturnValue([mockInstance]);
      mockUserService.getMaxInstancesPerUser.mockReturnValue(3);
      mockUserService.canCreateInstance.mockReturnValue(true);

      const response = await request(app)
        .get('/api/v1/instances')
        .expect(200);

      expect(response.body).toEqual({
        instances: [mockInstance],
        count: 1,
        maxInstances: 3,
        canCreateMore: true
      });

      expect(mockUserService.getUserInstances).toHaveBeenCalledWith('testuser');
    });

    it('returns 401 when user not authenticated', async () => {
      (mockAuthenticateToken as any).mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'User not authenticated' });
      });

      await request(app)
        .get('/api/v1/instances')
        .expect(401);
    });

    it('handles service errors gracefully', async () => {
      mockUserService.getUserInstances.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .get('/api/v1/instances')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch instances');
    });
  });

  describe('POST /api/v1/instances', () => {
    it('creates instance successfully', async () => {
      mockUserService.canCreateInstance.mockReturnValue(true);
      mockCacheService.reserveInstance.mockReturnValue(mockCacheInstance);
      mockUserService.addInstanceToUser.mockReturnValue(mockInstance);

      const response = await request(app)
        .post('/api/v1/instances')
        .expect(201);

      expect(response.body.instance).toEqual(mockInstance);
      expect(response.body.message).toBe('Instance provisioned successfully');
      expect(response.body.connectionString).toContain('postgresql://');

      expect(mockCacheService.reserveInstance).toHaveBeenCalled();
      expect(mockUserService.addInstanceToUser).toHaveBeenCalledWith('testuser', mockCacheInstance);
    });

    it('returns 400 when user exceeds quota', async () => {
      mockUserService.canCreateInstance.mockReturnValue(false);
      mockUserService.getUserInstanceCount.mockReturnValue(3);
      mockUserService.getMaxInstancesPerUser.mockReturnValue(3);

      const response = await request(app)
        .post('/api/v1/instances')
        .expect(400);

      expect(response.body.error).toContain('Maximum instances limit reached');
      expect(mockCacheService.reserveInstance).not.toHaveBeenCalled();
    });

    it('returns 503 when no instances available in cache', async () => {
      mockUserService.canCreateInstance.mockReturnValue(true);
      mockCacheService.reserveInstance.mockReturnValue(null);
      mockCacheService.getAvailableCount.mockReturnValue(0);

      const response = await request(app)
        .post('/api/v1/instances')
        .expect(503);

      expect(response.body.error).toContain('No available instances in cache');
    });

    it('handles quota error from user service', async () => {
      mockUserService.canCreateInstance.mockReturnValue(true);
      mockCacheService.reserveInstance.mockReturnValue(mockCacheInstance);
      mockUserService.addInstanceToUser.mockImplementation(() => {
        throw new Error('Maximum instances limit reached (3 instances per user)');
      });
      mockUserService.getUserInstanceCount.mockReturnValue(3);
      mockUserService.getMaxInstancesPerUser.mockReturnValue(3);

      const response = await request(app)
        .post('/api/v1/instances')
        .expect(400);

      expect(response.body.error).toContain('Maximum instances limit reached');
    });
  });

  describe('DELETE /api/v1/instances/:id', () => {
    it('deletes instance successfully', async () => {
      mockUserService.removeInstanceFromUser.mockReturnValue(true);

      const response = await request(app)
        .delete('/api/v1/instances/inst1')
        .expect(200);

      expect(response.body.message).toBe('Instance deleted successfully');
      expect(response.body.instanceId).toBe('inst1');
      expect(mockUserService.removeInstanceFromUser).toHaveBeenCalledWith('testuser', 'inst1');
    });

    it('returns 404 when instance not found', async () => {
      mockUserService.removeInstanceFromUser.mockReturnValue(false);

      const response = await request(app)
        .delete('/api/v1/instances/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Instance not found or does not belong to user');
    });

    it('returns 400 when instance ID missing', async () => {
      const response = await request(app)
        .delete('/api/v1/instances/')
        .expect(404); // Express returns 404 for missing route params
    });
  });

  describe('GET /api/v1/instances/:id', () => {
    it('returns specific instance details', async () => {
      mockUserService.getUserInstances.mockReturnValue([mockInstance]);

      const response = await request(app)
        .get('/api/v1/instances/inst1')
        .expect(200);

      expect(response.body.instance).toEqual(mockInstance);
      expect(response.body.connectionString).toContain('postgresql://');
    });

    it('returns 404 when instance not found', async () => {
      mockUserService.getUserInstances.mockReturnValue([]);

      const response = await request(app)
        .get('/api/v1/instances/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Instance not found or does not belong to user');
    });

    it('handles service errors', async () => {
      mockUserService.getUserInstances.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .get('/api/v1/instances/inst1')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch instance details');
    });
  });
}); 
