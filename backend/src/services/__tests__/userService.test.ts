import fs from 'fs';
import { UserService } from '../userService';
import { UserInstance, CacheInstance } from '../../types';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const mockUsers: UserInstance[] = [
  {
    githubUsername: 'testuser1',
    instances: [
      {
        id: 'inst1',
        instanceName: 'pg-test-001',
        host: 'pg-test-001.postgres.database.azure.com',
        adminUser: 'admin1',
        password: 'pass1',
        region: 'eastus',
        createdAt: '2024-01-01T12:00:00Z'
      }
    ]
  },
  {
    githubUsername: 'testuser2',
    instances: []
  }
];

const mockCacheInstance: CacheInstance = {
  id: '2',
  instanceName: 'pg-test-002',
  adminUsername: 'admin2',
  adminPassword: 'pass2',
  region: 'westus',
  host: 'pg-test-002.postgres.database.azure.com'
};

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInstances', () => {
    it('returns instances for existing user', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.getUserInstances('testuser1');

      expect(result).toEqual(mockUsers[0].instances);
    });

    it('returns empty array for non-existing user', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.getUserInstances('nonexistent');

      expect(result).toEqual([]);
    });

    it('returns empty array when file read fails', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = UserService.getUserInstances('testuser1');

      expect(result).toEqual([]);
    });
  });

  describe('addInstanceToUser', () => {
    it('adds instance to existing user', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));
      mockedFs.writeFileSync.mockImplementation();

      const result = UserService.addInstanceToUser('testuser2', mockCacheInstance);

      expect(result.instanceName).toBe('pg-test-002');
      expect(result.host).toBe('pg-test-002.postgres.database.azure.com');
      expect(result.adminUser).toBe('admin2');
      expect(result.password).toBe('pass2');
      expect(result.region).toBe('westus');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();

      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('creates new user when user does not exist', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));
      mockedFs.writeFileSync.mockImplementation();

      const result = UserService.addInstanceToUser('newuser', mockCacheInstance);

      expect(result.instanceName).toBe('pg-test-002');
      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('throws error when user exceeds quota', () => {
      const userWithMaxInstances = {
        githubUsername: 'testuser3',
        instances: [
          { id: '1', instanceName: 'pg1', host: 'host1', adminUser: 'admin1', password: 'pass1', region: 'east', createdAt: '2024-01-01' },
          { id: '2', instanceName: 'pg2', host: 'host2', adminUser: 'admin2', password: 'pass2', region: 'west', createdAt: '2024-01-01' },
          { id: '3', instanceName: 'pg3', host: 'host3', adminUser: 'admin3', password: 'pass3', region: 'central', createdAt: '2024-01-01' }
        ]
      };
      
      mockedFs.readFileSync.mockReturnValue(JSON.stringify([userWithMaxInstances]));

      expect(() => {
        UserService.addInstanceToUser('testuser3', mockCacheInstance);
      }).toThrow('Maximum instances limit reached (3 instances per user)');
    });
  });

  describe('removeInstanceFromUser', () => {
    it('removes instance from user', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));
      mockedFs.writeFileSync.mockImplementation();

      const result = UserService.removeInstanceFromUser('testuser1', 'inst1');

      expect(result).toBe(true);
      expect(mockedFs.writeFileSync).toHaveBeenCalled();
    });

    it('returns false when user not found', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.removeInstanceFromUser('nonexistent', 'inst1');

      expect(result).toBe(false);
    });

    it('returns false when instance not found', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.removeInstanceFromUser('testuser1', 'nonexistent');

      expect(result).toBe(false);
    });

    it('removes user when no instances left', () => {
      const userWithOneInstance = [{
        githubUsername: 'testuser4',
        instances: [
          {
            id: 'inst1',
            instanceName: 'pg-test-001',
            host: 'host',
            adminUser: 'admin',
            password: 'pass',
            region: 'east',
            createdAt: '2024-01-01T12:00:00Z'
          }
        ]
      }];

      mockedFs.readFileSync.mockReturnValue(JSON.stringify(userWithOneInstance));
      mockedFs.writeFileSync.mockImplementation();

      const result = UserService.removeInstanceFromUser('testuser4', 'inst1');

      expect(result).toBe(true);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify([], null, 2)
      );
    });
  });

  describe('getUserInstanceCount', () => {
    it('returns correct count for existing user', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.getUserInstanceCount('testuser1');

      expect(result).toBe(1);
    });

    it('returns 0 for non-existing user', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.getUserInstanceCount('nonexistent');

      expect(result).toBe(0);
    });
  });

  describe('canCreateInstance', () => {
    it('returns true when user can create more instances', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.canCreateInstance('testuser1');

      expect(result).toBe(true);
    });

    it('returns false when user has reached limit', () => {
      const userWithMaxInstances = {
        githubUsername: 'testuser3',
        instances: new Array(3).fill({
          id: 'test',
          instanceName: 'pg',
          host: 'host',
          adminUser: 'admin',
          password: 'pass',
          region: 'east',
          createdAt: '2024-01-01'
        })
      };
      
      mockedFs.readFileSync.mockReturnValue(JSON.stringify([userWithMaxInstances]));

      const result = UserService.canCreateInstance('testuser3');

      expect(result).toBe(false);
    });
  });

  describe('getMaxInstancesPerUser', () => {
    it('returns correct max instances limit', () => {
      const result = UserService.getMaxInstancesPerUser();

      expect(result).toBe(3);
    });
  });

  describe('getAllUsers', () => {
    it('returns all users', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));

      const result = UserService.getAllUsers();

      expect(result).toEqual(mockUsers);
    });
  });
}); 
