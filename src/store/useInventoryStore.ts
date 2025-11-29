import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { API_BASE_URL } from '../lib/apiConfig';

const API_BASE = API_BASE_URL;

function getAuthHeaders(): HeadersInit {
  const { token } = useAuthStore.getState();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

const getBranchContext = () => {
  const { selectedBranchId, user } = useAuthStore.getState();
  return {
    branchId: selectedBranchId || user?.branchId || '',
    tenantId: user?.tenantId || '',
    isAllBranches: selectedBranchId === 'all'
  };
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `API Error: ${response.status}`);
  }
  return response.json();
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  min_stock_level: number;
  cost_price: number;
  selling_price: number;
  created_at: string;
  updated_at: string;
}

interface InventoryStats {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface InventoryStore {
  items: InventoryItem[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  loadCategories: () => Promise<void>;
  checkSkuExists: (sku: string, excludeItemId?: string) => boolean;
  findSimilarItems: (name: string) => InventoryItem[];
  createItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<InventoryItem>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<InventoryItem>;
  deleteItem: (id: string) => Promise<void>;
  adjustStock: (itemId: string, quantityChange: number, reason: string) => Promise<InventoryItem>;
  getItemsByCategory: (category: string) => InventoryItem[];
  getLowStockItems: () => InventoryItem[];
  getOutOfStockItems: () => InventoryItem[];
  searchItems: (query: string) => InventoryItem[];
  getInventoryStats: () => Promise<InventoryStats>;
  getProfitMargin: (itemId: string) => number;
  generateLowStockAlerts: () => InventoryItem[];
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  categories: [],
  isLoading: false,
  error: null,

  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const { isAllBranches } = getBranchContext();
      const queryParam = isAllBranches ? '?branch=all' : '';
      const items = await apiFetch<InventoryItem[]>(`/inventory${queryParam}`);
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Failed to load inventory items:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadCategories: async () => {
    try {
      const { isAllBranches } = getBranchContext();
      const queryParam = isAllBranches ? '?branch=all' : '';
      const categories = await apiFetch<string[]>(`/inventory/meta/categories${queryParam}`);
      set({ categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
      const items = get().items;
      const categories = [...new Set(items.map(item => item.category))].sort();
      set({ categories });
    }
  },

  checkSkuExists: (sku: string, excludeItemId?: string): boolean => {
    if (!sku || !sku.trim()) return false;
    const items = get().items;
    return items.some(item => 
      item.sku?.toLowerCase() === sku.toLowerCase() && 
      (excludeItemId ? item.id !== excludeItemId : true)
    );
  },

  findSimilarItems: (name: string): InventoryItem[] => {
    if (!name || name.trim().length < 2) return [];
    const items = get().items;
    const searchTerm = name.toLowerCase().trim();
    return items.filter(item => {
      const itemName = item.name.toLowerCase();
      return itemName.includes(searchTerm) || searchTerm.includes(itemName);
    }).slice(0, 5);
  },

  createItem: async (itemData) => {
    set({ isLoading: true, error: null });
    try {
      const { branchId } = getBranchContext();
      const payload = { ...itemData, branch_id: itemData.branch_id || branchId };
      const newItem = await apiFetch<InventoryItem>('/inventory', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      set(state => ({ items: [newItem, ...state.items], isLoading: false }));
      const categories = get().categories;
      if (!categories.includes(newItem.category)) get().loadCategories();
      return newItem;
    } catch (error) {
      console.error('Failed to create inventory item:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedItem = await apiFetch<InventoryItem>(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      set(state => ({
        items: state.items.map(item => item.id === id ? updatedItem : item),
        isLoading: false
      }));
      if (updates.category) get().loadCategories();
      return updatedItem;
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteItem: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/inventory/${id}`, { method: 'DELETE' });
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  adjustStock: async (itemId: string, quantityChange: number, reason: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiFetch<InventoryItem>(`/inventory/${itemId}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify({ quantity_change: quantityChange, reason })
      });
      set(state => ({
        items: state.items.map(item => item.id === itemId ? result : item),
        isLoading: false
      }));
      return result;
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  getItemsByCategory: (category: string) => {
    return get().items.filter(item => item.category === category);
  },

  getLowStockItems: () => {
    return get().items.filter(item => item.quantity <= item.min_stock_level);
  },

  getOutOfStockItems: () => {
    return get().items.filter(item => item.quantity === 0);
  },

  searchItems: (query: string) => {
    if (!query || query.trim().length === 0) return get().items;
    const searchTerm = query.toLowerCase().trim();
    return get().items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.sku.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
  },

  getInventoryStats: async () => {
    try {
      const { isAllBranches } = getBranchContext();
      const queryParam = isAllBranches ? '?branch=all' : '';
      const stats = await apiFetch<InventoryStats>(`/inventory/stats/summary${queryParam}`);
      return stats;
    } catch (error) {
      console.error('Failed to get inventory stats:', error);
      const items = get().items;
      return {
        total_items: items.length,
        total_value: items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0),
        low_stock_count: items.filter(item => item.quantity <= item.min_stock_level).length,
        out_of_stock_count: items.filter(item => item.quantity === 0).length
      };
    }
  },

  getProfitMargin: (itemId: string) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item || item.cost_price === 0) return 0;
    const profit = item.selling_price - item.cost_price;
    return (profit / item.cost_price) * 100;
  },

  generateLowStockAlerts: () => {
    return get().items.filter(item => item.quantity <= item.min_stock_level);
  }
}));
