import { create } from 'zustand';
import { databaseService } from '../lib/database';
import type { InventoryItem, StockMovement } from '../lib/database';

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalSold: number;
  totalRevenue: number;
  byCategory: Record<string, number>;
  topSellingItems: InventoryItem[];
  recentMovements: StockMovement[];
}

interface InventoryStore {
  items: InventoryItem[];
  movements: StockMovement[];
  categories: string[];
  isLoading: boolean;
  
  // Actions
  loadItems: () => Promise<void>;
  loadMovements: () => Promise<void>;
  loadCategories: () => Promise<void>;
  
  // Item CRUD
  createItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'totalSold' | 'totalRevenue' | 'averageMonthlyUsage'>) => Promise<number>;
  updateItem: (id: number, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  
  // Stock management
  addStock: (itemId: number, quantity: number, reason: string, cost?: number) => Promise<void>;
  removeStock: (itemId: number, quantity: number, reason: string, reference?: string) => Promise<void>;
  adjustStock: (itemId: number, newQuantity: number, reason: string) => Promise<void>;
  
  // Filtering and searching
  getItemsByCategory: (category: string) => InventoryItem[];
  getLowStockItems: () => InventoryItem[];
  getOutOfStockItems: () => InventoryItem[];
  searchItems: (query: string) => InventoryItem[];
  
  // Analytics
  getInventoryStats: () => Promise<InventoryStats>;
  getTopSellingItems: (limit?: number) => Promise<InventoryItem[]>;
  getProfitMargin: (itemId: number) => number;
  
  // Alerts
  generateLowStockAlerts: () => InventoryItem[];
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  movements: [],
  categories: [],
  isLoading: false,

  loadItems: async () => {
    set({ isLoading: true });
    try {
      const db = databaseService.getDatabase();
      const items = await db.inventoryItems.where('isActive').equals(1).toArray();
      set({ items });
    } catch (error) {
      console.error('Failed to load inventory items:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadMovements: async () => {
    try {
      const db = databaseService.getDatabase();
      const movements = await db.stockMovements
        .orderBy('createdAt')
        .reverse()
        .limit(100)
        .toArray();
      set({ movements });
    } catch (error) {
      console.error('Failed to load stock movements:', error);
    }
  },

  loadCategories: async () => {
    try {
      const items = get().items;
      const categories = [...new Set(items.map(item => item.category))].sort();
      set({ categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  },

  createItem: async (itemData) => {
    try {
      const db = databaseService.getDatabase();
      
      const item: Omit<InventoryItem, 'id'> = {
        ...itemData,
        tags: itemData.tags || [],
        totalSold: 0,
        totalRevenue: 0,
        averageMonthlyUsage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const id = await db.inventoryItems.add(item);
      
      // Note: Stock movement tracking would be handled by a separate StockMovement table
      // which is not currently implemented in the database schema
      
      // Reload items
      await get().loadItems();
      await get().loadCategories();
      
      return id;
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    try {
      const db = databaseService.getDatabase();
      await db.inventoryItems.update(id, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Reload items
      await get().loadItems();
      await get().loadCategories();
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      const db = databaseService.getDatabase();
      await db.inventoryItems.update(id, { 
        isActive: false,
        updatedAt: new Date()
      });
      
      // Reload items
      await get().loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  },

  addStock: async (itemId, quantity, reason, cost) => {
    try {
      const db = databaseService.getDatabase();
      const item = await db.inventoryItems.get(itemId);
      
      if (!item) throw new Error('Item not found');
      
      // Update item stock directly
      await db.inventoryItems.update(itemId, {
        currentStock: item.currentStock + quantity,
        updatedAt: new Date()
      });
      
      // Reload data
      await get().loadItems();
    } catch (error) {
      console.error('Failed to add stock:', error);
      throw error;
    }
  },

  removeStock: async (itemId, quantity, reason, reference) => {
    try {
      const db = databaseService.getDatabase();
      const item = await db.inventoryItems.get(itemId);
      
      if (!item) throw new Error('Item not found');
      if (item.currentStock < quantity) throw new Error('Insufficient stock');
      
      // Update item stock directly
      await db.inventoryItems.update(itemId, {
        currentStock: item.currentStock - quantity,
        updatedAt: new Date()
      });
      
      // Reload data
      await get().loadItems();
    } catch (error) {
      console.error('Failed to remove stock:', error);
      throw error;
    }
  },

  adjustStock: async (itemId, newQuantity, reason) => {
    try {
      const db = databaseService.getDatabase();
      const item = await db.inventoryItems.get(itemId);
      
      if (!item) throw new Error('Item not found');
      
      const difference = newQuantity - item.currentStock;
      
      // Update item stock directly
      await db.inventoryItems.update(itemId, {
        currentStock: newQuantity,
        updatedAt: new Date()
      });
      
      // Reload data
      await get().loadItems();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      throw error;
    }
  },

  getItemsByCategory: (category) => {
    return get().items.filter(item => item.category === category);
  },

  getLowStockItems: () => {
    return get().items.filter(item => 
      item.currentStock <= item.minStockLevel && item.currentStock > 0
    );
  },

  getOutOfStockItems: () => {
    return get().items.filter(item => item.currentStock <= 0);
  },

  searchItems: (query) => {
    const searchTerm = query.toLowerCase();
    return get().items.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.sku?.toLowerCase().includes(searchTerm) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  },

  getInventoryStats: async () => {
    try {
      const items = get().items;
      const movements = get().movements;
      
      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
      const lowStockItems = get().getLowStockItems().length;
      const outOfStockItems = get().getOutOfStockItems().length;
      const totalSold = items.reduce((sum, item) => sum + item.totalSold, 0);
      const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
      
      const byCategory: Record<string, number> = {};
      items.forEach(item => {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      });
      
      const topSellingItems = await get().getTopSellingItems(5);
      const recentMovements = movements.slice(0, 10);
      
      return {
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        totalSold,
        totalRevenue,
        byCategory,
        topSellingItems,
        recentMovements
      };
    } catch (error) {
      console.error('Failed to get inventory stats:', error);
      throw error;
    }
  },

  getTopSellingItems: async (limit = 10) => {
    try {
      const db = databaseService.getDatabase();
      const items = await db.inventoryItems
        .orderBy('totalSold')
        .reverse()
        .limit(limit)
        .toArray();
      return items;
    } catch (error) {
      console.error('Failed to get top selling items:', error);
      return [];
    }
  },

  getProfitMargin: (itemId) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item || !item.cost) return 0;
    
    return ((item.price - item.cost) / item.price) * 100;
  },

  generateLowStockAlerts: () => {
    const lowStockItems = get().getLowStockItems();
    const outOfStockItems = get().getOutOfStockItems();
    
    return [...outOfStockItems, ...lowStockItems];
  }
}));
