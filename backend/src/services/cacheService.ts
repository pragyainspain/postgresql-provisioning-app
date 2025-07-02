import fs from 'fs';
import path from 'path';
import { CacheInstance } from '../types';

// Use the same path as server.ts
const CACHE_FILE = path.join(__dirname, '../data/instanceCache.json');

export class CacheService {
  private static readCache(): CacheInstance[] {
    try {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading cache file:', error);
      return [];
    }
  }

  private static writeCache(instances: CacheInstance[]): void {
    try {
      const dataDir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(instances, null, 2));
    } catch (error) {
      console.error('Error writing cache file:', error);
      throw new Error('Failed to update cache');
    }
  }

  public static getAvailableInstances(): CacheInstance[] {
    return this.readCache();
  }

  public static reserveInstance(): CacheInstance | null {
    const instances = this.readCache();
    
    if (instances.length === 0) {
      return null;
    }

    // Get the first available instance
    const reservedInstance = instances[0];
    
    // Remove it from the cache (atomic operation)
    const remainingInstances = instances.slice(1);
    this.writeCache(remainingInstances);

    return reservedInstance;
  }

  public static getAvailableCount(): number {
    return this.readCache().length;
  }

  // For testing/demo purposes - add instances back to cache
  public static returnInstance(instance: CacheInstance): void {
    const instances = this.readCache();
    instances.push(instance);
    this.writeCache(instances);
  }

  // Initialize cache with mock data if empty
  public static initializeCache(): void {
    const instances = this.readCache();
    if (instances.length === 0) {
      const mockInstances: CacheInstance[] = [
        {
          id: '1',
          instanceName: 'pg-free-001',
          adminUsername: 'pgadmin001',
          adminPassword: 'SecurePass123!',
          region: 'eastus',
          host: 'pg-free-001.postgres.database.azure.com'
        },
        {
          id: '2',
          instanceName: 'pg-free-002',
          adminUsername: 'pgadmin002',
          adminPassword: 'SecurePass456!',
          region: 'westus2',
          host: 'pg-free-002.postgres.database.azure.com'
        },
        {
          id: '3',
          instanceName: 'pg-free-003',
          adminUsername: 'pgadmin003',
          adminPassword: 'SecurePass789!',
          region: 'centralus',
          host: 'pg-free-003.postgres.database.azure.com'
        }
      ];
      this.writeCache(mockInstances);
    }
  }
}