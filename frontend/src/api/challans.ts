import { fetchFromApi } from './client';

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  businessName: string;
  address: string;
  email: string;
  mobile: string;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
  customer: CustomerSummary;
  items: ChallanItem[];
  createdByUser?: UserSummary;
}

export interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export interface ChallanInput {
  customerId: string;
  items: ChallanItemInput[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedChallans {
  data: Challan[];
  meta: PaginatedMeta;
}

/**
 * Fetch paginated list of challans
 */
export async function getChallans(params: {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
}): Promise<PaginatedChallans> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.status) query.append('status', params.status);
  if (params.customerId) query.append('customerId', params.customerId);

  const queryString = query.toString();
  const endpoint = `/challans${queryString ? `?${queryString}` : ''}`;
  return fetchFromApi<PaginatedChallans>(endpoint);
}

/**
 * Fetch details of a single challan including snapshot items
 */
export async function getChallanById(id: string): Promise<Challan> {
  return fetchFromApi<Challan>(`/challans/${id}`);
}

/**
 * Create a new delivery challan as Draft
 */
export async function createChallan(data: ChallanInput): Promise<Challan> {
  return fetchFromApi<Challan>('/challans', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update the items of a Draft Challan
 */
export async function updateChallan(id: string, data: { items: ChallanItemInput[] }): Promise<Challan> {
  return fetchFromApi<Challan>(`/challans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Confirm a draft challan (atomically check stock, decrement quantities, log movements)
 */
export async function confirmChallan(id: string): Promise<Challan> {
  return fetchFromApi<Challan>(`/challans/${id}/confirm`, {
    method: 'POST'
  });
}

/**
 * Cancel a challan (restocks the inventory if previously Confirmed)
 */
export async function cancelChallan(id: string): Promise<Challan> {
  return fetchFromApi<Challan>(`/challans/${id}/cancel`, {
    method: 'POST'
  });
}
