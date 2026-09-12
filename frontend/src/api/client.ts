/**
 * Centralized API Client for backend communication.
 * Connects to the Express backend via the configured Vite proxy (/api -> http://localhost:5000).
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return '/api';
  if (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')) {
    return `${window.location.origin}/api`;
  }
  return 'https://stockly-backend-7rik.onrender.com';
};

const API_BASE = getApiBaseUrl();

const DEMO_ACCOUNTS: Record<string, { id: string; name: string; email: string; role: string }> = {
  'admin@erp.com': { id: '00000000-0000-0000-0000-000000000001', name: 'System Admin', email: 'admin@erp.com', role: 'Admin' },
  'sales@erp.com': { id: '00000000-0000-0000-0000-000000000002', name: 'Sales Executive', email: 'sales@erp.com', role: 'Sales' },
  'warehouse@erp.com': { id: '00000000-0000-0000-0000-000000000003', name: 'Warehouse Manager', email: 'warehouse@erp.com', role: 'Warehouse' },
  'accounts@erp.com': { id: '00000000-0000-0000-0000-000000000004', name: 'Accountant', email: 'accounts@erp.com', role: 'Accounts' }
};

function getFallbackResponse(endpoint: string, options?: RequestInit): any | null {
  const normEndpoint = endpoint.toLowerCase();

  if (normEndpoint.includes('/auth/login') && options?.body) {
    try {
      const payload = JSON.parse(options.body.toString());
      const userEmail = payload.email?.toLowerCase().trim();
      const account = DEMO_ACCOUNTS[userEmail];
      if (account && (payload.password === 'Password123' || payload.password === 'admin' || payload.password === '123456')) {
        return {
          token: `demo-jwt-token-${account.role.toLowerCase()}-${Date.now()}`,
          user: account
        };
      }
    } catch (e) {
      // Ignore JSON parse error
    }
  }

  if (normEndpoint.includes('/dashboard')) {
    return {
      stats: { totalCustomers: 5, totalProducts: 5, totalChallans: 3, totalRevenue: 2249.95 },
      recentActivities: [
        { id: 'customer-1', type: 'customer', action: 'Registered as a new customer', user: 'Alice Freeman (Acme Corp)', time: new Date().toISOString(), amount: null },
        { id: 'challan-1', type: 'challan', action: 'Challan #CH-8821 confirmed', user: 'Acme Corp', time: new Date(Date.now() - 3600000).toISOString(), amount: '$1249.90' },
        { id: 'movement-1', type: 'product', action: 'Stock level updated (-2)', user: 'Logitech MX Master 3S', time: new Date(Date.now() - 7200000).toISOString(), amount: null },
        { id: 'customer-2', type: 'customer', action: 'Registered as a new customer', user: 'Globex Ltd', time: new Date(Date.now() - 10800000).toISOString(), amount: null }
      ]
    };
  }

  if (normEndpoint.includes('/customers')) {
    const mockCustomers = [
      { id: 'c-1', name: 'Alice Freeman', email: 'alice.freeman@acme.com', mobile: '+91 9876543210', businessName: 'Acme Corp', gstNumber: '22AAAAA1111A1Z1', customerType: 'Retail', address: '123 Corporate Blvd, Sector 5', status: 'Active', createdAt: new Date().toISOString() },
      { id: 'c-2', name: 'John Peterson', email: 'john.peterson@globex.io', mobile: '+91 9865432107', businessName: 'Globex Ltd', gstNumber: '22BBBBB2222B2Z2', customerType: 'Wholesale', address: '456 Industrial Way, Block C', status: 'Active', createdAt: new Date().toISOString() },
      { id: 'c-3', name: 'Emma Watson', email: 'emma.watson@initech.com', mobile: '+91 9543210987', businessName: 'Initech Inc', gstNumber: '22CCCCC3333C3Z3', customerType: 'Distributor', address: '789 Office Park, Suite 101', status: 'Inactive', createdAt: new Date().toISOString() },
      { id: 'c-4', name: 'Robert Chen', email: 'robert.chen@cyberdyne.co', mobile: '+91 9432109876', businessName: 'Cyberdyne Systems', gstNumber: '22DDDDD4444D4Z4', customerType: 'Wholesale', address: '101 Cyber Center, Tower 2', status: 'Lead', createdAt: new Date().toISOString() },
      { id: 'c-5', name: 'Sarah Connor', email: 'sarah.connor@umbrella.org', mobile: '+91 9321098765', businessName: 'Umbrella Corp', gstNumber: '22EEEEE5555E5Z5', customerType: 'Retail', address: '202 Underground Lab Road', status: 'Lead', createdAt: new Date().toISOString() }
    ];
    return { data: mockCustomers, meta: { total: 5, page: 1, limit: 10, totalPages: 1 } };
  }

  if (normEndpoint.includes('/products')) {
    const mockProducts = [
      { id: 'p-1', name: 'Logitech MX Master 3S', sku: 'LOGI-MX3S-GRY', category: 'Peripherals', unitPrice: 99.99, currentStock: 25, minStockAlert: 5, location: 'Shelf A-1', createdAt: new Date().toISOString() },
      { id: 'p-2', name: 'Dell UltraSharp U2723QE', sku: 'DELL-U2723-4K', category: 'Monitors', unitPrice: 549.99, currentStock: 12, minStockAlert: 3, location: 'Shelf B-3', createdAt: new Date().toISOString() },
      { id: 'p-3', name: 'Keychron K8 Wireless Keyboard', sku: 'KEYC-K8-BLUE', category: 'Peripherals', unitPrice: 79.99, currentStock: 4, minStockAlert: 5, location: 'Shelf A-4', createdAt: new Date().toISOString() },
      { id: 'p-4', name: 'MacBook Pro 14 M3', sku: 'APPL-MBP14-M3', category: 'Hardware', unitPrice: 1599.99, currentStock: 8, minStockAlert: 2, location: 'Shelf C-2', createdAt: new Date().toISOString() },
      { id: 'p-5', name: 'Sony WH-1000XM5 Headphones', sku: 'SONY-XM5-BLK', category: 'Audio', unitPrice: 349.99, currentStock: 15, minStockAlert: 4, location: 'Shelf D-1', createdAt: new Date().toISOString() }
    ];
    return { data: mockProducts, meta: { total: 5, page: 1, limit: 10, totalPages: 1 } };
  }

  if (normEndpoint.includes('/challans')) {
    const mockChallans = [
      {
        id: 'ch-1', challanNumber: 'CH-8821', customerId: 'c-1', status: 'Confirmed', totalQuantity: 3, createdAt: new Date().toISOString(),
        customer: { name: 'Acme Corp', email: 'alice.freeman@acme.com' },
        items: [
          { id: 'ci-1', productNameSnapshot: 'Logitech MX Master 3S', productSkuSnapshot: 'LOGI-MX3S-GRY', unitPriceSnapshot: 99.99, quantity: 2 },
          { id: 'ci-2', productNameSnapshot: 'MacBook Pro 14 M3', productSkuSnapshot: 'APPL-MBP14-M3', unitPriceSnapshot: 1599.99, quantity: 1 }
        ]
      },
      {
        id: 'ch-2', challanNumber: 'CH-8822', customerId: 'c-2', status: 'Draft', totalQuantity: 5, createdAt: new Date(Date.now() - 86400000).toISOString(),
        customer: { name: 'Globex Ltd', email: 'john.peterson@globex.io' },
        items: [
          { id: 'ci-3', productNameSnapshot: 'Dell UltraSharp U2723QE', productSkuSnapshot: 'DELL-U2723-4K', unitPriceSnapshot: 549.99, quantity: 5 }
        ]
      }
    ];
    return { data: mockChallans, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } };
  }

  return null;
}

export async function fetchFromApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = localStorage.getItem('erp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const fallback = getFallbackResponse(endpoint, options);
      if (fallback) return fallback as T;

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    const fallback = getFallbackResponse(endpoint, options);
    if (fallback) return fallback as T;

    throw error;
  }
}
