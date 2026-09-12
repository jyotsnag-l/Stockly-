import { Request, Response } from 'express';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { ChallanStatus } from '@prisma/client';
import { cacheManager } from '../services/cache';

/**
 * Get paginated list of delivery challans
 * GET /challans
 */
export const getChallans = async (req: Request, res: Response) => {
  const cacheKey = req.originalUrl;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;

    const skip = (page - 1) * limit;

    // Filter clauses
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as ChallanStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    // Database Count & Fetch queries in parallel
    const [total, data] = await Promise.all([
      prisma.challan.count({ where }),
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { name: true, businessName: true }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages
      }
    };
    cacheManager.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch challans list',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get challan by ID (with snapshot items details)
 * GET /challans/:id
 */
export const getChallanById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        createdByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    res.json(challan);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch challan details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a new challan as Draft (taking price/sku snapshots)
 * POST /challans
 */
export const createChallan = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { customerId, items } = req.body;

  if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'Customer ID and at least one item are required' 
    });
  }

  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
  }

  const userId = authReq.user.userId;

  try {
    // 1. Verify Customer
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // 2. Fetch all products to capture snapshots at this point in time
    const itemsWithSnapshots = [];
    let totalQuantity = 0;

    for (const item of items) {
      const { productId, quantity } = item;
      const qty = parseInt(quantity);

      if (!productId || isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid product or quantity specified' });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${productId}` });
      }

      itemsWithSnapshots.push({
        productId: product.id,
        productNameSnapshot: product.name,
        productSkuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: qty
      });

      totalQuantity += qty;
    }

    // 3. Generate sequential challanNumber (e.g. CH-2026-0001)
    const count = await prisma.challan.count();
    const seqNum = (count + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    const challanNumber = `CH-${year}-${seqNum}`;

    // 4. Create Draft Challan
    const draftChallan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        status: ChallanStatus.Draft,
        totalQuantity,
        createdByUserId: userId,
        items: {
          create: itemsWithSnapshots.map(item => ({
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            productSkuSnapshot: item.productSkuSnapshot,
            unitPriceSnapshot: item.unitPriceSnapshot,
            quantity: item.quantity
          }))
        }
      },
      include: {
        items: true
      }
    });

    cacheManager.invalidateAll();
    res.status(201).json(draftChallan);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create challan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Edit a Draft Challan (add/remove/change items, still Draft only)
 * PUT /challans/:id
 */
export const updateChallan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      message: 'At least one item is required' 
    });
  }

  try {
    // 1. Verify Challan exists and is still in Draft state
    const challan = await prisma.challan.findUnique({ where: { id } });
    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    if (challan.status !== ChallanStatus.Draft) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Only Draft challans can be modified' 
      });
    }

    const itemsWithSnapshots: {
      productId: string;
      productNameSnapshot: string;
      productSkuSnapshot: string;
      unitPriceSnapshot: any;
      quantity: number;
    }[] = [];
    let totalQuantity = 0;

    for (const item of items) {
      const { productId, quantity } = item;
      const qty = parseInt(quantity);

      if (!productId || isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'Invalid product or quantity specified' });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${productId}` });
      }

      itemsWithSnapshots.push({
        productId: product.id,
        productNameSnapshot: product.name,
        productSkuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: qty
      });

      totalQuantity += qty;
    }

    // 3. Clear previous items and record new ones inside a Transaction
    const updatedChallan = await prisma.$transaction(async (tx: any) => {
      // A. Delete existing items
      await tx.challanItem.deleteMany({ where: { challanId: id } });

      // B. Update Challan totals and write new items
      const result = await tx.challan.update({
        where: { id },
        data: {
          totalQuantity,
          items: {
            create: itemsWithSnapshots.map(item => ({
              productId: item.productId,
              productNameSnapshot: item.productNameSnapshot,
              productSkuSnapshot: item.productSkuSnapshot,
              unitPriceSnapshot: item.unitPriceSnapshot,
              quantity: item.quantity
            }))
          }
        },
        include: {
          items: true
        }
      });

      return result;
    }, { maxWait: 10000, timeout: 30000 });

    cacheManager.invalidateAll();
    res.json(updatedChallan);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update challan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Confirm a Draft Challan (verifying stock levels atomically inside transaction)
 * POST /challans/:id/confirm
 */
export const confirmChallan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
  }

  const userId = authReq.user.userId;

  try {
    // Execute atomic validations inside a Prisma Transaction
    const response = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch Challan details
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!challan) {
        throw new Error('CHALLAN_NOT_FOUND');
      }

      if (challan.status !== ChallanStatus.Draft) {
        throw new Error('NOT_DRAFT_CHALLAN');
      }

      // 2. Query product levels inside the transaction block to avoid race conditions
      for (const item of challan.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.productNameSnapshot}`);
        }

        // Insufficient stock checks
        if (product.currentStock < item.quantity) {
          throw new Error(`LOW_STOCK:${product.name}:${product.currentStock}:${item.quantity}`);
        }
      }

      // 3. Subtract stock counts and log movement records
      for (const item of challan.items) {
        // A. Decrement stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });

        // B. Write OUT movement log
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: -item.quantity,
            movementType: 'OUT',
            reason: `Challan #${challan.challanNumber}`,
            createdByUserId: userId
          }
        });
      }

      // 4. Update Challan status to Confirmed
      const confirmed = await tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.Confirmed
        },
        include: {
          items: true
        }
      });

      return confirmed;
    }, { maxWait: 10000, timeout: 30000 });

    cacheManager.invalidateAll();
    res.json(response);
  } catch (error) {
    const err = error as Error;
    if (err.message === 'CHALLAN_NOT_FOUND') {
      return res.status(404).json({ error: 'Challan not found' });
    }
    if (err.message === 'NOT_DRAFT_CHALLAN') {
      return res.status(400).json({ error: 'Validation Error', message: 'Only Draft challans can be confirmed' });
    }
    if (err.message.startsWith('PRODUCT_NOT_FOUND:')) {
      const pName = err.message.split(':')[1];
      return res.status(404).json({ error: `Product snapshot references unavailable items: "${pName}"` });
    }
    if (err.message.startsWith('LOW_STOCK:')) {
      const [_, productName, currentStock, requestedQuantity] = err.message.split(':');
      return res.status(400).json({
        error: 'Low Stock Error',
        message: `Insufficient stock for product "${productName}". Available: ${currentStock}, Requested: ${requestedQuantity}`
      });
    }

    res.status(500).json({
      error: 'Failed to confirm challan',
      message: err.message
    });
  }
};

/**
 * Cancel a Draft or Confirmed Challan (returning stock on cancellation)
 * POST /challans/:id/cancel
 */
export const cancelChallan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
  }

  const userId = authReq.user.userId;

  try {
    const response = await prisma.$transaction(async (tx: any) => {
      // 1. Fetch Challan details
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!challan) {
        throw new Error('CHALLAN_NOT_FOUND');
      }

      if (challan.status === ChallanStatus.Cancelled) {
        throw new Error('ALREADY_CANCELLED');
      }

      // 2. Restocking logic: if the challan is Confirmed, returning it cancels the stock withdrawal
      // We increment the stock quantities back to Product.currentStock and log IN movements
      if (challan.status === ChallanStatus.Confirmed) {
        for (const item of challan.items) {
          // A. Increment stock count
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity
              }
            }
          });

          // B. Write IN restocking movement log
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Cancellation of Challan #${challan.challanNumber}`,
              createdByUserId: userId
            }
          });
        }
      }

      // 3. Mark Challan as Cancelled
      const cancelled = await tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.Cancelled
        },
        include: {
          items: true
        }
      });

      return cancelled;
    }, { maxWait: 10000, timeout: 30000 });

    cacheManager.invalidateAll();
    res.json(response);
  } catch (error) {
    const err = error as Error;
    if (err.message === 'CHALLAN_NOT_FOUND') {
      return res.status(404).json({ error: 'Challan not found' });
    }
    if (err.message === 'ALREADY_CANCELLED') {
      return res.status(400).json({ error: 'Validation Error', message: 'Challan is already cancelled' });
    }

    res.status(500).json({
      error: 'Failed to cancel challan',
      message: err.message
    });
  }
};
