export interface InstanceMetadata {
    id: string;
    instanceName: string;
    host: string;
    adminUser: string;
    password: string;
    region: string;
    createdAt: string;
  }
  
  export interface GitHubUser {
    login: string;
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  }
  
  export interface InstancesResponse {
    instances: InstanceMetadata[];
    count: number;
    maxInstances: number;
    canCreateMore: boolean;
  }
  
  export interface CreateInstanceResponse {
    instance: InstanceMetadata;
    message: string;
    connectionString: string;
  }
  
  export interface AuthState {
    user: GitHubUser | null;
    token: string | null;
    isAuthenticated: boolean;
  }
  
  export interface ApiError {
    error: string;
    details?: string;
  } 
