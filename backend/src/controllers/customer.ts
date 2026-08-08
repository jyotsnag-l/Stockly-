import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { CustomerType, CustomerStatus } from '@prisma/client';
import { cacheManager } from '../services/cache';

// Zod validation schemas
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().regex(/^[+0-9\s-]{10,15}$/, 'Mobile number must be between 10 and 15 digits'),
  businessName: z.string().min(1, 'Business Name is required'),
  gstNumber: z.string().optional().nullable().or(z.literal('')),
  customerType: z.nativeEnum(CustomerType),
  address: z.string().min(1, 'Address is required'),
  status: z.nativeEnum(CustomerStatus),
  followUpDate: z.preprocess(
    (val) => (typeof val === 'string' && val ? new Date(val) : val),
    z.date().optional().nullable()
  )
});

/**
 * Get paginated list of customers
 * GET /customers
 */
export const getCustomers = async (req: Request, res: Response) => {
  const cacheKey = req.originalUrl;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const customerType = req.query.customerType as string;

    const skip = (page - 1) * limit;

    // Filter clauses
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status as CustomerStatus;
    }

    if (customerType && customerType !== 'ALL') {
      where.customerType = customerType as CustomerType;
    }

    // Database Count & Fetch queries in parallel
    const [total, data] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
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
      error: 'Failed to fetch customers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get customer by ID (with detailed timeline notes)
 * GET /customers/:id
 */
export const getCustomerById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        notes: {
          include: {
            createdByUser: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch customer details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a new customer
 * POST /customers
 */
export const createCustomer = async (req: Request, res: Response) => {
  // Validate input schema with Zod
  const result = customerSchema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return res.status(400).json({ error: 'Validation Error', fields: fieldErrors });
  }

  const { name, email, mobile, businessName, gstNumber, customerType, address, status, followUpDate } = result.data;

  try {
    // Verify email is unique
    const existing = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        fields: { email: 'Email address is already in use by another customer' } 
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        mobile,
        businessName,
        gstNumber: gstNumber || null,
        customerType,
        address,
        status,
        followUpDate: followUpDate || null
      }
    });

    cacheManager.invalidateAll();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create customer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update customer details
 * PUT /customers/:id
 */
export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate input schema with Zod
  const result = customerSchema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        fieldErrors[issue.path[0].toString()] = issue.message;
      }
    });
    return res.status(400).json({ error: 'Validation Error', fields: fieldErrors });
  }

  const { name, email, mobile, businessName, gstNumber, customerType, address, status, followUpDate } = result.data;

  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if email conflicts with another record
    const emailConflict = await prisma.customer.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id }
      }
    });

    if (emailConflict) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        fields: { email: 'Email address is already in use by another customer' } 
      });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name,
        email: email.toLowerCase(),
        mobile,
        businessName,
        gstNumber: gstNumber || null,
        customerType,
        address,
        status,
        followUpDate: followUpDate || null
      }
    });

    cacheManager.invalidateAll();
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update customer details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Add a follow-up note for a customer
 * POST /customers/:id/notes
 */
export const createCustomerNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const { note } = req.body;

  if (!note || typeof note !== 'string' || note.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Validation Error', 
      fields: { note: 'Note content cannot be empty' } 
    });
  }

  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user credentials' });
  }

  const userId = authReq.user.userId;

  try {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const newNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        note: note.trim(),
        createdByUserId: userId
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    cacheManager.invalidateAll();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save customer note',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
