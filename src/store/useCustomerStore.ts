import { create } from 'zustand';
import { db, databaseService } from '../lib/database';
import type { Customer, CustomerVisit } from '../lib/database';

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
      const customers = await db.customers.orderBy('createdAt').reverse().toArray();
      set({ customers, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load customers', isLoading: false });
    }
  },

  addCustomer: async (customerData) => {
    set({ isLoading: true, error: null });
    try {
      await db.customers.add({
        ...customerData,
        totalSpent: 0,
        totalOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await get().loadCustomers();
    } catch (error) {
      set({ error: 'Failed to add customer', isLoading: false });
    }
  },

  updateCustomer: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.customers.update(id, { ...updates, updatedAt: new Date() });
      await get().loadCustomers();
    } catch (error) {
      set({ error: 'Failed to update customer', isLoading: false });
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.customers.delete(id);
      await get().loadCustomers();
    } catch (error) {
      set({ error: 'Failed to delete customer', isLoading: false });
    }
  },

  addCustomerVisit: async (customerId, purpose, notes) => {
    try {
      await databaseService.addCustomerVisit(customerId, purpose, notes);
    } catch (error) {
      console.error('Failed to add customer visit:', error);
    }
  },

  getCustomerVisits: async (customerId) => {
    try {
      return await databaseService.getCustomerVisits(customerId);
    } catch (error) {
      console.error('Failed to get customer visits:', error);
      return [];
    }
  },

  getTopCustomers: (limit = 10) => {
    return get().customers
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  },

  getCustomerAnalytics: async () => {
    try {
      return await databaseService.getCustomerAnalytics();
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
