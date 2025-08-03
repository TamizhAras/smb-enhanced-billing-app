import { create } from 'zustand';
import { databaseService } from '../lib/database';
import type { AIInsight } from '../lib/database';

interface AIStore {
  insights: AIInsight[];
  loading: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  
  // Actions
  fetchInsights: () => Promise<void>;
  loadInsights: () => Promise<void>;
  generateInsights: () => Promise<void>;
  markInsightAsActioned: (id: number) => Promise<void>;
  markInsightActionTaken: (id: number) => Promise<void>;
  dismissInsight: (id: number) => Promise<void>;
  
  // Insight generators
  generateCustomerTagSuggestions: () => Promise<void>;
  generatePaymentDelayInsights: () => Promise<void>;
  generateInventoryOptimizationInsights: () => Promise<void>;
  generateBusinessOpportunityInsights: () => Promise<void>;
  
  // Analytics
  getInsightsByType: (type: string) => AIInsight[];
  getActionableInsights: () => AIInsight[];
  getHighConfidenceInsights: (threshold?: number) => AIInsight[];
}

export const useAIStore = create<AIStore>((set, get) => ({
  insights: [],
  loading: false,
  isLoading: false,
  isGenerating: false,

  fetchInsights: async () => {
    set({ loading: true, isLoading: true });
    try {
      const db = databaseService.getDatabase();
      const insights = await db.aiInsights
        .orderBy('createdAt')
        .reverse()
        .toArray();
      
      // Filter out expired insights
      const now = new Date();
      const validInsights = insights.filter(insight => 
        !insight.expiresAt || insight.expiresAt > now
      );
      
      set({ insights: validInsights, loading: false, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      set({ loading: false, isLoading: false });
    }
  },

  loadInsights: async () => {
    set({ isLoading: true });
    try {
      const db = databaseService.getDatabase();
      const insights = await db.aiInsights
        .orderBy('createdAt')
        .reverse()
        .toArray();
      
      // Filter out expired insights
      const now = new Date();
      const validInsights = insights.filter(insight => 
        !insight.expiresAt || insight.expiresAt > now
      );
      
      set({ insights: validInsights });
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markInsightAsActioned: async (id: number) => {
    try {
      const db = databaseService.getDatabase();
      await db.aiInsights.update(id, { 
        actionTaken: true
      });
      
      set(state => ({
        insights: state.insights.map(insight =>
          insight.id === id ? { ...insight, actionTaken: true } : insight
        )
      }));
    } catch (error) {
      console.error('Failed to mark insight as actioned:', error);
    }
  },

  generateInsights: async () => {
    set({ isGenerating: true });
    try {
      await Promise.all([
        get().generateCustomerTagSuggestions(),
        get().generatePaymentDelayInsights(),
        get().generateInventoryOptimizationInsights(),
        get().generateBusinessOpportunityInsights()
      ]);
      
      await get().loadInsights();
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      set({ isGenerating: false });
    }
  },

  markInsightActionTaken: async (id) => {
    try {
      const db = databaseService.getDatabase();
      await db.aiInsights.update(id, { actionTaken: true });
      await get().loadInsights();
    } catch (error) {
      console.error('Failed to mark insight action taken:', error);
    }
  },

  dismissInsight: async (id) => {
    try {
      const db = databaseService.getDatabase();
      await db.aiInsights.delete(id);
      await get().loadInsights();
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  },

  generateCustomerTagSuggestions: async () => {
    try {
      await databaseService.generateCustomerTagSuggestions();
    } catch (error) {
      console.error('Failed to generate customer tag suggestions:', error);
    }
  },

  generatePaymentDelayInsights: async () => {
    try {
      await databaseService.detectPaymentDelayPatterns();
    } catch (error) {
      console.error('Failed to generate payment delay insights:', error);
    }
  },

  generateInventoryOptimizationInsights: async () => {
    try {
      const db = databaseService.getDatabase();
      const insights: Omit<AIInsight, 'id' | 'createdAt'>[] = [];
      
      // Low stock alerts
      const lowStockItems = await databaseService.getLowStockItems();
      if (lowStockItems.length > 0) {
        insights.push({
          type: 'inventory-optimization',
          title: `${lowStockItems.length} items need restocking`,
          description: 'Consider placing orders to avoid stockouts',
          confidence: 95,
          data: { lowStockItems: lowStockItems.map(item => ({ id: item.id, name: item.name, stock: item.currentStock })) },
          actionable: true
        });
      }
      
      // Overstock detection
      const allItems = await db.inventoryItems.toArray();
      const overstockedItems = allItems.filter(item => 
        item.maxStockLevel && item.currentStock > item.maxStockLevel
      );
      
      if (overstockedItems.length > 0) {
        insights.push({
          type: 'inventory-optimization',
          title: `${overstockedItems.length} items are overstocked`,
          description: 'Consider running promotions to move excess inventory',
          confidence: 88,
          data: { overstockedItems: overstockedItems.map(item => ({ id: item.id, name: item.name, stock: item.currentStock, max: item.maxStockLevel })) },
          actionable: true
        });
      }
      
      // Save insights
      for (const insight of insights) {
        await db.aiInsights.add({
          ...insight,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to generate inventory optimization insights:', error);
    }
  },

  generateBusinessOpportunityInsights: async () => {
    try {
      const db = databaseService.getDatabase();
      const insights: Omit<AIInsight, 'id' | 'createdAt'>[] = [];
      
      // Top customers without recent activity
      const customers = await db.customers.toArray();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const inactiveVips = [];
      for (const customer of customers) {
        if (customer.tags.includes('VIP') || customer.totalSpent > 50000) {
          const recentInvoices = await db.invoices
            .where('customerId')
            .equals(customer.id!)
            .and(invoice => invoice.issueDate > oneMonthAgo)
            .count();
          
          if (recentInvoices === 0) {
            inactiveVips.push(customer);
          }
        }
      }
      
      if (inactiveVips.length > 0) {
        insights.push({
          type: 'business-opportunity',
          title: `${inactiveVips.length} VIP customers haven't ordered recently`,
          description: 'Consider reaching out with special offers or check-ins',
          confidence: 92,
          data: { inactiveVips: inactiveVips.map(c => ({ id: c.id, name: c.name, lastOrder: c.updatedAt })) },
          actionable: true
        });
      }
      
      // Seasonal opportunity detection
      const currentMonth = new Date().getMonth();
      const thisMonthRevenue = await db.invoices
        .where('issueDate')
        .above(new Date(new Date().getFullYear(), currentMonth, 1))
        .toArray()
        .then(invoices => invoices.reduce((sum, inv) => sum + inv.totalAmount, 0));
      
      if (thisMonthRevenue < 10000) { // Arbitrary threshold
        insights.push({
          type: 'business-opportunity',
          title: 'Revenue is below average this month',
          description: 'Consider launching a marketing campaign or special promotion',
          confidence: 75,
          data: { currentMonthRevenue: thisMonthRevenue },
          actionable: true
        });
      }
      
      // Save insights
      for (const insight of insights) {
        await db.aiInsights.add({
          ...insight,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to generate business opportunity insights:', error);
    }
  },

  getInsightsByType: (type) => {
    return get().insights.filter(insight => insight.type === type);
  },

  getActionableInsights: () => {
    return get().insights.filter(insight => insight.actionable && !insight.actionTaken);
  },

  getHighConfidenceInsights: (threshold = 80) => {
    return get().insights.filter(insight => insight.confidence >= threshold);
  }
}));
