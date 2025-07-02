import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

import authRoutes from '../src/routes/auth';
import instanceRoutes from '../src/routes/instances';
import cacheRoutes from '../src/routes/cache';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json());

// Initialize data directories for Vercel
const dataDir = '/tmp/data';
const usersFile = path.join(dataDir, 'users.json');
const cacheFile = path.join(dataDir, 'instanceCache.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(cacheFile)) {
  // Initialize with mock PostgreSQL instances
  const mockInstances = [
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
    },
    {
      id: '4',
      instanceName: 'pg-free-004',
      adminUsername: 'pgadmin004',
      adminPassword: 'SecurePass101!',
      region: 'eastus2',
      host: 'pg-free-004.postgres.database.azure.com'
    },
    {
      id: '5',
      instanceName: 'pg-free-005',
      adminUsername: 'pgadmin005',
      adminPassword: 'SecurePass202!',
      region: 'westus',
      host: 'pg-free-005.postgres.database.azure.com'
    }
  ];
  fs.writeFileSync(cacheFile, JSON.stringify(mockInstances, null, 2));
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/instances', instanceRoutes);
app.use('/api/v1/cache', cacheRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel
export default app;