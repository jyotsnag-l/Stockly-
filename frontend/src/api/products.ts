import { fetchFromApi } from './client';

export type MovementType = 'IN' | 'OUT';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdAt: string;
  createdByUser?: UserSummary;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProducts {
  data: Product[];
  meta: PaginatedMeta;
}

export interface PaginatedMovements {
  data: StockMovement[];
  meta: PaginatedMeta;
}

export interface StockMovementInput {
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
}

export interface StockMovementResponse {
  updatedProduct: Product;
  loggedMovement: StockMovement;
}

/**
 * Fetch paginated product catalog list
 */
export async function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}): Promise<PaginatedProducts> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search) query.append('search', params.search);
  if (params.category) query.append('category', params.category);
  if (params.lowStock) query.append('lowStock', params.lowStock.toString());

  const queryString = query.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
  return fetchFromApi<PaginatedProducts>(endpoint);
}

/**
 * Fetch details of a single product
 */
export async function getProductById(id: string): Promise<Product> {
  return fetchFromApi<Product>(`/products/${id}`);
}

/**
 * Create a new product in the catalog
 */
export async function createProduct(data: ProductInput): Promise<Product> {
  return fetchFromApi<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update an existing product's metadata
 */
export async function updateProduct(id: string, data: ProductInput): Promise<Product> {
  return fetchFromApi<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Record a manual stock inventory adjustment atomically
 */
export async function createStockMovement(
  productId: string, 
  data: StockMovementInput
): Promise<StockMovementResponse> {
  return fetchFromApi<StockMovementResponse>(`/products/${productId}/stock-movement`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Fetch paginated history of stock movements for a specific product
 */
export async function getProductMovements(
  productId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedMovements> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const queryString = query.toString();
  const endpoint = `/products/${productId}/stock-movements${queryString ? `?${queryString}` : ''}`;
  return fetchFromApi<PaginatedMovements>(endpoint);
}
