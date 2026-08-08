import { Router, Request, Response } from 'express';
import prisma from '../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Basic database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: 'healthy'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: 'unhealthy'
      },
      error: error instanceof Error ? error.message : 'Unknown database error'
    });
  }
});

export default router;
