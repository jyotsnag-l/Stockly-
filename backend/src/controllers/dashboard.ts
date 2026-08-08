import { Request, Response } from 'express';
import prisma from '../services/db';
import { cacheManager } from '../services/cache';

/**
 * Get live database statistics and recent activity feeds for the dashboard overview
 * GET /dashboard/stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  const cacheKey = req.originalUrl;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    // Fetch all dashboard stats and recent timelines in parallel
    const [
      totalCustomers,
      totalProducts,
      totalChallans,
      confirmedChallans,
      recentCustomers,
      recentMovements,
      recentChallans
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.challan.count(),
      prisma.challan.findMany({
        where: { status: 'Confirmed' },
        include: { items: true }
      }),
      prisma.customer.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { product: true }
      }),
      prisma.challan.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, items: true }
      })
    ]);

    let totalRevenue = 0;
    for (const challan of confirmedChallans) {
      for (const item of challan.items) {
        totalRevenue += Number(item.unitPriceSnapshot) * item.quantity;
      }
    }

    // Merge activities into a single timeline array
    const activities: any[] = [];

    recentCustomers.forEach((c) => {
      activities.push({
        id: `customer-${c.id}`,
        type: 'customer',
        action: 'Registered as a new customer',
        user: c.name,
        time: c.createdAt,
        amount: null
      });
    });

    recentMovements.forEach((m) => {
      activities.push({
        id: `movement-${m.id}`,
        type: 'product',
        action: `Stock level updated (${m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged})`,
        user: m.product?.name || 'Unknown Product',
        time: m.createdAt,
        amount: null
      });
    });

    recentChallans.forEach((ch) => {
      const amount = ch.items.reduce(
        (sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 
        0
      );
      activities.push({
        id: `challan-${ch.id}`,
        type: 'challan',
        action: `Challan #${ch.challanNumber.substring(0, 6).toUpperCase()} ${ch.status.toLowerCase()}`,
        user: ch.customer?.name || 'Unknown Customer',
        time: ch.createdAt,
        amount: `$${amount.toFixed(2)}`
      });
    });

    // Sort by timestamp desc, take the 4 most recent events
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivitiesFeed = activities.slice(0, 4);

    const result = {
      stats: {
        totalCustomers,
        totalProducts,
        totalChallans,
        totalRevenue
      },
      recentActivities: recentActivitiesFeed
    };
    cacheManager.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
