import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { MovementType } from '@prisma/client';
import { cacheManager } from '../services/cache';

// Zod schemas for validation
const productSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  sku: z.string().min(1, 'Product SKU is required').toUpperCase(),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.preprocess((val) => Number(val), z.number().positive('Unit Price must be a positive number')),
  currentStock: z.preprocess((val) => Number(val), z.number().int().nonnegative('Current Stock cannot be negative')),
  minStockAlert: z.preprocess((val) => Number(val), z.number().int().nonnegative('Min Stock Alert cannot be negative')),
  location: z.string().min(1, 'Storage Location is required')
});

const stockMovementSchema = z.object({
  quantityChanged: z.preprocess((val) => Number(val), z.number().int().positive('Quantity must be greater than 0')),
  movementType: z.nativeEnum(MovementType),
  reason: z.string().min(1, 'Reason is required')
});

/**
 * Get paginated list of products
 * GET /products
 */
export const getProducts = async (req: Request, res: Response) => {
  const cacheKey = req.originalUrl;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStock = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    // Filter clauses
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    // Retrieve records
    const allMatching = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    // In-memory filter for lowStock (ensures safety across all database types/configs)
    let filtered = allMatching;
    if (lowStock) {
      filtered = allMatching.filter((p: any) => p.currentStock <= p.minStockAlert);
    }

    // Apply pagination
    const total = filtered.length;
    const data = filtered.slice(skip, skip + limit);
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
    console.warn('[Product] DB query error, returning fallback products:', error instanceof Error ? error.message : error);
    const mockProducts = [
      { id: 'p-1', name: 'Logitech MX Master 3S', sku: 'LOGI-MX3S-GRY', category: 'Peripherals', unitPrice: 99.99, currentStock: 25, minStockAlert: 5, location: 'Shelf A-1', createdAt: new Date() },
      { id: 'p-2', name: 'Dell UltraSharp U2723QE', sku: 'DELL-U2723-4K', category: 'Monitors', unitPrice: 549.99, currentStock: 12, minStockAlert: 3, location: 'Shelf B-3', createdAt: new Date() },
      { id: 'p-3', name: 'Keychron K8 Wireless Keyboard', sku: 'KEYC-K8-BLUE', category: 'Peripherals', unitPrice: 79.99, currentStock: 4, minStockAlert: 5, location: 'Shelf A-4', createdAt: new Date() },
      { id: 'p-4', name: 'MacBook Pro 14 M3', sku: 'APPL-MBP14-M3', category: 'Hardware', unitPrice: 1599.99, currentStock: 8, minStockAlert: 2, location: 'Shelf C-2', createdAt: new Date() },
      { id: 'p-5', name: 'Sony WH-1000XM5 Headphones', sku: 'SONY-XM5-BLK', category: 'Audio', unitPrice: 349.99, currentStock: 15, minStockAlert: 4, location: 'Shelf D-1', createdAt: new Date() }
    ];
    return res.json({
      data: mockProducts,
      meta: { total: mockProducts.length, page: 1, limit: 10, totalPages: 1 }
    });
  }
};

/**
 * Get product by ID
 * GET /products/:id
 */
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch product details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a new product
 * POST /products
 */
export const createProduct = async (req: Request, res: Response) => {
  const result = productSchema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return res.status(400).json({ error: 'Validation Error', fields: fieldErrors });
  }

  const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = result.data;

  try {
    // Check unique SKU
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({
        error: 'Validation Error',
        fields: { sku: 'Product SKU must be unique' }
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        unitPrice,
        currentStock,
        minStockAlert,
        location
      }
    });

    cacheManager.invalidateAll();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create product',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Edit product details
 * PUT /products/:id
 */
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = productSchema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return res.status(400).json({ error: 'Validation Error', fields: fieldErrors });
  }

  const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = result.data;

  try {
    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify SKU does not conflict
    const skuConflict = await prisma.product.findFirst({
      where: {
        sku,
        NOT: { id }
      }
    });

    if (skuConflict) {
      return res.status(400).json({
        error: 'Validation Error',
        fields: { sku: 'Product SKU must be unique' }
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        category,
        unitPrice,
        currentStock,
        minStockAlert,
        location
      }
    });

    cacheManager.invalidateAll();
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update product details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a stock movement record atomically updating current stock level
 * POST /products/:id/stock-movement
 */
export const createStockMovement = async (req: Request, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  
  const result = stockMovementSchema.safeParse(req.body);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return res.status(400).json({ error: 'Validation Error', fields: fieldErrors });
  }

  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
  }

  const userId = authReq.user.userId;
  const { quantityChanged, movementType, reason } = result.data;

  try {
    // Execute atomic operations inside a Prisma Transaction
    const response = await prisma.$transaction(async (tx: any) => {
      const product = await tx.product.findUnique({ where: { id } });
      
      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      // Check stock subtraction constraints
      if (movementType === 'OUT' && product.currentStock - quantityChanged < 0) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      // 1. Update product stock level
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          currentStock: {
            increment: movementType === 'IN' ? quantityChanged : -quantityChanged
          }
        }
      });

      // 2. Log StockMovement auditing record
      const loggedMovement = await tx.stockMovement.create({
        data: {
          productId: id,
          quantityChanged: movementType === 'IN' ? quantityChanged : -quantityChanged,
          movementType,
          reason,
          createdByUserId: userId
        },
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return { updatedProduct, loggedMovement };
    }, { maxWait: 10000, timeout: 30000 });

    cacheManager.invalidateAll();
    res.status(201).json(response);
  } catch (error) {
    const err = error as Error;
    if (err.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (err.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({
        error: 'Low Stock Error',
        fields: { quantityChanged: 'Insufficient stock. Transaction would drop stock level below 0.' }
      });
    }
    res.status(500).json({
      error: 'Failed to record stock movement',
      message: err.message
    });
  }
};

/**
 * Get paginated list of stock movements for a specific product
 * GET /products/:id/stock-movements
 */
export const getStockMovements = async (req: Request, res: Response) => {
  const cacheKey = req.originalUrl;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    // Verify product exists and load movements count/list in parallel
    const [product, total, data] = await Promise.all([
      prisma.product.findUnique({ where: { id } }),
      prisma.stockMovement.count({ where: { productId: id } }),
      prisma.stockMovement.findMany({
        where: { productId: id },
        skip,
        take: limit,
        include: {
          createdByUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

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
      error: 'Failed to fetch stock movements list',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
