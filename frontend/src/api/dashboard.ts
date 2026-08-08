import { fetchFromApi } from './client';

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalChallans: number;
  totalRevenue: number;
}

export interface DashboardActivity {
  id: string;
  type: 'customer' | 'product' | 'challan';
  action: string;
  user: string;
  time: string;
  amount: string | null;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentActivities: DashboardActivity[];
}

/**
 * Fetch dynamic dashboard summary statistics and recent transaction logs
 */
export async function getDashboardData(): Promise<DashboardResponse> {
  return fetchFromApi<DashboardResponse>('/dashboard/stats');
}
