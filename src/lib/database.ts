import Dexie, { type Table } from 'dexie';

// Enhanced Invoice Interface with comprehensive billing features
export interface Invoice {
  id?: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  
  // Enhanced financial fields
  items: {
    id?: number;
    description: string;
    quantity: number;
    rate: number;
    amount?: number;
    taxRate?: number;
    discount?: number;
  }[];
  
  subtotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount: number;
  totalAmount: number;
  
  // Payment tracking
  paidAmount?: number;
  outstandingAmount?: number;
  paymentTerms?: string;
  
  // Multi-currency support
  currency?: string;
  exchangeRate?: number;
  
  // Recurring invoices
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringEndDate?: Date;
  parentInvoiceId?: number;
  
  // Additional features
  notes?: string;
  terms?: string;
  footerText?: string;
  templateId?: number;
  sentAt?: Date;
  remindersSent?: number;
  lastReminderDate?: Date;
  
  // Professional features
  poNumber?: string;
  projectId?: number;
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Payment tracking interface
export interface Payment {
  id?: number;
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'upi' | 'cheque' | 'online';
  reference?: string;
  notes?: string;
  paymentDate: Date;
  createdAt: Date;
}

// Company settings for professional invoicing
export interface CompanySettings {
  id?: number;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  taxId?: string;
  gstNumber?: string;
  logoUrl?: string;
  
  // Invoice settings
  defaultCurrency: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  invoiceStartNumber: number;
  quotationPrefix?: string;
  
  // Payment settings
  paymentTerms?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountName: string;
  };
  
  // Branding
  primaryColor?: string;
  secondaryColor?: string;
  
  // Communication settings
  communicationSettings?: {
    enableEmailNotifications: boolean;
    enableWhatsAppManual: boolean;
    enableWhatsAppAuto: boolean;
    enableSMSNotifications: boolean;
    
    // Email service configuration
    emailService?: 'sendgrid' | 'emailjs' | 'nodemailer' | 'custom';
    emailApiKey?: string;
    emailFromAddress?: string;
    emailFromName?: string;
    
    // WhatsApp Business API configuration
    whatsappPhoneNumberId?: string;
    whatsappAccessToken?: string;
    whatsappWebhookToken?: string;
    
    // SMS service configuration
    smsService?: 'twilio' | 'aws-sns' | 'messagebird' | 'custom';
    smsApiKey?: string;
    smsFromNumber?: string;
    
    // Message templates
    emailTemplate?: string;
    whatsappTemplate?: string;
    smsTemplate?: string;
  };
  
  updatedAt: Date;
}

// Tax rates management
export interface TaxRate {
  id?: number;
  name: string;
  rate: number;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Invoice templates for customization
export interface InvoiceTemplate {
  id?: number;
  name: string;
  description?: string;
  layout: 'modern' | 'classic' | 'minimal' | 'professional';
  colorScheme?: string;
  isDefault: boolean;
  customFields?: {
    field: string;
    label: string;
    type: 'text' | 'number' | 'date';
    required: boolean;
  }[];
  createdAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  gstNumber?: string;
  panNumber?: string;
  
  // Customer categorization
  type?: 'individual' | 'business';
  category?: string;
  tags: string[];
  
  // Business metrics
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  creditLimit?: number;
  paymentTerms?: string;
  
  // Status and preferences
  status: 'active' | 'inactive' | 'prospect';
  preferredPaymentMethod?: string;
  notes?: string;
  
  // Relationship tracking
  acquisitionSource?: string;
  referredBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id?: number;
  customerId: number;
  invoiceId?: number;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  feedbackDate: Date;
  responseMethod: 'in-person' | 'phone' | 'email' | 'whatsapp' | 'survey';
  responded: boolean;
  responseDate?: Date;
  responseNote?: string;
  tags: string[];
  createdAt: Date;
}

export interface CustomerVisit {
  id?: number;
  customerId: number;
  customerName: string;
  visitDate: Date;
  purpose: 'inquiry' | 'purchase' | 'complaint' | 'followup' | 'delivery' | 'other';
  duration?: number; // in minutes
  outcome?: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  assignedTo: number;
  assignedToName?: string;
  customerId?: number;
  customerName?: string;
  invoiceId?: number;
  type: 'followup' | 'delivery' | 'collection' | 'support' | 'sales' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: Date;
  completedDate?: Date;
  estimatedDuration?: number; // in hours
  actualDuration?: number; // in hours
  attachments?: string[];
  comments?: {
    text: string;
    author: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface InventoryItem {
  id?: number;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  price: number;
  cost?: number;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unit: string; // 'piece', 'kg', 'liter', etc.
  supplier?: string;
  supplierContact?: string;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Analytics fields
  totalSold: number;
  totalRevenue: number;
  lastSoldDate?: Date;
  averageMonthlyUsage: number;
}

export interface StockMovement {
  id?: number;
  itemId: number;
  itemName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string; // Invoice ID, Purchase Order, etc.
  cost?: number;
  notes?: string;
  createdAt: Date;
  createdBy: number;
}

export interface Staff {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'manager' | 'staff' | 'viewer';
  permissions: {
    billing: boolean;
    customers: boolean;
    feedback: boolean;
    analytics: boolean;
    tasks: boolean;
    inventory: boolean;
    staff: boolean;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIInsight {
  id?: number;
  type: 'customer-tag' | 'payment-delay' | 'feedback-pattern' | 'inventory-optimization' | 'business-opportunity';
  title: string;
  description: string;
  confidence: number; // 0-100
  data: any; // Flexible JSON data
  actionable: boolean;
  actionTaken?: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Enhanced Database Class
export class SMBDatabase extends Dexie {
  customers!: Table<Customer>;
  invoices!: Table<Invoice>;
  payments!: Table<Payment>;
  feedbacks!: Table<Feedback>;
  customerVisits!: Table<CustomerVisit>;
  
  // Phase 3 Tables
  tasks!: Table<Task>;
  inventoryItems!: Table<InventoryItem>;
  stockMovements!: Table<StockMovement>;
  staff!: Table<Staff>;
  aiInsights!: Table<AIInsight>;
  
  // Enhanced billing tables
  companySettings!: Table<CompanySettings>;
  taxRates!: Table<TaxRate>;
  invoiceTemplates!: Table<InvoiceTemplate>;

  constructor() {
    super('SMBDatabase');
    
    // Version 1 - Original tables
    this.version(1).stores({
      customers: '++id, name, email, phone, createdAt, updatedAt, status, totalSpent, totalOrders',
      invoices: '++id, invoiceNumber, customerId, customerName, issueDate, dueDate, status, totalAmount, createdAt',
      payments: '++id, invoiceId, paymentDate, amount, paymentMethod',
      feedbacks: '++id, customerId, invoiceId, customerName, rating, sentiment, feedbackDate, responseMethod',
      customerVisits: '++id, customerId, visitDate, purpose, followUpRequired'
    });

    // Version 2 - Phase 3 additions
    this.version(2).stores({
      customers: '++id, name, email, phone, createdAt, updatedAt, status, totalSpent, totalOrders',
      invoices: '++id, invoiceNumber, customerId, customerName, issueDate, dueDate, status, totalAmount, createdAt',
      payments: '++id, invoiceId, paymentDate, amount, paymentMethod',
      feedbacks: '++id, customerId, invoiceId, customerName, rating, sentiment, feedbackDate, responseMethod',
      customerVisits: '++id, customerId, visitDate, purpose, followUpRequired',
      // New Phase 3 tables
      tasks: '++id, title, assignedTo, customerId, type, priority, status, dueDate, createdAt, createdBy',
      inventoryItems: '++id, name, category, sku, currentStock, minStockLevel, isActive, totalSold, createdAt',
      stockMovements: '++id, itemId, type, quantity, createdAt, createdBy',
      staff: '++id, name, email, role, isActive, createdAt',
      aiInsights: '++id, type, confidence, actionable, createdAt, expiresAt'
    });

    // Version 3 - Enhanced billing features
    this.version(3).stores({
      customers: '++id, name, email, phone, createdAt, updatedAt, status, totalSpent, totalOrders',
      invoices: '++id, invoiceNumber, customerId, customerName, issueDate, dueDate, status, totalAmount, paidAmount, outstandingAmount, currency, isRecurring, parentInvoiceId, createdAt',
      payments: '++id, invoiceId, invoiceNumber, customerId, amount, method, paymentDate, createdAt',
      feedbacks: '++id, customerId, invoiceId, customerName, rating, sentiment, feedbackDate, responseMethod',
      customerVisits: '++id, customerId, visitDate, purpose, followUpRequired',
      // Enhanced billing tables
      companySettings: '++id, companyName, defaultCurrency, defaultTaxRate, invoicePrefix, updatedAt',
      taxRates: '++id, name, rate, isDefault, createdAt',
      invoiceTemplates: '++id, name, layout, isDefault, createdAt',
      // Phase 3 tables
      tasks: '++id, title, assignedTo, customerId, type, priority, status, dueDate, createdAt, createdBy',
      inventoryItems: '++id, name, category, sku, currentStock, minStockLevel, isActive, totalSold, createdAt',
      stockMovements: '++id, itemId, type, quantity, createdAt, createdBy',
      staff: '++id, name, email, role, isActive, createdAt',
      aiInsights: '++id, type, confidence, actionable, createdAt, expiresAt'
    });

    // Hooks for automatic timestamps and calculations
    this.customers.hook('creating', (_primKey, obj, _trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.customers.hook('updating', (modifications, _primKey, _obj, _trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.invoices.hook('creating', (_primKey, obj, _trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.invoices.hook('updating', (modifications, _primKey, _obj, _trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.feedbacks.hook('creating', (_primKey, obj, _trans) => {
      obj.createdAt = new Date();
    });

    this.customerVisits.hook('creating', (_primKey, obj, _trans) => {
      obj.createdAt = new Date();
    });
  }
}

// Database Service Class with Enhanced Methods
export class DatabaseService {
  private db: SMBDatabase;

  constructor() {
    this.db = new SMBDatabase();
  }

  // Customer Analytics
  async getCustomerAnalytics() {
    const customers = await this.db.customers.toArray();
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;
    
    return {
      totalCustomers,
      activeCustomers,
      repeatCustomers: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
      averageOrderValue: customers.reduce((sum, c) => sum + (c.totalSpent / Math.max(c.totalOrders, 1)), 0) / Math.max(totalCustomers, 1)
    };
  }

  // Top Customers by spending
  async getTopCustomers(limit: number = 10) {
    return await this.db.customers
      .orderBy('totalSpent')
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Customer visit tracking
  async addCustomerVisit(customerId: number, purpose: CustomerVisit['purpose'], notes?: string) {
    return await this.db.customerVisits.add({
      customerId,
      customerName: '', // Will be populated by hook
      visitDate: new Date(),
      purpose,
      notes,
      followUpRequired: false,
      createdAt: new Date()
    });
  }

  async getCustomerVisits(customerId: number) {
    return await this.db.customerVisits
      .where('customerId')
      .equals(customerId)
      .reverse()
      .toArray();
  }

  // Update customer spending
  async updateCustomerSpending(customerId: number) {
    const invoices = await this.db.invoices
      .where('customerId')
      .equals(customerId)
      .toArray();
    
    const totalSpent = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    const totalOrders = invoices.length;
    
    await this.db.customers.update(customerId, {
      totalSpent,
      totalOrders,
      updatedAt: new Date()
    });
  }

  // Billing analytics
  async getBillingAnalytics() {
    const invoices = await this.db.invoices.toArray();
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const pendingAmount = invoices
      .filter(inv => ['pending', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.outstandingAmount || inv.totalAmount), 0);
    
    const overdueInvoices = invoices.filter(inv => {
      const today = new Date();
      return inv.status !== 'paid' && inv.dueDate < today;
    });
    
    return {
      totalRevenue,
      pendingAmount,
      overdueCount: overdueInvoices.length,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      averageInvoiceValue: invoices.length > 0 ? 
        invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length : 0
    };
  }

  // Feedback analytics
  async getFeedbackAnalytics() {
    const feedbacks = await this.db.feedbacks.toArray();
    
    if (feedbacks.length === 0) {
      return {
        averageRating: 0,
        totalFeedbacks: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    
    const sentimentBreakdown = feedbacks.reduce((acc, f) => {
      acc[f.sentiment]++;
      return acc;
    }, { positive: 0, neutral: 0, negative: 0 });
    
    const ratingDistribution = feedbacks.reduce((acc, f) => {
      acc[f.rating as keyof typeof acc]++;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    
    return {
      averageRating,
      totalFeedbacks: feedbacks.length,
      sentimentBreakdown,
      ratingDistribution
    };
  }

  // Search functions
  async searchCustomers(query: string) {
    const searchTerm = query.toLowerCase();
    return await this.db.customers
      .filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(searchTerm)
      )
      .toArray();
  }

  async searchInvoices(query: string) {
    const searchTerm = query.toLowerCase();
    return await this.db.invoices
      .filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.customerName.toLowerCase().includes(searchTerm)
      )
      .toArray();
  }

  // Task management
  async getTasksByStatus(status: string) {
    return await this.db.tasks.where('status').equals(status).toArray();
  }

  async getTasksByAssignee(assignedTo: number) {
    return await this.db.tasks.where('assignedTo').equals(assignedTo).toArray();
  }

  async getOverdueTasks() {
    const today = new Date();
    return await this.db.tasks
      .filter(task => task.dueDate < today && task.status !== 'completed')
      .toArray();
  }

  // Inventory management
  async getLowStockItems() {
    return await this.db.inventoryItems
      .filter(item => item.currentStock <= item.minStockLevel && item.isActive)
      .toArray();
  }

  async updateStock(itemId: number, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string) {
    const item = await this.db.inventoryItems.get(itemId);
    if (!item) throw new Error('Item not found');
    
    const previousStock = item.currentStock;
    const newStock = type === 'out' ? previousStock - quantity : 
                     type === 'in' ? previousStock + quantity : quantity;
    
    await this.db.inventoryItems.update(itemId, { 
      currentStock: newStock,
      updatedAt: new Date()
    });
    
    await this.db.stockMovements.add({
      itemId,
      itemName: item.name,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      createdAt: new Date(),
      createdBy: 1 // Default to system user
    });
  }

  // AI Insights generation
  async generateCustomerTagSuggestions() {
    const customers = await this.db.customers.toArray();
    const insights: Omit<AIInsight, 'id' | 'createdAt'>[] = [];

    for (const customer of customers) {
      const invoices = await this.db.invoices.where('customerId').equals(customer.id!).toArray();
      const feedbacks = await this.db.feedbacks.where('customerId').equals(customer.id!).toArray();
      
      let suggestedTag = '';
      let confidence = 0;
      
      // High-value customer detection
      if (customer.totalSpent > 50000) {
        suggestedTag = 'VIP';
        confidence = 95;
      } else if (customer.totalOrders > 10) {
        suggestedTag = 'Loyal';
        confidence = 88;
      } else if (feedbacks.length > 0 && feedbacks.every(f => f.rating >= 4)) {
        suggestedTag = 'Satisfied';
        confidence = 82;
      }
      
      if (suggestedTag && !customer.tags.includes(suggestedTag)) {
        insights.push({
          type: 'customer-tag',
          title: `Suggest "${suggestedTag}" tag for ${customer.name}`,
          description: `Based on ${customer.totalOrders} orders and ₹${customer.totalSpent} spent`,
          confidence,
          data: { customerId: customer.id, suggestedTag },
          actionable: true
        });
      }
    }

    // Save insights
    for (const insight of insights) {
      await this.db.aiInsights.add({
        ...insight,
        createdAt: new Date()
      });
    }

    return insights;
  }

  async detectPaymentDelayPatterns() {
    const overdueInvoices = await this.db.invoices.where('status').equals('overdue').toArray();
    const insights: Omit<AIInsight, 'id' | 'createdAt'>[] = [];

    if (overdueInvoices.length > 5) {
      insights.push({
        type: 'payment-delay',
        title: `${overdueInvoices.length} overdue invoices detected`,
        description: 'Consider implementing payment reminders or incentives for early payment',
        confidence: 90,
        data: { overdueCount: overdueInvoices.length },
        actionable: true
      });
    }

    // Save insights
    for (const insight of insights) {
      await this.db.aiInsights.add({
        ...insight,
        createdAt: new Date()
      });
    }

    return insights;
  }

  // Export data
  async exportData(format: 'json' | 'csv' = 'json') {
    const data = {
      customers: await this.db.customers.toArray(),
      invoices: await this.db.invoices.toArray(),
      payments: await this.db.payments.toArray(),
      feedbacks: await this.db.feedbacks.toArray(),
      customerVisits: await this.db.customerVisits.toArray(),
      tasks: await this.db.tasks.toArray(),
      inventoryItems: await this.db.inventoryItems.toArray(),
      staff: await this.db.staff.toArray(),
      aiInsights: await this.db.aiInsights.toArray()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    return data;
  }

  // Get database instance
  getDatabase() {
    return this.db;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export const db = databaseService.getDatabase();
