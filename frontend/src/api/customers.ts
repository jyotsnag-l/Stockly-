import { fetchFromApi } from './client';

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdAt: string;
  createdByUser?: UserSummary;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: CustomerNote[];
}

export interface CustomerInput {
  name: string;
  email: string;
  mobile: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: PaginatedMeta;
}

/**
 * Fetch paginated customer records
 */
export async function getCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerType?: string;
}): Promise<PaginatedCustomers> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.customerType) query.append('customerType', params.customerType);

  const queryString = query.toString();
  const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;
  return fetchFromApi<PaginatedCustomers>(endpoint);
}

/**
 * Fetch details of a single customer, including timeline notes
 */
export async function getCustomerById(id: string): Promise<Customer> {
  return fetchFromApi<Customer>(`/customers/${id}`);
}

/**
 * Create a new customer in the database
 */
export async function createCustomer(data: CustomerInput): Promise<Customer> {
  return fetchFromApi<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update an existing customer's profile details
 */
export async function updateCustomer(id: string, data: CustomerInput): Promise<Customer> {
  return fetchFromApi<Customer>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Add a follow-up timeline note to a customer profile
 */
export async function addCustomerNote(customerId: string, note: string): Promise<CustomerNote> {
  return fetchFromApi<CustomerNote>(`/customers/${customerId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note })
  });
}
