import { create } from 'zustand';
import { db } from '../lib/database';
import type { 
  Invoice, 
  Payment, 
  CompanySettings, 
  TaxRate, 
  InvoiceTemplate,
  Customer 
} from '../lib/database';
import jsPDF from 'jspdf';

interface InvoiceStore {
  // State
  invoices: Invoice[];
  payments: Payment[];
  companySettings: CompanySettings | null;
  taxRates: TaxRate[];
  invoiceTemplates: InvoiceTemplate[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string;
  dateRange: { start: Date | null; end: Date | null };

  // Actions
  loadInvoices: () => Promise<void>;
  loadPayments: () => Promise<void>;
  loadCompanySettings: () => Promise<void>;
  loadTaxRates: () => Promise<void>;
  loadInvoiceTemplates: () => Promise<void>;
  
  // Invoice Management
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateInvoice: (id: number, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: number) => Promise<void>;
  duplicateInvoice: (id: number) => Promise<number>;
  
  // Invoice Status Management
  markAsPaid: (id: number, paymentData?: Partial<Payment>) => Promise<void>;
  markAsOverdue: (id: number) => Promise<void>;
  markAsCancelled: (id: number) => Promise<void>;
  
  // Payment Management
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (id: number, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (id: number) => Promise<void>;
  
  // Recurring Invoices
  createRecurringInvoice: (parentId: number) => Promise<number>;
  processRecurringInvoices: () => Promise<void>;
  
  // PDF Generation
  generateInvoicePDF: (invoiceId: number, template?: string) => Promise<Blob>;
  downloadInvoicePDF: (invoiceId: number, template?: string) => Promise<void>;
  
  // Settings Management
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<void>;
  updateCommunicationSettings: (settings: CompanySettings['communicationSettings']) => Promise<void>;
  addTaxRate: (taxRate: Omit<TaxRate, 'id' | 'createdAt'>) => Promise<void>;
  updateTaxRate: (id: number, updates: Partial<TaxRate>) => Promise<void>;
  deleteTaxRate: (id: number) => Promise<void>;
  
  // Template Management
  addInvoiceTemplate: (template: Omit<InvoiceTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoiceTemplate: (id: number, updates: Partial<InvoiceTemplate>) => Promise<void>;
  deleteInvoiceTemplate: (id: number) => Promise<void>;
  
  // Search and Filtering
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  getFilteredInvoices: () => Invoice[];
  
  // Analytics and Reports
  getTotalRevenue: (dateRange?: { start: Date; end: Date }) => number;
  getPendingPayments: () => number;
  getOverdueInvoices: () => Invoice[];
  getRecentInvoices: (limit: number) => Invoice[];
  getPaymentAnalytics: () => {
    totalPaid: number;
    averagePaymentTime: number;
    paymentMethods: Record<string, number>;
  };
  getRevenueAnalytics: () => {
    monthlyRevenue: [string, number][];
    yearlyRevenue: number;
    topCustomers: { name: string; revenue: number }[];
    profitMargins: { month: string; profit: number; margin: number }[];
  };
  
  // Auto Invoice Numbering
  generateInvoiceNumber: () => string;
  
  // Currency and Localization
  formatCurrency: (amount: number, currency?: string) => string;
  
  // Communication Integration
  sendInvoiceEmail: (invoiceId: number, email: string) => Promise<boolean>;
  sendInvoiceWhatsApp: (invoiceId: number, phone: string) => Promise<boolean>;
  sendInvoiceWhatsAppManual: (invoiceId: number, phone: string) => Promise<boolean>;
  sendInvoiceWhatsAppAuto: (invoiceId: number, phone: string) => Promise<boolean>;
  sendInvoiceSMS: (invoiceId: number, phone: string) => Promise<boolean>;
  
  // Batch Operations
  markMultipleAsPaid: (invoiceIds: number[]) => Promise<void>;
  deleteMultipleInvoices: (invoiceIds: number[]) => Promise<void>;
  exportInvoices: (format: 'csv' | 'excel', dateRange?: { start: Date; end: Date }) => Promise<void>;
}

export const useEnhancedInvoiceStore = create<InvoiceStore>((set, get) => ({
  // Initial state
  invoices: [],
  payments: [],
  companySettings: null,
  taxRates: [],
  invoiceTemplates: [],
  isLoading: false,
  searchQuery: '',
  statusFilter: 'all',
  dateRange: { start: null, end: null },

  // Load data
  loadInvoices: async () => {
    set({ isLoading: true });
    try {
      const invoices = await db.invoices.orderBy('createdAt').reverse().toArray();
      // Calculate outstanding amounts
      const invoicesWithBalance = invoices.map(invoice => ({
        ...invoice,
        outstandingAmount: invoice.totalAmount - (invoice.paidAmount || 0)
      }));
      set({ invoices: invoicesWithBalance });
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadPayments: async () => {
    try {
      const payments = await db.payments.orderBy('paymentDate').reverse().toArray();
      set({ payments });
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  },

  loadCompanySettings: async () => {
    try {
      const settings = await db.companySettings.toCollection().first();
      set({ companySettings: settings || null });
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  },

  loadTaxRates: async () => {
    try {
      const taxRates = await db.taxRates.orderBy('name').toArray();
      set({ taxRates });
    } catch (error) {
      console.error('Failed to load tax rates:', error);
    }
  },

  loadInvoiceTemplates: async () => {
    try {
      const templates = await db.invoiceTemplates.orderBy('name').toArray();
      set({ invoiceTemplates: templates });
    } catch (error) {
      console.error('Failed to load invoice templates:', error);
    }
  },

  // Invoice Management
  addInvoice: async (invoiceData) => {
    try {
      const { companySettings } = get();
      const newInvoice = {
        ...invoiceData,
        currency: invoiceData.currency || companySettings?.defaultCurrency || 'INR',
        paidAmount: 0,
        outstandingAmount: invoiceData.totalAmount,
        remindersSent: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const id = await db.invoices.add(newInvoice);
      await get().loadInvoices();
      return id as number;
    } catch (error) {
      console.error('Failed to add invoice:', error);
      throw error;
    }
  },

  updateInvoice: async (id, updates) => {
    try {
      await db.invoices.update(id, { ...updates, updatedAt: new Date() });
      await get().loadInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw error;
    }
  },

  deleteInvoice: async (id) => {
    try {
      await db.invoices.delete(id);
      // Also delete related payments
      await db.payments.where('invoiceId').equals(id).delete();
      await get().loadInvoices();
      await get().loadPayments();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      throw error;
    }
  },

  duplicateInvoice: async (id) => {
    try {
      const invoice = await db.invoices.get(id);
      if (!invoice) throw new Error('Invoice not found');
      
      const { id: _, createdAt, updatedAt, invoiceNumber, ...invoiceData } = invoice;
      const newInvoiceNumber = get().generateInvoiceNumber();
      
      return await get().addInvoice({
        ...invoiceData,
        invoiceNumber: newInvoiceNumber,
        status: 'draft',
        paidAmount: 0,
        outstandingAmount: invoice.totalAmount
      });
    } catch (error) {
      console.error('Failed to duplicate invoice:', error);
      throw error;
    }
  },

  // Status Management
  markAsPaid: async (id, paymentData) => {
    try {
      const invoice = await db.invoices.get(id);
      if (!invoice) throw new Error('Invoice not found');
      
      const paymentAmount = paymentData?.amount || invoice.outstandingAmount;
      const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
      const newOutstandingAmount = invoice.totalAmount - newPaidAmount;
      
      // Update invoice status
      const newStatus = newOutstandingAmount <= 0 ? 'paid' : 'partial';
      await get().updateInvoice(id, {
        status: newStatus,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount
      });
      
      // Add payment record
      if (paymentData) {
        await get().addPayment({
          invoiceId: id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          amount: paymentAmount,
          method: paymentData.method || 'cash',
          reference: paymentData.reference,
          notes: paymentData.notes,
          paymentDate: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      throw error;
    }
  },

  markAsOverdue: async (id) => {
    try {
      await get().updateInvoice(id, { status: 'overdue' });
    } catch (error) {
      console.error('Failed to mark invoice as overdue:', error);
      throw error;
    }
  },

  markAsCancelled: async (id) => {
    try {
      await get().updateInvoice(id, { status: 'cancelled' });
    } catch (error) {
      console.error('Failed to mark invoice as cancelled:', error);
      throw error;
    }
  },

  // Payment Management
  addPayment: async (paymentData) => {
    try {
      await db.payments.add({ ...paymentData, createdAt: new Date() });
      await get().loadPayments();
      
      // Update invoice status if this payment affects it
      if (paymentData.invoiceId) {
        const invoice = await db.invoices.get(paymentData.invoiceId);
        if (invoice) {
          const newPaidAmount = (invoice.paidAmount || 0) + paymentData.amount;
          const newOutstandingAmount = invoice.totalAmount - newPaidAmount;
          const newStatus = newOutstandingAmount <= 0 ? 'paid' : 'partial';
          
          await get().updateInvoice(paymentData.invoiceId, {
            paidAmount: newPaidAmount,
            outstandingAmount: newOutstandingAmount,
            status: newStatus
          });
        }
      }
    } catch (error) {
      console.error('Failed to add payment:', error);
      throw error;
    }
  },

  updatePayment: async (id, updates) => {
    try {
      await db.payments.update(id, updates);
      await get().loadPayments();
    } catch (error) {
      console.error('Failed to update payment:', error);
      throw error;
    }
  },

  deletePayment: async (id) => {
    try {
      const payment = await db.payments.get(id);
      if (payment) {
        await db.payments.delete(id);
        
        // Update related invoice
        const invoice = await db.invoices.get(payment.invoiceId);
        if (invoice) {
          const newPaidAmount = (invoice.paidAmount || 0) - payment.amount;
          const newOutstandingAmount = invoice.totalAmount - newPaidAmount;
          const newStatus = newOutstandingAmount <= 0 ? 'paid' : 
                           newPaidAmount > 0 ? 'partial' : 'pending';
          
          await get().updateInvoice(payment.invoiceId, {
            paidAmount: Math.max(0, newPaidAmount),
            outstandingAmount: newOutstandingAmount,
            status: newStatus
          });
        }
      }
      await get().loadPayments();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      throw error;
    }
  },

  // Recurring Invoices
  createRecurringInvoice: async (parentId) => {
    try {
      const parentInvoice = await db.invoices.get(parentId);
      if (!parentInvoice || !parentInvoice.isRecurring) {
        throw new Error('Parent invoice not found or not recurring');
      }
      
      const { id: _, createdAt, updatedAt, invoiceNumber, ...invoiceData } = parentInvoice;
      const newInvoiceNumber = get().generateInvoiceNumber();
      
      // Calculate next due date based on frequency
      const nextDueDate = new Date(parentInvoice.dueDate);
      switch (parentInvoice.recurringFrequency) {
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
      }
      
      return await get().addInvoice({
        ...invoiceData,
        invoiceNumber: newInvoiceNumber,
        parentInvoiceId: parentId,
        issueDate: new Date(),
        dueDate: nextDueDate,
        status: 'pending',
        paidAmount: 0,
        outstandingAmount: invoiceData.totalAmount
      });
    } catch (error) {
      console.error('Failed to create recurring invoice:', error);
      throw error;
    }
  },

  processRecurringInvoices: async () => {
    try {
      const recurringInvoices = await db.invoices
        .where('isRecurring')
        .equals(1)
        .toArray();
      
      const today = new Date();
      
      for (const invoice of recurringInvoices) {
        if (invoice.recurringEndDate && today > invoice.recurringEndDate) {
          continue; // Skip expired recurring invoices
        }
        
        // Check if we need to create next invoice
        const nextDueDate = new Date(invoice.dueDate);
        if (today >= nextDueDate) {
          await get().createRecurringInvoice(invoice.id!);
        }
      }
    } catch (error) {
      console.error('Failed to process recurring invoices:', error);
    }
  },

  // PDF Generation
  generateInvoicePDF: async (invoiceId, template = 'modern') => {
    try {
      const invoice = await db.invoices.get(invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const { companySettings } = get();
      const pdf = new jsPDF();
      
      // Header
      pdf.setFontSize(20);
      pdf.text(companySettings?.companyName || 'Your Company', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text('INVOICE', 20, 50);
      pdf.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 60);
      pdf.text(`Date: ${invoice.issueDate.toLocaleDateString()}`, 20, 70);
      pdf.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 20, 80);
      
      // Customer Info
      pdf.text('Bill To:', 20, 100);
      pdf.text(invoice.customerName, 20, 110);
      if (invoice.customerAddress) {
        pdf.text(invoice.customerAddress, 20, 120);
      }
      
      // Items
      let yPos = 150;
      pdf.text('Description', 20, yPos);
      pdf.text('Qty', 100, yPos);
      pdf.text('Rate', 130, yPos);
      pdf.text('Amount', 160, yPos);
      
      yPos += 10;
      invoice.items.forEach((item) => {
        pdf.text(item.description, 20, yPos);
        pdf.text(item.quantity.toString(), 100, yPos);
        pdf.text(get().formatCurrency(item.rate), 130, yPos);
        pdf.text(get().formatCurrency(item.amount || 0), 160, yPos);
        yPos += 10;
      });
      
      // Totals
      yPos += 10;
      pdf.text(`Subtotal: ${get().formatCurrency(invoice.subtotal)}`, 130, yPos);
      yPos += 10;
      if (invoice.discountAmount) {
        pdf.text(`Discount: ${get().formatCurrency(invoice.discountAmount)}`, 130, yPos);
        yPos += 10;
      }
      pdf.text(`Tax: ${get().formatCurrency(invoice.taxAmount)}`, 130, yPos);
      yPos += 10;
      pdf.setFontSize(14);
      pdf.text(`Total: ${get().formatCurrency(invoice.totalAmount)}`, 130, yPos);
      
      return pdf.output('blob');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  },

  downloadInvoicePDF: async (invoiceId, template) => {
    try {
      const invoice = await db.invoices.get(invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const pdfBlob = await get().generateInvoicePDF(invoiceId, template);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  },

  // Settings Management
  updateCompanySettings: async (settings) => {
    try {
      const existingSettings = await db.companySettings.toCollection().first();
      if (existingSettings) {
        await db.companySettings.update(existingSettings.id!, { 
          ...settings, 
          updatedAt: new Date() 
        });
      } else {
        await db.companySettings.add({ 
          ...settings, 
          updatedAt: new Date() 
        } as CompanySettings);
      }
      await get().loadCompanySettings();
    } catch (error) {
      console.error('Failed to update company settings:', error);
      throw error;
    }
  },

  updateCommunicationSettings: async (communicationSettings) => {
    try {
      const existingSettings = await db.companySettings.toCollection().first();
      if (existingSettings) {
        await db.companySettings.update(existingSettings.id!, { 
          communicationSettings,
          updatedAt: new Date() 
        });
      } else {
        // Create default company settings with communication settings
        await db.companySettings.add({
          companyName: 'Your Company',
          defaultCurrency: 'INR',
          defaultTaxRate: 18,
          invoicePrefix: 'INV',
          invoiceStartNumber: 1,
          communicationSettings,
          updatedAt: new Date()
        } as CompanySettings);
      }
      await get().loadCompanySettings();
    } catch (error) {
      console.error('Failed to update communication settings:', error);
      throw error;
    }
  },

  addTaxRate: async (taxRateData) => {
    try {
      await db.taxRates.add({ ...taxRateData, createdAt: new Date() });
      await get().loadTaxRates();
    } catch (error) {
      console.error('Failed to add tax rate:', error);
      throw error;
    }
  },

  updateTaxRate: async (id, updates) => {
    try {
      await db.taxRates.update(id, updates);
      await get().loadTaxRates();
    } catch (error) {
      console.error('Failed to update tax rate:', error);
      throw error;
    }
  },

  deleteTaxRate: async (id) => {
    try {
      await db.taxRates.delete(id);
      await get().loadTaxRates();
    } catch (error) {
      console.error('Failed to delete tax rate:', error);
      throw error;
    }
  },

  // Template Management
  addInvoiceTemplate: async (templateData) => {
    try {
      await db.invoiceTemplates.add({ ...templateData, createdAt: new Date() });
      await get().loadInvoiceTemplates();
    } catch (error) {
      console.error('Failed to add invoice template:', error);
      throw error;
    }
  },

  updateInvoiceTemplate: async (id, updates) => {
    try {
      await db.invoiceTemplates.update(id, updates);
      await get().loadInvoiceTemplates();
    } catch (error) {
      console.error('Failed to update invoice template:', error);
      throw error;
    }
  },

  deleteInvoiceTemplate: async (id) => {
    try {
      await db.invoiceTemplates.delete(id);
      await get().loadInvoiceTemplates();
    } catch (error) {
      console.error('Failed to delete invoice template:', error);
      throw error;
    }
  },

  // Search and Filtering
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setDateRange: (range) => set({ dateRange: range }),

  getFilteredInvoices: () => {
    const { invoices, searchQuery, statusFilter, dateRange } = get();
    
    return invoices.filter(invoice => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!invoice.invoiceNumber.toLowerCase().includes(query) &&
            !invoice.customerName.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) {
        return false;
      }
      
      // Date range filter
      if (dateRange.start && invoice.issueDate < dateRange.start) {
        return false;
      }
      if (dateRange.end && invoice.issueDate > dateRange.end) {
        return false;
      }
      
      return true;
    });
  },

  // Analytics
  getTotalRevenue: (dateRange) => {
    const { invoices } = get();
    return invoices
      .filter(invoice => {
        if (dateRange) {
          return invoice.issueDate >= dateRange.start && invoice.issueDate <= dateRange.end;
        }
        return true;
      })
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.totalAmount, 0);
  },

  getPendingPayments: () => {
    const { invoices } = get();
    return invoices
      .filter(invoice => ['pending', 'overdue', 'partial'].includes(invoice.status))
      .reduce((total, invoice) => total + (invoice.outstandingAmount || 0), 0);
  },

  getOverdueInvoices: () => {
    const { invoices } = get();
    const today = new Date();
    return invoices.filter(invoice => 
      invoice.status !== 'paid' && 
      invoice.status !== 'cancelled' && 
      invoice.dueDate < today
    );
  },

  getRecentInvoices: (limit) => {
    const { invoices } = get();
    return invoices.slice(0, limit);
  },

  getPaymentAnalytics: () => {
    const { payments } = get();
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate average payment time (simplified)
    const averagePaymentTime = 15; // days - would need more complex calculation
    
    // Payment methods breakdown
    const paymentMethods = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalPaid,
      averagePaymentTime,
      paymentMethods
    };
  },

  getRevenueAnalytics: () => {
    const { invoices } = get();
    
    // Monthly revenue for the last 12 months
    const monthlyRevenue: [string, number][] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.issueDate);
          return invDate.getMonth() === date.getMonth() && 
                 invDate.getFullYear() === date.getFullYear() &&
                 inv.status === 'paid';
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      
      monthlyRevenue.push([monthKey, monthRevenue]);
    }
    
    // Yearly revenue
    const yearlyRevenue = invoices
      .filter(inv => {
        const invDate = new Date(inv.issueDate);
        return invDate.getFullYear() === now.getFullYear() && inv.status === 'paid';
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Top customers by revenue
    const customerRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, inv) => {
        acc[inv.customerName] = (acc[inv.customerName] || 0) + inv.totalAmount;
        return acc;
      }, {} as Record<string, number>);
    
    const topCustomers = Object.entries(customerRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));
    
    // Profit margins (simplified - would need cost data)
    const profitMargins = monthlyRevenue.map(([month, revenue]) => ({
      month,
      profit: revenue * 0.3, // Assuming 30% profit margin
      margin: 30
    }));
    
    return {
      monthlyRevenue,
      yearlyRevenue,
      topCustomers,
      profitMargins
    };
  },

  // Utility functions
  generateInvoiceNumber: () => {
    const { companySettings, invoices } = get();
    const prefix = companySettings?.invoicePrefix || 'INV';
    const startNumber = companySettings?.invoiceStartNumber || 1;
    const nextNumber = startNumber + invoices.length;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    return `${prefix}-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
  },

  formatCurrency: (amount, currency = 'INR') => {
    const { companySettings } = get();
    const curr = currency || companySettings?.defaultCurrency || 'INR';
    
    const formatters: Record<string, Intl.NumberFormat> = {
      'INR': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'EUR': new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
    };
    
    return formatters[curr]?.format(amount) || `₹${amount.toFixed(2)}`;
  },

  // Email Integration (placeholder)
  sendInvoiceEmail: async (invoiceId, email) => {
    try {
      const invoice = await db.invoices.get(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Generate PDF for email attachment (would be base64 encoded)
      const pdfBlob = await get().generateInvoicePDF(invoiceId);
      
      // This would integrate with an email service like EmailJS, SendGrid, or Nodemailer
      // For demo purposes, we'll simulate the email sending
      console.log(`📧 Sending invoice ${invoice.invoiceNumber} to ${email}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark as sent
      await get().updateInvoice(invoiceId, { 
        sentAt: new Date(),
        remindersSent: (invoice.remindersSent || 0) + 1
      });
      
      // Show success message to user
      alert(`✅ Invoice ${invoice.invoiceNumber} sent successfully to ${email}`);
      
      return true;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      alert('❌ Failed to send email. Please try again.');
      return false;
    }
  },

  // WhatsApp Integration (Smart - checks settings)
  sendInvoiceWhatsApp: async (invoiceId: number, phone: string) => {
    try {
      const { companySettings } = get();
      const commSettings = companySettings?.communicationSettings;
      
      // Check if WhatsApp is enabled
      if (!commSettings?.enableWhatsAppManual && !commSettings?.enableWhatsAppAuto) {
        alert('❌ WhatsApp notifications are disabled. Please enable them in Settings.');
        return false;
      }
      
      // Use automatic if enabled and configured, otherwise use manual
      if (commSettings?.enableWhatsAppAuto && commSettings?.whatsappAccessToken) {
        return await get().sendInvoiceWhatsAppAuto(invoiceId, phone);
      } else if (commSettings?.enableWhatsAppManual) {
        return await get().sendInvoiceWhatsAppManual(invoiceId, phone);
      } else {
        alert('❌ WhatsApp is not properly configured. Please check Settings.');
        return false;
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  },

  // WhatsApp Integration (Manual Send)
  sendInvoiceWhatsAppManual: async (invoiceId: number, phone: string) => {
    try {
      const invoice = await db.invoices.get(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Format phone number (remove any non-digits and add country code if needed)
      const cleanPhone = phone.replace(/\D/g, '');
      const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      
      const { companySettings } = get();
      const customTemplate = companySettings?.communicationSettings?.whatsappTemplate;
      
      // Create WhatsApp message (use custom template if available)
      const message = customTemplate 
        ? customTemplate
            .replace('{invoiceNumber}', invoice.invoiceNumber)
            .replace('{customerName}', invoice.customerName)
            .replace('{amount}', get().formatCurrency(invoice.totalAmount))
            .replace('{dueDate}', invoice.dueDate.toLocaleDateString())
            .replace('{status}', invoice.status.toUpperCase())
            .replace('{companyName}', companySettings?.companyName || 'Your Company')
        : `🧾 *Invoice ${invoice.invoiceNumber}*\n\n` +
          `Dear ${invoice.customerName},\n\n` +
          `Please find your invoice details:\n` +
          `• Amount: ${get().formatCurrency(invoice.totalAmount)}\n` +
          `• Due Date: ${invoice.dueDate.toLocaleDateString()}\n` +
          `• Status: ${invoice.status.toUpperCase()}\n\n` +
          `Thank you for your business!\n\n` +
          `${companySettings?.companyName || 'Your Company'}`;

      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
      
      // Open WhatsApp in new tab (USER MUST CLICK SEND)
      window.open(whatsappUrl, '_blank');
      
      // Mark as sent (but note: user still needs to click send in WhatsApp)
      await get().updateInvoice(invoiceId, { 
        sentAt: new Date(),
        remindersSent: (invoice.remindersSent || 0) + 1
      });
      
      console.log(`📱 WhatsApp message prepared for ${whatsappPhone}`);
      alert('📱 WhatsApp opened with pre-filled message. Please click "Send" in WhatsApp to deliver the invoice.');
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      alert('❌ Failed to prepare WhatsApp message. Please try again.');
      return false;
    }
  },

  // WhatsApp Business API Integration (Automatic Send - Requires Setup)
  sendInvoiceWhatsAppAuto: async (invoiceId: number, phone: string) => {
    try {
      const invoice = await db.invoices.get(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Format phone number
      const cleanPhone = phone.replace(/\D/g, '');
      const whatsappPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      
      // WhatsApp Business API payload
      const whatsappPayload = {
        messaging_product: "whatsapp",
        to: whatsappPhone,
        type: "template", // Must use approved templates
        template: {
          name: "invoice_notification", // Pre-approved template name
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: invoice.invoiceNumber },
                { type: "text", text: invoice.customerName },
                { type: "text", text: get().formatCurrency(invoice.totalAmount) },
                { type: "text", text: invoice.dueDate.toLocaleDateString() }
              ]
            }
          ]
        }
      };

      // This would require actual WhatsApp Business API integration
      // const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(whatsappPayload)
      // });

      console.log('📱 Would send automatic WhatsApp message:', whatsappPayload);
      alert('🚧 Automatic WhatsApp sending requires WhatsApp Business API setup. Currently using manual send method.');
      
      // Fallback to manual method
      return await get().sendInvoiceWhatsApp(invoiceId, phone);
    } catch (error) {
      console.error('Failed to send automatic WhatsApp:', error);
      return false;
    }
  },

  // SMS Integration (bonus)
  sendInvoiceSMS: async (invoiceId: number, phone: string) => {
    try {
      const invoice = await db.invoices.get(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Create SMS message (shorter version)
      const message = `Invoice ${invoice.invoiceNumber} - Amount: ${get().formatCurrency(invoice.totalAmount)}, Due: ${invoice.dueDate.toLocaleDateString()}. ${get().companySettings?.companyName || 'Your Company'}`;
      
      // This would integrate with SMS services like Twilio, AWS SNS, etc.
      console.log(`📱 SMS would be sent to ${phone}: ${message}`);
      
      // For demo, we'll create a tel: link that opens SMS app
      const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, '_self');
      
      await get().updateInvoice(invoiceId, { sentAt: new Date() });
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  },

  // Batch Operations
  markMultipleAsPaid: async (invoiceIds) => {
    try {
      for (const id of invoiceIds) {
        await get().markAsPaid(id);
      }
    } catch (error) {
      console.error('Failed to mark multiple invoices as paid:', error);
      throw error;
    }
  },

  deleteMultipleInvoices: async (invoiceIds) => {
    try {
      for (const id of invoiceIds) {
        await get().deleteInvoice(id);
      }
    } catch (error) {
      console.error('Failed to delete multiple invoices:', error);
      throw error;
    }
  },

  exportInvoices: async (format, dateRange) => {
    try {
      const { invoices } = get();
      let filteredInvoices = invoices;
      
      if (dateRange) {
        filteredInvoices = invoices.filter(inv => 
          inv.issueDate >= dateRange.start && inv.issueDate <= dateRange.end
        );
      }
      
      if (format === 'csv') {
        const csvContent = [
          ['Invoice Number', 'Customer', 'Date', 'Due Date', 'Amount', 'Status'].join(','),
          ...filteredInvoices.map(inv => [
            inv.invoiceNumber,
            inv.customerName,
            inv.issueDate.toLocaleDateString(),
            inv.dueDate.toLocaleDateString(),
            inv.totalAmount,
            inv.status
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'invoices.csv';
        link.click();
        URL.revokeObjectURL(url);
      }
      
      // Excel export would require additional library
      
    } catch (error) {
      console.error('Failed to export invoices:', error);
      throw error;
    }
  }
}));
