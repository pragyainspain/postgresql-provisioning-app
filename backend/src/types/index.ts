export interface InstanceMetadata {
    id: string;
    instanceName: string;
    host: string;
    adminUser: string;
    password: string;
    region: string;
    createdAt: string;
  }
  
  export interface UserInstance {
    githubUsername: string;
    instances: InstanceMetadata[];
  }
  
  export interface CacheInstance {
    id: string;
    instanceName: string;
    adminUsername: string;
    adminPassword: string;
    region: string;
    host: string;
  }
  
  export interface GitHubUser {
    login: string;
    id: number;
    name: string;
    email: string;
  }
  
  export interface AuthRequest extends Request {
    user?: GitHubUser;
  }
  
  declare global {
    namespace Express {
      interface Request {
        user?: GitHubUser;
      }
    }
  }
