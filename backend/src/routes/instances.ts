import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { UserService } from '../services/userService';
import { CacheService } from '../services/cacheService';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/v1/instances - List all instances for the authenticated user
router.get('/', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const instances = UserService.getUserInstances(req.user.login);
    
    res.json({
      instances,
      count: instances.length,
      maxInstances: UserService.getMaxInstancesPerUser(),
      canCreateMore: UserService.canCreateInstance(req.user.login)
    });

  } catch (error) {
    console.error('Error fetching user instances:', error);
    res.status(500).json({ 
      error: 'Failed to fetch instances',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/instances - Provision a new instance for the user
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const githubUsername = req.user.login;

    // Check if user can create more instances
    if (!UserService.canCreateInstance(githubUsername)) {
      return res.status(400).json({ 
        error: `Maximum instances limit reached (${UserService.getMaxInstancesPerUser()} instances per user)`,
        currentCount: UserService.getUserInstanceCount(githubUsername),
        maxInstances: UserService.getMaxInstancesPerUser()
      });
    }

    // Reserve an instance from cache
    const cacheInstance = CacheService.reserveInstance();
    
    if (!cacheInstance) {
      return res.status(503).json({ 
        error: 'No available instances in cache. Please try again later.',
        availableCount: CacheService.getAvailableCount()
      });
    }

    // Assign instance to user
    const userInstance = UserService.addInstanceToUser(githubUsername, cacheInstance);

    res.status(201).json({
      instance: userInstance,
      message: 'Instance provisioned successfully',
      connectionString: `postgresql://${userInstance.adminUser}:${userInstance.password}@${userInstance.host}:5432/postgres`
    });

  } catch (error) {
    console.error('Error provisioning instance:', error);
    
    if (error instanceof Error && error.message.includes('Maximum instances limit')) {
      return res.status(400).json({ 
        error: error.message,
        currentCount: UserService.getUserInstanceCount(req.user!.login),
        maxInstances: UserService.getMaxInstancesPerUser()
      });
    }

    res.status(500).json({ 
      error: 'Failed to provision instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/v1/instances/:id - Drop/delete a user instance
router.delete('/:id', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const githubUsername = req.user.login;

    if (!id) {
      return res.status(400).json({ error: 'Instance ID required' });
    }

    const success = UserService.removeInstanceFromUser(githubUsername, id);

    if (!success) {
      return res.status(404).json({ 
        error: 'Instance not found or does not belong to user' 
      });
    }

    res.json({ 
      message: 'Instance deleted successfully',
      instanceId: id
    });

  } catch (error) {
    console.error('Error deleting instance:', error);
    res.status(500).json({ 
      error: 'Failed to delete instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/instances/:id - Get specific instance details
router.get('/:id', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const githubUsername = req.user.login;
    const instances = UserService.getUserInstances(githubUsername);
    
    const instance = instances.find(inst => inst.id === id);

    if (!instance) {
      return res.status(404).json({ 
        error: 'Instance not found or does not belong to user' 
      });
    }

    res.json({
      instance,
      connectionString: `postgresql://${instance.adminUser}:${instance.password}@${instance.host}:5432/postgres`
    });

  } catch (error) {
    console.error('Error fetching instance details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch instance details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
