import fs from 'fs';
import path from 'path';
import { CacheService } from '../cacheService';
import { CacheInstance } from '../../types';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const mockInstances: CacheInstance[] = [
  {
    id: '1',
    instanceName: 'pg-test-001',
    adminUsername: 'admin1',
    adminPassword: 'pass1',
    region: 'eastus',
    host: 'pg-test-001.postgres.database.azure.com'
  },
  {
    id: '2',
    instanceName: 'pg-test-002',
    adminUsername: 'admin2',
    adminPassword: 'pass2',
    region: 'westus',
    host: 'pg-test-002.postgres.database.azure.com'
  }
];

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableInstances', () => {
    it('returns instances from cache file', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockInstances));

      const result = CacheService.getAvailableInstances();

      expect(result).toEqual(mockInstances);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('instanceCache.json'),
        'utf8'
      );
    });

    it('returns empty array on file read error', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = CacheService.getAvailableInstances();

      expect(result).toEqual([]);
    });
  });

  describe('reserveInstance', () => {
    it('reserves and removes first instance from cache', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockInstances));
      mockedFs.writeFileSync.mockImplementation();

      const result = CacheService.reserveInstance();

      expect(result).toEqual(mockInstances[0]);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('instanceCache.json'),
        JSON.stringify([mockInstances[1]], null, 2)
      );
    });

    it('returns null when no instances available', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify([]));

      const result = CacheService.reserveInstance();

      expect(result).toBeNull();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('handles write error gracefully', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockInstances));
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => CacheService.reserveInstance()).toThrow('Failed to update cache');
    });
  });

  describe('getAvailableCount', () => {
    it('returns correct count of available instances', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockInstances));

      const result = CacheService.getAvailableCount();

      expect(result).toBe(2);
    });

    it('returns 0 when no instances available', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify([]));

      const result = CacheService.getAvailableCount();

      expect(result).toBe(0);
    });
  });

  describe('returnInstance', () => {
    it('adds instance back to cache', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify([mockInstances[1]]));
      mockedFs.writeFileSync.mockImplementation();

      CacheService.returnInstance(mockInstances[0]);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('instanceCache.json'),
        JSON.stringify([mockInstances[1], mockInstances[0]], null, 2)
      );
    });
  });

  describe('initializeCache', () => {
    it('creates initial cache when empty', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify([]));
      mockedFs.writeFileSync.mockImplementation();

      CacheService.initializeCache();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('instanceCache.json'),
        expect.stringContaining('pg-free-001')
      );
    });

    it('does not initialize when cache has instances', () => {
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockInstances));

      CacheService.initializeCache();

      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
