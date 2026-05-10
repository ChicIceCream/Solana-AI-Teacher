import { Router } from 'express';
import solanaService from '../services/solana.service.js';
import aiService from '../services/ai.service.js';

const router = Router();

/**
 * GET /api/health — Basic health check
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      network: solanaService.currentNetwork,
    },
  });
});

/**
 * GET /api/health/detailed — Full system health check
 */
router.get('/detailed', async (req, res, next) => {
  try {
    const [solanaHealth, aiHealth] = await Promise.all([
      solanaService.healthCheck(),
      aiService.healthCheck(),
    ]);

    const allHealthy = solanaHealth.healthy && aiHealth.healthy;

    res.status(allHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          solana: solanaHealth,
          ai: aiHealth,
        },
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
