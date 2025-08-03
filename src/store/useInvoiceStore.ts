import { create } from 'zustand';
import { db } from '../lib/database';
import type { Invoice } from '../lib/database';
import jsPDF from 'jspdf';

interface InvoiceStore {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadInvoices: () => Promise<void>;
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: number, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: number) => Promise<void>;
  downloadInvoicePDF: (invoice: Invoice) => void;
  
  // Computed values
  getTotalRevenue: () => number;
  getPendingPayments: () => number;
  getRecentInvoices: (limit?: number) => Invoice[];
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  loadInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const invoices = await db.invoices.orderBy('createdAt').reverse().toArray();
      set({ invoices, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load invoices', isLoading: false });
    }
  },

  addInvoice: async (invoiceData) => {
    set({ isLoading: true, error: null });
    try {
      await db.invoices.add({
        ...invoiceData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update customer spending if customerId exists
      if (invoiceData.customerId && invoiceData.status === 'paid') {
        const customer = await db.customers.get(invoiceData.customerId);
        if (customer) {
          await db.customers.update(invoiceData.customerId, {
            totalSpent: customer.totalSpent + invoiceData.totalAmount,
            totalOrders: customer.totalOrders + 1,
            lastOrderDate: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      await get().loadInvoices();
    } catch (error) {
      set({ error: 'Failed to add invoice', isLoading: false });
    }
  },

  updateInvoice: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.invoices.update(id, { ...updates, updatedAt: new Date() });
      await get().loadInvoices();
    } catch (error) {
      set({ error: 'Failed to update invoice', isLoading: false });
    }
  },

  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.invoices.delete(id);
      await get().loadInvoices();
    } catch (error) {
      set({ error: 'Failed to delete invoice', isLoading: false });
    }
  },

  downloadInvoicePDF: (invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 35);
    doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 20, 45);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 55);
    
    // Customer Info
    doc.text('Bill To:', 20, 75);
    doc.text(invoice.customerName, 20, 85);
    if (invoice.customerEmail) doc.text(invoice.customerEmail, 20, 95);
    if (invoice.customerPhone) doc.text(invoice.customerPhone, 20, 105);
    if (invoice.customerAddress) {
      const lines = invoice.customerAddress.split('\n');
      lines.forEach((line, index) => {
        doc.text(line, 20, 115 + (index * 10));
      });
    }
    
    // Items Table Header
    let yPos = 140;
    doc.text('Description', 20, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Rate', 140, yPos);
    doc.text('Amount', 160, yPos);
    
    yPos += 10;
    doc.line(20, yPos, 190, yPos); // Header line
    
    // Items
    invoice.items.forEach((item) => {
      yPos += 10;
      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`₹${item.rate.toFixed(2)}`, 140, yPos);
      doc.text(`₹${(item.quantity * item.rate).toFixed(2)}`, 160, yPos);
    });
    
    // Totals
    yPos += 20;
    doc.line(120, yPos, 190, yPos); // Totals line
    yPos += 10;
    doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`, 120, yPos);
    yPos += 10;
    doc.text(`Tax (${invoice.taxRate}%): ₹${invoice.taxAmount.toFixed(2)}`, 120, yPos);
    yPos += 10;
    doc.setFontSize(14);
    doc.text(`Total: ₹${invoice.totalAmount.toFixed(2)}`, 120, yPos);
    
    // Notes
    if (invoice.notes) {
      yPos += 20;
      doc.setFontSize(12);
      doc.text('Notes:', 20, yPos);
      yPos += 10;
      doc.text(invoice.notes, 20, yPos);
    }
    
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  },

  getTotalRevenue: () => {
    return get().invoices.reduce((total, invoice) => total + invoice.totalAmount, 0);
  },

  getPendingPayments: () => {
    return get().invoices
      .filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue')
      .reduce((total, invoice) => total + invoice.totalAmount, 0);
  },

  getRecentInvoices: (limit = 5) => {
    return get().invoices.slice(0, limit);
  }
}));
