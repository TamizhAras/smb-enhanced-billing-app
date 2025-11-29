import { create } from 'zustand';
import type { Invoice } from '../lib/database';
import jsPDF from 'jspdf';
import { useAuthStore } from './useAuthStore';

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

// Helper function to get tenant/branch context
function getBranchContext() {
  const { user, selectedBranchId } = useAuthStore.getState();
  return {
    tenantId: user?.tenantId || '',
    branchId: selectedBranchId || user?.branchId || '',
  };
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
  return result.data || result;
}

interface InvoiceStore {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadInvoices: (token?: string, branchId?: string) => Promise<void>;
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
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

  loadInvoices: async (_token, _branchId) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch from backend API
      const invoices = await apiFetch<Invoice[]>('/invoices');
      set({ invoices, isLoading: false });
    } catch (error) {
      console.error('Failed to load invoices:', error);
      set({ error: 'Failed to load invoices', isLoading: false });
    }
  },

  addInvoice: async (invoiceData) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });
      
      await get().loadInvoices();
    } catch (error) {
      console.error('Failed to add invoice:', error);
      set({ error: 'Failed to add invoice', isLoading: false });
    }
  },

  updateInvoice: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      await get().loadInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      set({ error: 'Failed to update invoice', isLoading: false });
    }
  },

  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiFetch(`/invoices/${id}`, {
        method: 'DELETE'
      });
      
      await get().loadInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
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
