import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UserInstance, InstanceMetadata, CacheInstance } from '../types';

// Use /tmp for Vercel serverless functions
const USERS_FILE = path.join('/tmp/data', 'users.json');
const MAX_INSTANCES_PER_USER = 3; // Stretch goal: soft quota

export class UserService {
  private static readUsers(): UserInstance[] {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users file:', error);
      return [];
    }
  }

  private static writeUsers(users: UserInstance[]): void {
    try {
      const dataDir = path.dirname(USERS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing users file:', error);
      throw new Error('Failed to update users data');
    }
  }

  public static getUserInstances(githubUsername: string): InstanceMetadata[] {
    const users = this.readUsers();
    const user = users.find(u => u.githubUsername === githubUsername);
    return user ? user.instances : [];
  }

  public static addInstanceToUser(githubUsername: string, cacheInstance: CacheInstance): InstanceMetadata {
    const users = this.readUsers();
    let user = users.find(u => u.githubUsername === githubUsername);

    // Check quota (stretch goal)
    if (user && user.instances.length >= MAX_INSTANCES_PER_USER) {
      throw new Error(`Maximum instances limit reached (${MAX_INSTANCES_PER_USER} instances per user)`);
    }

    const newInstance: InstanceMetadata = {
      id: uuidv4(),
      instanceName: cacheInstance.instanceName,
      host: cacheInstance.host,
      adminUser: cacheInstance.adminUsername,
      password: cacheInstance.adminPassword, // In production, encrypt this
      region: cacheInstance.region,
      createdAt: new Date().toISOString()
    };

    if (user) {
      user.instances.push(newInstance);
    } else {
      user = {
        githubUsername,
        instances: [newInstance]
      };
      users.push(user);
    }

    this.writeUsers(users);
    return newInstance;
  }

  public static removeInstanceFromUser(githubUsername: string, instanceId: string): boolean {
    const users = this.readUsers();
    const user = users.find(u => u.githubUsername === githubUsername);

    if (!user) {
      return false;
    }

    const initialLength = user.instances.length;
    user.instances = user.instances.filter(instance => instance.id !== instanceId);

    if (user.instances.length === initialLength) {
      return false; // Instance not found
    }

    // Remove user if no instances left
    if (user.instances.length === 0) {
      const userIndex = users.findIndex(u => u.githubUsername === githubUsername);
      if (userIndex > -1) {
        users.splice(userIndex, 1);
      }
    }

    this.writeUsers(users);
    return true;
  }

  public static getUserInstanceCount(githubUsername: string): number {
    const user = this.readUsers().find(u => u.githubUsername === githubUsername);
    return user ? user.instances.length : 0;
  }

  public static canCreateInstance(githubUsername: string): boolean {
    return this.getUserInstanceCount(githubUsername) < MAX_INSTANCES_PER_USER;
  }

  public static getMaxInstancesPerUser(): number {
    return MAX_INSTANCES_PER_USER;
  }

  // Get all users for admin/stats purposes
  public static getAllUsers(): UserInstance[] {
    return this.readUsers();
  }
}