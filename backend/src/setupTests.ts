import fs from 'fs';
import path from 'path';

// Create test data directory if it doesn't exist
const testDataDir = path.join(__dirname, '../test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.GITHUB_CLIENT_ID = 'Ov23liGWm0JnYpvIqNZS';
process.env.GITHUB_CLIENT_SECRET = '90d4979465d72d78f59851fc043bd1ec543a0eea'; 
