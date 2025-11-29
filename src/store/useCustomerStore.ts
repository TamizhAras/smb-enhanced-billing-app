import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import type { Customer, CustomerVisit } from '../lib/database';

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const { token } = useAuthStore.getState();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Generic API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  const result = await response.json();
  return result.data !== undefined ? result.data : result;
}

// Helper to get current branch context
const getBranchContext = () => {
  const { selectedBranchId, user } = useAuthStore.getState();
  return {
    branchId: selectedBranchId || user?.branchId || '',
    tenantId: user?.tenantId || '',
    isAllBranches: selectedBranchId === 'all'
  };
};

interface CustomerStore {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCustomers: () => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalSpent' | 'totalOrders'>) => Promise<void>;
  updateCustomer: (id: number, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  addCustomerVisit: (customerId: number, purpose: 'inquiry' | 'purchase' | 'complaint' | 'followup' | 'delivery' | 'other', notes?: string) => Promise<void>;
  getCustomerVisits: (customerId: number) => Promise<CustomerVisit[]>;
  
  // Phone-based search
  searchByPhone: (phone: string) => Customer[];
  getCustomerByPhone: (phone: string) => Customer | undefined;
  
  // Analytics
  getTopCustomers: (limit?: number) => Customer[];
  getCustomerAnalytics: () => Promise<any>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,

  loadCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const customers = await apiFetch<Customer[]>('/customers');
      set({ customers, isLoading: false });
    } catch (error) {
      console.error('Failed to load customers:', error);
      set({ error: 'Failed to load customers', isLoading: false });
    }
  },

  addCustomer: async (customerData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      console.log('Customer added successfully:', result);
      // Reload the customer list to include the new customer
      await get().loadCustomers();
    } catch (error) {
      console.error('Failed to add customer:', error);
      set({ error: 'Failed to add customer', isLoading: false });
      throw error; // Re-throw so the UI can handle it
    }
  },

  updateCustomer: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      await get().loadCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
      set({ error: 'Failed to update customer', isLoading: false });
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/customers/${id}`, {
        method: 'DELETE'
      });
      await get().loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      set({ error: 'Failed to delete customer', isLoading: false });
    }
  },

  addCustomerVisit: async (customerId, purpose, notes) => {
    try {
      // TODO: Implement customer visit API endpoint
      console.warn('Customer visit API not yet implemented');
    } catch (error) {
      console.error('Failed to add customer visit:', error);
    }
  },

  getCustomerVisits: async (customerId) => {
    try {
      // TODO: Implement customer visit API endpoint
      console.warn('Customer visit API not yet implemented');
      return [];
    } catch (error) {
      console.error('Failed to get customer visits:', error);
      return [];
    }
  },

  // Search customers by phone number (partial match for autocomplete)
  searchByPhone: (phone) => {
    if (!phone || phone.length < 3) return [];
    const normalizedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    return get().customers.filter(customer => 
      customer.phone && customer.phone.replace(/\D/g, '').includes(normalizedPhone)
    );
  },

  // Get exact match customer by phone
  getCustomerByPhone: (phone) => {
    if (!phone) return undefined;
    const normalizedPhone = phone.replace(/\D/g, '');
    return get().customers.find(customer => 
      customer.phone && customer.phone.replace(/\D/g, '') === normalizedPhone
    );
  },

  getTopCustomers: (limit = 10) => {
    return get().customers
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  },

  getCustomerAnalytics: async () => {
    try {
      const stats = await apiFetch<any>('/customers/stats/summary');
      return {
        totalCustomers: stats.totalCount || 0,
        activeCustomers: stats.activeCount || 0,
        repeatCustomers: stats.totalOrders > stats.totalCount ? stats.totalCount : 0,
        averageOrderValue: stats.averageSpending || 0
      };
    } catch (error) {
      console.error('Failed to get customer analytics:', error);
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        repeatCustomers: 0,
        averageOrderValue: 0
      };
    }
  }
}));
