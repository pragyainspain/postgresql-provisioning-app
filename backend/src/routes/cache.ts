import express from 'express';
import { CacheService } from '../services/cacheService';

const router = express.Router();

// POST /api/v1/cache/instances/reserve - Reserve an instance from cache
router.post('/instances/reserve', (req, res) => {
  try {
    const instance = CacheService.reserveInstance();
    
    if (!instance) {
      return res.status(404).json({ 
        error: 'No available instances in cache',
        availableCount: 0
      });
    }

    res.json({
      instance,
      message: 'Instance reserved successfully'
    });

  } catch (error) {
    console.error('Error reserving instance:', error);
    res.status(500).json({ 
      error: 'Failed to reserve instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/v1/cache/instances/available - Get available instance count
router.get('/instances/available', (req, res) => {
  try {
    const count = CacheService.getAvailableCount();
    const instances = CacheService.getAvailableInstances();
    
    res.json({
      availableCount: count,
      instances: instances.map(instance => ({
        id: instance.id,
        instanceName: instance.instanceName,
        region: instance.region
        // Don't expose sensitive data like passwords
      }))
    });

  } catch (error) {
    console.error('Error getting available instances:', error);
    res.status(500).json({ 
      error: 'Failed to get available instances',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/v1/cache/instances/return - Return instance to cache (for testing)
router.post('/instances/return', (req, res) => {
  const { instance } = req.body;
  
  if (!instance || !instance.id || !instance.instanceName) {
    return res.status(400).json({ 
      error: 'Invalid instance data' 
    });
  }

  try {
    CacheService.returnInstance(instance);
    res.json({ 
      message: 'Instance returned to cache successfully' 
    });

  } catch (error) {
    console.error('Error returning instance to cache:', error);
    res.status(500).json({ 
      error: 'Failed to return instance to cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 
