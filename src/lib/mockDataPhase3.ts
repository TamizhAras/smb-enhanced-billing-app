import { databaseService } from './database';

// Phase 2 Mock Data (CRM & Feedback)
export const mockCustomers = [
  {
    id: 1,
    name: 'ABC Corporation',
    email: 'contact@abccorp.com',
    phone: '+91 98765 43210',
    address: '123 Business Park, Mumbai, Maharashtra 400001',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    tags: ['VIP', 'Corporate', 'Monthly'],
    notes: 'Large corporate client with monthly orders',
    totalSpent: 250000,
    totalOrders: 15,
    lastOrderDate: new Date('2024-07-15'),
    status: 'active' as const
  },
  {
    id: 2,
    name: 'Tech Solutions Pvt Ltd',
    email: 'orders@techsolutions.in',
    phone: '+91 98765 43211',
    address: '456 Tech Hub, Bangalore, Karnataka 560001',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    tags: ['Tech', 'Regular'],
    notes: 'Technology company, prefers digital invoicing',
    totalSpent: 180000,
    totalOrders: 12,
    lastOrderDate: new Date('2024-07-20'),
    status: 'active' as const
  },
  {
    id: 3,
    name: 'Retail Mart',
    email: 'purchase@retailmart.com',
    phone: '+91 98765 43212',
    address: '789 Shopping Complex, Delhi 110001',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date(),
    tags: ['Retail', 'Bulk'],
    notes: 'Retail chain, bulk orders quarterly',
    totalSpent: 320000,
    totalOrders: 8,
    lastOrderDate: new Date('2024-06-30'),
    status: 'active' as const
  },
  {
    id: 4,
    name: 'StartUp Hub',
    email: 'admin@startuphub.co',
    phone: '+91 98765 43213',
    address: '321 Innovation Center, Pune, Maharashtra 411001',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date(),
    tags: ['Startup', 'Growing'],
    notes: 'Fast-growing startup, increasing order frequency',
    totalSpent: 95000,
    totalOrders: 7,
    lastOrderDate: new Date('2024-07-10'),
    status: 'active' as const
  },
  {
    id: 5,
    name: 'Local Business Co',
    email: 'info@localbiz.com',
    phone: '+91 98765 43214',
    address: '654 Market Street, Chennai, Tamil Nadu 600001',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date(),
    tags: ['Local', 'Small'],
    notes: 'Local business, occasional orders',
    totalSpent: 45000,
    totalOrders: 5,
    lastOrderDate: new Date('2024-06-15'),
    status: 'active' as const
  }
];

export const mockFeedback = [
  {
    id: 1,
    customerId: 1,
    customerName: 'ABC Corporation',
    customerPhone: '+91 98765 43210',
    rating: 5,
    sentiment: 'happy' as const,
    comment: 'Excellent service and timely delivery. Very satisfied with the quality.',
    feedbackDate: new Date('2024-07-16'),
    responseMethod: 'whatsapp' as const,
    isResponded: true,
    createdAt: new Date('2024-07-16')
  },
  {
    id: 2,
    customerId: 2,
    customerName: 'Tech Solutions Pvt Ltd',
    customerPhone: '+91 98765 43211',
    rating: 4,
    sentiment: 'happy' as const,
    comment: 'Good products, could improve packaging for electronics.',
    feedbackDate: new Date('2024-07-21'),
    responseMethod: 'whatsapp' as const,
    isResponded: false,
    createdAt: new Date('2024-07-21')
  },
  {
    id: 3,
    customerId: 3,
    customerName: 'Retail Mart',
    customerPhone: '+91 98765 43212',
    rating: 5,
    sentiment: 'happy' as const,
    comment: 'Perfect bulk order handling. Great for our retail needs.',
    feedbackDate: new Date('2024-07-01'),
    responseMethod: 'direct' as const,
    isResponded: true,
    createdAt: new Date('2024-07-01')
  },
  {
    id: 4,
    customerId: 4,
    customerName: 'StartUp Hub',
    customerPhone: '+91 98765 43213',
    rating: 3,
    sentiment: 'neutral' as const,
    comment: 'Products are okay, but delivery could be faster.',
    feedbackDate: new Date('2024-07-11'),
    responseMethod: 'whatsapp' as const,
    isResponded: false,
    createdAt: new Date('2024-07-11')
  },
  {
    id: 5,
    customerId: 5,
    customerName: 'Local Business Co',
    customerPhone: '+91 98765 43214',
    rating: 4,
    sentiment: 'happy' as const,
    comment: 'Good value for money. Will order again.',
    feedbackDate: new Date('2024-06-16'),
    responseMethod: 'manual' as const,
    isResponded: true,
    createdAt: new Date('2024-06-16')
  },
  {
    id: 6,
    customerId: 1,
    customerName: 'ABC Corporation',
    customerPhone: '+91 98765 43210',
    rating: 2,
    sentiment: 'sad' as const,
    comment: 'Recent order had quality issues. Please check before dispatch.',
    feedbackDate: new Date('2024-07-25'),
    responseMethod: 'whatsapp' as const,
    isResponded: false,
    createdAt: new Date('2024-07-25')
  }
];

export const mockInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    customerId: 1,
    customerName: 'ABC Corporation',
    customerEmail: 'contact@abccorp.com',
    customerPhone: '+91 98765 43210',
    customerAddress: '123 Business Park, Mumbai, Maharashtra 400001',
    issueDate: new Date('2024-07-01'),
    dueDate: new Date('2024-07-31'),
    items: [
      { description: 'Office Chairs (Premium)', quantity: 10, rate: 15000, amount: 150000 },
      { description: 'Desk Setup Service', quantity: 1, rate: 5000, amount: 5000 }
    ],
    subtotal: 155000,
    taxRate: 18,
    taxAmount: 27900,
    totalAmount: 182900,
    status: 'paid' as const,
    notes: 'Monthly corporate order',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-15')
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    customerId: 2,
    customerName: 'Tech Solutions Pvt Ltd',
    customerEmail: 'orders@techsolutions.in',
    customerPhone: '+91 98765 43211',
    customerAddress: '456 Tech Hub, Bangalore, Karnataka 560001',
    issueDate: new Date('2024-07-15'),
    dueDate: new Date('2024-08-15'),
    items: [
      { description: 'Wireless Mouse (Bulk)', quantity: 50, rate: 800, amount: 40000 },
      { description: 'Keyboard Set', quantity: 25, rate: 1200, amount: 30000 }
    ],
    subtotal: 70000,
    taxRate: 18,
    taxAmount: 12600,
    totalAmount: 82600,
    status: 'pending' as const,
    notes: 'Tech equipment order',
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-07-15')
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    customerId: 3,
    customerName: 'Retail Mart',
    customerEmail: 'purchase@retailmart.com',
    customerPhone: '+91 98765 43212',
    customerAddress: '789 Shopping Complex, Delhi 110001',
    issueDate: new Date('2024-06-01'),
    dueDate: new Date('2024-06-15'),
    items: [
      { description: 'A4 Paper (Bulk)', quantity: 200, rate: 300, amount: 60000 },
      { description: 'Stationery Package', quantity: 1, rate: 15000, amount: 15000 }
    ],
    subtotal: 75000,
    taxRate: 18,
    taxAmount: 13500,
    totalAmount: 88500,
    status: 'overdue' as const,
    notes: 'Bulk stationery order',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01')
  }
];

// Phase 3 Mock Data
export const mockStaff = [
  {
    id: 1,
    name: 'Business Owner',
    email: 'owner@business.com',
    phone: '+91 98765 43210',
    role: 'owner' as const,
    permissions: {
      billing: true,
      customers: true,
      feedback: true,
      analytics: true,
      tasks: true,
      inventory: true,
      staff: true
    },
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'Sarah Manager',
    email: 'sarah@business.com',
    phone: '+91 98765 43211',
    role: 'manager' as const,
    permissions: {
      billing: true,
      customers: true,
      feedback: true,
      analytics: true,
      tasks: true,
      inventory: true,
      staff: false
    },
    isActive: true,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: 'John Staff',
    email: 'john@business.com',
    phone: '+91 98765 43212',
    role: 'staff' as const,
    permissions: {
      billing: false,
      customers: true,
      feedback: true,
      analytics: false,
      tasks: true,
      inventory: false,
      staff: false
    },
    isActive: true,
    lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  }
];

export const mockTasks = [
  {
    id: 1,
    title: 'Follow up with VIP customer',
    description: 'Call ABC Corp about their monthly order status',
    assignedTo: 2,
    assignedToName: 'Sarah Manager',
    customerId: 1,
    customerName: 'ABC Corporation',
    type: 'follow-up' as const,
    priority: 'high' as const,
    status: 'todo' as const,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    tags: ['vip', 'monthly-order'],
    notes: 'Check if they need any modifications to their standard order',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdBy: 1
  },
  {
    id: 2,
    title: 'Update inventory levels',
    description: 'Physical count of all items in storage',
    assignedTo: 3,
    assignedToName: 'John Staff',
    type: 'inventory' as const,
    priority: 'medium' as const,
    status: 'in-progress' as const,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    tags: ['monthly-task', 'stock-check'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    createdBy: 1
  },
  {
    id: 3,
    title: 'Process overdue invoices',
    description: 'Send payment reminders to customers with overdue invoices',
    assignedTo: 2,
    assignedToName: 'Sarah Manager',
    type: 'billing' as const,
    priority: 'urgent' as const,
    status: 'todo' as const,
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
    tags: ['payment-reminder', 'urgent'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: 1
  }
];

export const mockInventoryItems = [
  {
    id: 1,
    name: 'Premium Office Chair',
    description: 'Ergonomic office chair with lumbar support',
    category: 'Furniture',
    sku: 'CHAIR-001',
    price: 15000,
    cost: 8000,
    currentStock: 5,
    minStockLevel: 3,
    maxStockLevel: 20,
    unit: 'piece',
    supplier: 'Office Furniture Co.',
    supplierContact: '+91 98765 11111',
    isActive: true,
    tags: ['furniture', 'office', 'premium'],
    totalSold: 45,
    totalRevenue: 675000,
    lastSoldDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    averageMonthlyUsage: 12,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'A4 Copy Paper',
    description: 'High quality white copy paper',
    category: 'Stationery',
    sku: 'PAPER-A4-001',
    price: 300,
    cost: 180,
    currentStock: 2, // Low stock
    minStockLevel: 10,
    maxStockLevel: 100,
    unit: 'ream',
    supplier: 'Paper Mills Ltd.',
    supplierContact: '+91 98765 22222',
    isActive: true,
    tags: ['stationery', 'paper', 'office'],
    totalSold: 850,
    totalRevenue: 255000,
    lastSoldDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    averageMonthlyUsage: 65,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: 'Wireless Mouse',
    description: 'Bluetooth wireless optical mouse',
    category: 'Electronics',
    sku: 'MOUSE-BT-001',
    price: 800,
    cost: 400,
    currentStock: 0, // Out of stock
    minStockLevel: 8,
    maxStockLevel: 50,
    unit: 'piece',
    supplier: 'Electronics Hub',
    supplierContact: '+91 98765 44444',
    isActive: true,
    tags: ['electronics', 'wireless', 'mouse'],
    totalSold: 95,
    totalRevenue: 76000,
    lastSoldDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    averageMonthlyUsage: 22,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date()
  }
];

export const mockStockMovements = [
  {
    id: 1,
    itemId: 1,
    itemName: 'Premium Office Chair',
    type: 'in' as const,
    quantity: 10,
    previousStock: 5,
    newStock: 15,
    reason: 'New stock delivery',
    cost: 8000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    createdBy: 1
  },
  {
    id: 2,
    itemId: 1,
    itemName: 'Premium Office Chair',
    type: 'out' as const,
    quantity: 10,
    previousStock: 15,
    newStock: 5,
    reason: 'Sold to customer',
    reference: 'INV-2024-015',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdBy: 2
  },
  {
    id: 3,
    itemId: 3,
    itemName: 'Wireless Mouse',
    type: 'out' as const,
    quantity: 8,
    previousStock: 8,
    newStock: 0,
    reason: 'Sold - bulk order',
    reference: 'INV-2024-020',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: 2
  }
];

export const mockAIInsights = [
  {
    id: 1,
    type: 'inventory-optimization' as const,
    title: '2 items need immediate restocking',
    description: 'Wireless Mouse is out of stock and A4 Copy Paper is running low',
    confidence: 95,
    data: {
      outOfStock: ['Wireless Mouse'],
      lowStock: ['A4 Copy Paper']
    },
    actionable: true,
    actionTaken: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 2,
    type: 'customer-tag' as const,
    title: 'Suggest "VIP" tag for ABC Corporation',
    description: 'Based on 15 orders and ₹2,50,000 spent, this customer qualifies for VIP status',
    confidence: 88,
    data: {
      customerId: 1,
      suggestedTag: 'VIP',
      totalOrders: 15,
      totalSpent: 250000
    },
    actionable: true,
    actionTaken: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  }
];

// Enhanced Database Initialization
export const initializePhase3MockData = async () => {
  try {
    const db = databaseService.getDatabase();
    
    // Add Phase 2 customers if not exists
    const customersCount = await db.customers.count();
    if (customersCount === 0) {
      for (const customer of mockCustomers) {
        await db.customers.add(customer);
      }
      console.log('Added Phase 2 mock customers');
    }

    // Add Phase 2 feedback if not exists
    const feedbackCount = await db.feedbacks.count();
    if (feedbackCount === 0) {
      for (const fb of mockFeedback) {
        await db.feedbacks.add(fb);
      }
      console.log('Added Phase 2 mock feedback');
    }

    // Add Phase 1 invoices if not exists
    const invoiceCount = await db.invoices.count();
    if (invoiceCount === 0) {
      for (const invoice of mockInvoices) {
        await db.invoices.add(invoice);
      }
      console.log('Added Phase 1 mock invoices');
    }

    // Add staff if not exists
    const staffCount = await db.staff.count();
    if (staffCount === 0) {
      for (const staff of mockStaff) {
        await db.staff.add(staff);
      }
      console.log('Added mock staff data');
    }

    // Add tasks if not exists
    const tasksCount = await db.tasks.count();
    if (tasksCount === 0) {
      for (const task of mockTasks) {
        await db.tasks.add(task);
      }
      console.log('Added mock tasks data');
    }

    // Add inventory items if not exists
    const itemsCount = await db.inventoryItems.count();
    if (itemsCount === 0) {
      for (const item of mockInventoryItems) {
        await db.inventoryItems.add(item);
      }
      console.log('Added mock inventory items');
    }

    // Add stock movements if not exists
    const movementsCount = await db.stockMovements.count();
    if (movementsCount === 0) {
      for (const movement of mockStockMovements) {
        await db.stockMovements.add(movement);
      }
      console.log('Added mock stock movements');
    }

    // Add AI insights if not exists
    const insightsCount = await db.aiInsights.count();
    if (insightsCount === 0) {
      for (const insight of mockAIInsights) {
        await db.aiInsights.add(insight);
      }
      console.log('Added mock AI insights');
    }

    console.log('✅ Phase 2 & Phase 3 mock data initialization complete');
  } catch (error) {
    console.error('❌ Error initializing mock data:', error);
  }
};
