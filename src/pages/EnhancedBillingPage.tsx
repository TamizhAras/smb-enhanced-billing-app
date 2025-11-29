import { useEffect, useState, useCallback } from 'react';
import { useEnhancedInvoiceStore } from '../store/useEnhancedInvoiceStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PaymentOptions } from '../components/PaymentOptions';
import { updatePaymentConfig, getPaymentConfig } from '../lib/paymentUtils';

// Helper function to safely format dates (handles Date objects, ISO strings, null, undefined)
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString();
  } catch {
    return '-';
  }
};

// Helper function to safely format currency
const formatCurrency = (amount: number | null | undefined, currency: string = 'INR'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PrinterIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  UserPlusIcon,
  UserIcon,
  TrashIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  InboxIcon
} from '@heroicons/react/24/outline';

export default function BillingPage() {
  const {
    invoices,
    payments,
    companySettings,
    taxRates,
    invoiceTemplates,
    isLoading,
    searchQuery,
    statusFilter,
    loadInvoices,
    loadPayments,
    loadCompanySettings,
    loadTaxRates,
    loadInvoiceTemplates,
    setSearchQuery,
    setStatusFilter,
    getFilteredInvoices,
    getTotalRevenue,
    getPendingPayments,
    getOverdueInvoices,
    getRecentInvoices,
    getPaymentAnalytics,
    getRevenueAnalytics,
    formatCurrency,
    downloadInvoicePDF,
    markAsPaid,
    sendInvoiceEmail,
    sendInvoiceWhatsApp,
    sendInvoiceWhatsAppManual,
    sendInvoiceWhatsAppAuto,
    sendInvoiceSMS,
    processRecurringInvoices,
    addInvoice,
    deleteInvoice,
    generateInvoiceNumber,
    updateCommunicationSettings
  } = useEnhancedInvoiceStore();

  // Customer store for phone-based lookup
  const { 
    customers, 
    loadCustomers, 
    searchByPhone, 
    getCustomerByPhone,
    addCustomer 
  } = useCustomerStore();

  // Inventory store for item selection
  const {
    items: inventoryItems,
    loadItems: loadInventoryItems,
    searchItems: searchInventoryItems,
    adjustStock
  } = useInventoryStore();

  // Get branch context for filtering
  const { selectedBranchId, branches } = useAuthStore();
  const currentBranch = branches.find(b => b.id === selectedBranchId);

  const [selectedTab, setSelectedTab] = useState<'invoices' | 'payments' | 'analytics' | 'settings'>('invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState<number | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  // Communication dropdown state
  const [showCommMenu, setShowCommMenu] = useState<number | null>(null);

  // Delete invoice state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<typeof invoices[0] | null>(null);

  // Item search state for inventory autocomplete
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [itemSearchResults, setItemSearchResults] = useState<typeof inventoryItems>([]);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash' as const,
    reference: ''
  });

  // Communication settings state
  const [commSettings, setCommSettings] = useState({
    enableEmailNotifications: true,
    enableWhatsAppManual: true,
    enableWhatsAppAuto: false,
    enableSMSNotifications: false,
    emailService: 'custom' as 'sendgrid' | 'emailjs' | 'nodemailer' | 'custom',
    emailApiKey: '',
    emailFromAddress: '',
    emailFromName: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappWebhookToken: '',
    smsService: 'twilio' as 'twilio' | 'aws-sns' | 'messagebird' | 'custom',
    smsApiKey: '',
    smsFromNumber: '',
    emailTemplate: '',
    whatsappTemplate: `🧾 *Invoice #{invoiceNumber}*

Dear {customerName},

I hope this message finds you well! 😊

📋 *Invoice Details:*
• Invoice Number: {invoiceNumber}
• Amount Due: {amount}
• Due Date: {dueDate}
• Current Status: {status}

💡 *Gentle Reminder:*
We kindly request your attention to this invoice at your earliest convenience. Your prompt payment helps us continue providing excellent service to valued customers like you.

If you have any questions or need assistance with payment options, please don't hesitate to reach out. We're here to help! 🤝

Thank you so much for your continued trust and business partnership.

Best regards,
{companyName} Team 💼

_This is an automated message. Reply to speak with our team._`,
    smsTemplate: ''
  });

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    businessName: 'Your Business Name',
    businessUPI: 'yourbusiness@paytm',
    businessEmail: 'business@example.com',
    businessPhone: '+91XXXXXXXXXX',
    bankAccountNumber: 'XXXXXXXXXXXX',
    bankIFSC: 'BANKXXXXX',
    bankName: 'Your Bank Name',
    accountHolderName: 'Your Business Name',
    razorpayKeyId: 'rzp_test_xxxxxxxxxx',
    razorpayKeySecret: '',
    enableUPI: true,
    enableRazorpay: false,
    enablePayPal: false,
    enableBankTransfer: true
  });

  // New Invoice Form State
  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, rate: 0, inventoryItemId: undefined as string | undefined, availableStock: undefined as number | undefined }],
    taxRate: 18,
    notes: '',
    status: 'pending' as const
  });

  // Phone search state for customer lookup
  const [phoneSearchResults, setPhoneSearchResults] = useState<typeof customers>([]);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  useEffect(() => {
    loadInvoices();
    loadPayments();
    loadCompanySettings();
    loadCustomers(); // Load customers for phone lookup
    loadInventoryItems(); // Load inventory for item selection
    loadTaxRates();
    loadInvoiceTemplates();
    
    // Process recurring invoices on page load
    processRecurringInvoices();
  }, [selectedBranchId]); // Reload when branch changes

  // Load communication settings when company settings change
  useEffect(() => {
    if (companySettings?.communicationSettings) {
      setCommSettings(prev => ({
        ...prev,
        ...companySettings.communicationSettings
      }));
    }
  }, [companySettings]);

  // Load payment settings from localStorage
  useEffect(() => {
    const savedPaymentSettings = localStorage.getItem('paymentSettings');
    if (savedPaymentSettings) {
      try {
        const parsed = JSON.parse(savedPaymentSettings);
        setPaymentSettings(prev => ({ ...prev, ...parsed }));
        
        // Update payment configuration
        updatePaymentConfig({
          businessName: parsed.businessName || paymentSettings.businessName,
          businessUPI: parsed.businessUPI || paymentSettings.businessUPI,
          businessEmail: parsed.businessEmail || paymentSettings.businessEmail,
          businessPhone: parsed.businessPhone || paymentSettings.businessPhone,
          keyId: parsed.razorpayKeyId || paymentSettings.razorpayKeyId,
          keySecret: parsed.razorpayKeySecret || paymentSettings.razorpayKeySecret
        });
      } catch (error) {
        console.error('Failed to load payment settings:', error);
      }
    }
  }, []);

  // Keyboard shortcuts - Based on efficiency heuristics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // N - New Invoice
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowCreateInvoice(true);
      }
      
      // Escape - Close modals
      if (e.key === 'Escape') {
        setShowCreateInvoice(false);
        setShowPaymentModal(null);
        setShowPaymentOptions(null);
        setShowDeleteConfirm(false);
      }
      
      // 1-4 - Switch tabs
      if (e.key === '1') setSelectedTab('invoices');
      if (e.key === '2') setSelectedTab('payments');
      if (e.key === '3') setSelectedTab('analytics');
      if (e.key === '4') setSelectedTab('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if invoice is overdue (past due date and not paid/cancelled)
  const isInvoiceOverdue = (invoice: typeof invoices[0]) => {
    if (!invoice.dueDate || invoice.status === 'paid' || invoice.status === 'cancelled') {
      return false;
    }
    const dueDate = typeof invoice.dueDate === 'string' ? new Date(invoice.dueDate) : invoice.dueDate;
    return dueDate < new Date();
  };

  const filteredInvoices = getFilteredInvoices();
  const totalRevenue = getTotalRevenue();
  const pendingAmount = getPendingPayments();
  const overdueInvoices = invoices.filter(invoice => isInvoiceOverdue(invoice));
  const recentInvoices = getRecentInvoices(5);
  const paymentAnalytics = getPaymentAnalytics();
  const revenueAnalytics = getRevenueAnalytics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-700 bg-green-100 border border-green-200';
      case 'pending': return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'overdue': return 'text-red-700 bg-red-100 border border-red-200 animate-pulse';
      case 'draft': return 'text-gray-600 bg-gray-100 border border-gray-200';
      case 'cancelled': return 'text-gray-500 bg-gray-50 border border-gray-200 line-through';
      case 'partial': return 'text-blue-700 bg-blue-100 border border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return '✓';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      case 'draft': return '📝';
      case 'cancelled': return '✕';
      case 'partial': return '◐';
      default: return '';
    }
  };

  const handlePayment = async (invoiceId: number, amount: number, method: string) => {
    try {
      await markAsPaid(invoiceId, { 
        amount, 
        method: method as 'cash' | 'card' | 'bank_transfer' | 'upi' | 'cheque' | 'online'
      });
      setShowPaymentModal(null);
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!showPaymentModal || !paymentForm.amount) {
      alert('Please enter the payment amount');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      await markAsPaid(showPaymentModal, { 
        amount, 
        method: paymentForm.method,
        reference: paymentForm.reference || undefined
      });
      
      // Reset form
      setPaymentForm({
        amount: '',
        method: 'cash',
        reference: ''
      });
      setShowPaymentModal(null);
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment. Please try again.');
    }
  };

  // Delete invoice handler
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete?.id) return;
    
    try {
      await deleteInvoice(invoiceToDelete.id);
      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  // Phone search handler with debounce
  const handlePhoneSearch = useCallback((phone: string) => {
    setNewInvoice(prev => ({ ...prev, customerPhone: phone }));
    
    // Only search if phone has at least 3 digits
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length >= 3) {
      const results = searchByPhone(phone);
      setPhoneSearchResults(results);
      setShowPhoneDropdown(results.length > 0);
      
      // Check for exact match (10 digits)
      if (digitsOnly.length === 10) {
        const exactMatch = getCustomerByPhone(phone);
        if (exactMatch) {
          // Don't auto-select, let user choose from dropdown
        } else {
          // Phone not found - show option to add new customer
          setShowPhoneDropdown(true);
        }
      }
    } else {
      setPhoneSearchResults([]);
      setShowPhoneDropdown(false);
    }
    
    // Reset customer selection if phone changes
    setSelectedCustomerId(null);
    setIsNewCustomer(false);
  }, [searchByPhone, getCustomerByPhone]);

  // Select existing customer from dropdown
  const handleSelectCustomer = (customer: typeof customers[0]) => {
    setSelectedCustomerId(customer.id || null);
    setNewInvoice(prev => ({
      ...prev,
      customerName: customer.name,
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      customerAddress: customer.address || ''
    }));
    setShowPhoneDropdown(false);
    setIsNewCustomer(false);
  };

  // Handle adding new customer
  const handleAddNewCustomer = async () => {
    if (!newInvoice.customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    
    try {
      await addCustomer({
        name: newInvoice.customerName,
        email: newInvoice.customerEmail || undefined,
        phone: newInvoice.customerPhone,
        address: newInvoice.customerAddress || undefined,
        status: 'active',
        tags: [],
        averageOrderValue: 0
      });
      
      // Reload customers and find the new one
      await loadCustomers();
      const newCustomer = getCustomerByPhone(newInvoice.customerPhone);
      if (newCustomer) {
        setSelectedCustomerId(newCustomer.id || null);
      }
      
      setShowNewCustomerForm(false);
      setIsNewCustomer(true);
    } catch (error) {
      console.error('Failed to add customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Mark as new customer (without saving yet)
  const handleMarkAsNewCustomer = () => {
    setShowPhoneDropdown(false);
    setShowNewCustomerForm(true);
    setIsNewCustomer(true);
    setSelectedCustomerId(null);
  };

  // Invoice form helper functions
  const addItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, inventoryItemId: undefined, availableStock: undefined }]
    }));
  };

  const removeItem = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Handle item description search for inventory autocomplete
  const handleItemSearch = (index: number, searchText: string) => {
    updateItem(index, 'description', searchText);
    
    if (searchText.trim().length >= 2) {
      const results = searchInventoryItems(searchText);
      setItemSearchResults(results.slice(0, 5)); // Limit to 5 results
      setActiveItemIndex(index);
    } else {
      setItemSearchResults([]);
      setActiveItemIndex(null);
    }
  };

  // Get stock status for an inventory item
  const getStockStatus = (inventoryItemId: string | undefined, requestedQty: number) => {
    if (!inventoryItemId) return null;
    const item = inventoryItems.find(inv => inv.id === inventoryItemId);
    if (!item) return null;

    const availableStock = item.quantity;
    const isOutOfStock = availableStock === 0;
    const isLowStock = availableStock > 0 && availableStock <= item.min_stock_level;
    const isInsufficient = requestedQty > availableStock;

    return {
      availableStock,
      isOutOfStock,
      isLowStock,
      isInsufficient,
      item
    };
  };

  // Select inventory item and populate fields
  const handleSelectInventoryItem = (index: number, inventoryItem: typeof inventoryItems[0]) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { 
          ...item, 
          description: inventoryItem.name,
          rate: inventoryItem.selling_price,
          inventoryItemId: inventoryItem.id, // Track which inventory item was selected
          availableStock: inventoryItem.quantity // Store available stock for validation
        } : item
      )
    }));
    setItemSearchResults([]);
    setActiveItemIndex(null);
  };

  const calculateSubtotal = () => {
    return newInvoice.items.reduce((sum, item) => 
      sum + (item.quantity * item.rate), 0
    );
  };

  const calculateTaxAmount = () => {
    return (calculateSubtotal() * newInvoice.taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.customerName || newInvoice.items.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    // If it's a new customer with phone, save them first
    let customerId = selectedCustomerId || 0;
    if (isNewCustomer && newInvoice.customerPhone && !selectedCustomerId) {
      try {
        await addCustomer({
          name: newInvoice.customerName,
          email: newInvoice.customerEmail || undefined,
          phone: newInvoice.customerPhone,
          address: newInvoice.customerAddress || undefined,
          status: 'active',
          tags: [],
          averageOrderValue: 0
        });
        await loadCustomers();
        const newCustomer = getCustomerByPhone(newInvoice.customerPhone);
        if (newCustomer?.id) {
          customerId = newCustomer.id;
        }
      } catch (error) {
        console.error('Failed to save new customer:', error);
      }
    }

    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      customerId: customerId,
      customerName: newInvoice.customerName,
      customerEmail: newInvoice.customerEmail,
      customerPhone: newInvoice.customerPhone,
      customerAddress: newInvoice.customerAddress,
      issueDate: new Date(newInvoice.issueDate),
      dueDate: new Date(newInvoice.dueDate),
      items: newInvoice.items.filter(item => item.description.trim() !== '').map(item => ({
        ...item,
        amount: item.quantity * item.rate
      })),
      subtotal: calculateSubtotal(),
      taxRate: newInvoice.taxRate,
      taxAmount: calculateTaxAmount(),
      totalAmount: calculateTotal(),
      status: newInvoice.status,
      notes: newInvoice.notes
    };

    try {
      await addInvoice(invoiceData);
      
      // Reduce inventory stock for each item
      for (const item of invoiceData.items) {
        // Find matching inventory item by name
        const inventoryItem = inventoryItems.find(
          inv => inv.name.toLowerCase() === item.description.toLowerCase()
        );
        
        if (inventoryItem?.id) {
          try {
            await adjustStock(
              inventoryItem.id,
              -item.quantity, // Negative to reduce stock
              `Sold - Invoice ${invoiceData.invoiceNumber}`
            );
          } catch (stockError) {
            console.error(`Failed to reduce stock for ${item.description}:`, stockError);
            // Continue with other items even if one fails
          }
        }
      }
      
      // Reload inventory to reflect changes
      await loadInventoryItems();
      
      // Reset form
      setNewInvoice({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, rate: 0, inventoryItemId: undefined, availableStock: undefined }],
        taxRate: 18,
        notes: '',
        status: 'pending'
      });
      // Reset customer lookup state
      setSelectedCustomerId(null);
      setIsNewCustomer(false);
      setShowNewCustomerForm(false);
      setPhoneSearchResults([]);
      setShowPhoneDropdown(false);
      setShowCreateInvoice(false);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice. Please try again.');
    }
  };

  const handleSaveCommunicationSettings = async () => {
    try {
      await updateCommunicationSettings(commSettings);
      alert('✅ Communication settings saved successfully!');
    } catch (error) {
      console.error('Failed to save communication settings:', error);
      alert('❌ Failed to save settings. Please try again.');
    }
  };

  const handleSavePaymentSettings = async () => {
    try {
      // Update payment configuration in the utility
      updatePaymentConfig({
        businessName: paymentSettings.businessName,
        businessUPI: paymentSettings.businessUPI,
        businessEmail: paymentSettings.businessEmail,
        businessPhone: paymentSettings.businessPhone,
        keyId: paymentSettings.razorpayKeyId,
        keySecret: paymentSettings.razorpayKeySecret
      });

      // Save to localStorage for persistence
      localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
      
      alert('✅ Payment settings saved successfully!');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      alert('❌ Failed to save payment settings. Please try again.');
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      switch (action) {
        case 'markPaid':
          // Implementation for bulk mark as paid
          break;
        case 'delete':
          // Implementation for bulk delete
          break;
        case 'export':
          // Implementation for bulk export
          break;
      }
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Billing</h1>
          <p className="text-gray-600">Comprehensive invoice and payment management</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowCreateInvoice(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
          <Button variant="outline">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdueInvoices.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation - Enhanced with badges and status indicators */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="-mb-px flex space-x-1 px-2">
          {[
            { 
              id: 'invoices', 
              name: 'Invoices', 
              icon: DocumentTextIcon,
              badge: invoices.length,
              badgeColor: 'bg-gray-100 text-gray-600'
            },
            { 
              id: 'payments', 
              name: 'Payments', 
              icon: CreditCardIcon,
              badge: invoices.filter(i => i.status === 'pending' || i.status === 'partial').length,
              badgeColor: invoices.filter(i => i.status === 'pending' || i.status === 'partial').length > 0 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-gray-100 text-gray-600',
              alert: invoices.filter(i => i.status === 'overdue').length > 0
            },
            { 
              id: 'analytics', 
              name: 'Analytics', 
              icon: ChartBarIcon,
              badge: null,
              badgeColor: ''
            },
            { 
              id: 'settings', 
              name: 'Settings', 
              icon: Cog6ToothIcon,
              badge: null,
              badgeColor: ''
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm flex items-center rounded-t-lg transition-all duration-200`}
            >
              <tab.icon className={`h-5 w-5 mr-2 ${selectedTab === tab.id ? 'text-blue-500' : 'text-gray-400'}`} />
              {tab.name}
              {tab.badge !== null && tab.badge > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
              {tab.alert && (
                <span className="ml-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" title="Has overdue invoices"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Invoices Tab */}
      {selectedTab === 'invoices' && (
        <div className="space-y-6">
          {/* KPI Summary Cards - Based on F-Pattern reading principle */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue Card */}
            <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(getTotalRevenue())}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                    From {invoices.filter(i => i.status === 'paid').length} paid invoices
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <BanknotesIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            {/* Pending Payments Card */}
            <Card className={`p-4 border-l-4 hover:shadow-md transition-shadow ${
              getPendingPayments() > 0 ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-gray-300'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(getPendingPayments())}</p>
                  <p className="text-xs text-yellow-600 mt-1 flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {invoices.filter(i => i.status === 'pending' || i.status === 'partial').length} awaiting payment
                  </p>
                </div>
                <div className={`p-3 rounded-full ${getPendingPayments() > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                  <ClockIcon className={`h-6 w-6 ${getPendingPayments() > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </Card>

            {/* Overdue Card */}
            {(() => {
              const overdueInvoicesList = invoices.filter(invoice => isInvoiceOverdue(invoice));
              const overdueAmount = overdueInvoicesList.reduce((sum, inv) => sum + (inv.outstandingAmount || inv.totalAmount), 0);
              const hasOverdue = overdueInvoicesList.length > 0;
              
              return (
                <Card className={`p-4 border-l-4 hover:shadow-md transition-shadow ${
                  hasOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overdue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(overdueAmount)}
                      </p>
                      <p className={`text-xs mt-1 flex items-center ${hasOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                        {overdueInvoicesList.length} invoice{overdueInvoicesList.length !== 1 ? 's' : ''} overdue
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${hasOverdue ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}>
                      <ExclamationTriangleIcon className={`h-6 w-6 ${hasOverdue ? 'text-red-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Card>
              );
            })()}

            {/* Total Invoices Card */}
            <Card className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
                  <p className="text-xs text-blue-600 mt-1 flex items-center">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    {invoices.filter(i => i.status === 'paid').length} paid ({invoices.length > 0 ? Math.round((invoices.filter(i => i.status === 'paid').length / invoices.length) * 100) : 0}%)
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="partial">Partial</option>
              </select>
              <Button variant="outline" size="sm">
                <FunnelIcon className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedInvoices.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedInvoices.length} invoice(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleBulkAction('markPaid')}>
                    Mark as Paid
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                    Export
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Invoices Table */}
          <Card>
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-500 text-sm">Loading invoices...</p>
              </div>
            )}
            
            {/* Empty State */}
            {!isLoading && filteredInvoices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <InboxIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-500 text-center max-w-sm mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? "No invoices match your current filters. Try adjusting your search or filter criteria."
                    : "Get started by creating your first invoice. Track payments and manage your business finances."}
                </p>
                <Button onClick={() => setShowCreateInvoice(true)} className="flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Invoice
                </Button>
              </div>
            )}
            
            {/* Table Content */}
            {!isLoading && filteredInvoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoices(filteredInvoices.map(inv => inv.id!));
                          } else {
                            setSelectedInvoices([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices([...selectedInvoices, invoice.id!]);
                            } else {
                              setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(invoice.issueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customerName}
                        </div>
                        {invoice.customerEmail && (
                          <div className="text-sm text-gray-500">
                            {invoice.customerEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </div>
                        {invoice.paidAmount && invoice.paidAmount > 0 && (
                          <div className="text-sm text-gray-500">
                            Paid: {formatCurrency(invoice.paidAmount, invoice.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const displayStatus = isInvoiceOverdue(invoice) ? 'overdue' : invoice.status;
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
                              <span className="mr-1">{getStatusIcon(displayStatus)}</span>
                              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                            </span>
                          );
                        })()}
                        {invoice.isRecurring && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            🔄 Recurring
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.dueDate)}
                        {invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && (
                          <div className="text-red-500 text-xs">Overdue</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoicePDF(invoice.id!)}
                            title="Download PDF"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </Button>
                          {invoice.customerEmail && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendInvoiceEmail(invoice.id!, invoice.customerEmail!)}
                              title="Send via Email"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <PaperAirplaneIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.customerPhone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendInvoiceWhatsApp(invoice.id!, invoice.customerPhone!)}
                              title="Send via WhatsApp"
                              className="text-green-600 hover:text-green-800"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.customerPhone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendInvoiceSMS(invoice.id!, invoice.customerPhone!)}
                              title="Send via SMS"
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <DevicePhoneMobileIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status !== 'paid' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setShowPaymentOptions(invoice.id!)}
                                className="bg-green-600 hover:bg-green-700 text-white mr-2"
                                title="Show Payment Options"
                              >
                                💳 Pay Now
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setShowPaymentModal(invoice.id!)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Record Payment
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setInvoiceToDelete(invoice);
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete Invoice"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {selectedTab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Total Collected</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(payments.filter(p => {
                      const now = new Date();
                      const paymentDate = typeof p.paymentDate === 'string' ? new Date(p.paymentDate) : p.paymentDate;
                      if (!paymentDate || isNaN(paymentDate.getTime())) return false;
                      return paymentDate.getMonth() === now.getMonth() && 
                             paymentDate.getFullYear() === now.getFullYear();
                    }).reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CreditCardIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BanknotesIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
              
              {/* Empty State for Payments */}
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="bg-gray-100 rounded-full p-6 mb-4">
                    <CreditCardIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    Payments will appear here once customers pay their invoices. Create an invoice to get started.
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.slice(0, 10).map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {payment.method.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </Card>

          {/* Payment Methods Analytics */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(paymentAnalytics.paymentMethods).map(([method, amount]) => (
                  <div key={method} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {method.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
              <div className="h-64 flex items-end space-x-2">
                {revenueAnalytics.monthlyRevenue.map(([month, revenue]) => (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ 
                        height: `${Math.max((revenue / Math.max(...revenueAnalytics.monthlyRevenue.map(([,r]) => r))) * 200, 4)}px` 
                      }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                      {month}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Top Customers */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers by Revenue</h3>
              <div className="space-y-4">
                {revenueAnalytics.topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 ml-3">
                        {customer.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(customer.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-6">
          {/* Company Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <Input 
                    value={companySettings?.companyName || ''}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 w-full">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Prefix
                  </label>
                  <Input 
                    value={companySettings?.invoicePrefix || 'INV'}
                    placeholder="INV"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Tax Rate (%)
                  </label>
                  <Input 
                    type="number"
                    value={companySettings?.defaultTaxRate || 0}
                    placeholder="18"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button>Save Settings</Button>
              </div>
            </div>
          </Card>

          {/* Communication Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Settings</h3>
              
              {/* Toggle Switches */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-500">Send invoices via email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={commSettings.enableEmailNotifications}
                      onChange={(e) => setCommSettings(prev => ({ ...prev, enableEmailNotifications: e.target.checked }))}
                      className="h-4 w-4 text-blue-600"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">WhatsApp Manual</div>
                      <div className="text-sm text-gray-500">Open WhatsApp with pre-filled message</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={commSettings.enableWhatsAppManual}
                      onChange={(e) => setCommSettings(prev => ({ ...prev, enableWhatsAppManual: e.target.checked }))}
                      className="h-4 w-4 text-green-600"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">WhatsApp Automatic</div>
                      <div className="text-sm text-gray-500">Send via WhatsApp Business API</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={commSettings.enableWhatsAppAuto}
                      onChange={(e) => setCommSettings(prev => ({ ...prev, enableWhatsAppAuto: e.target.checked }))}
                      className="h-4 w-4 text-green-600"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">SMS Notifications</div>
                      <div className="text-sm text-gray-500">Send via SMS service</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={commSettings.enableSMSNotifications}
                      onChange={(e) => setCommSettings(prev => ({ ...prev, enableSMSNotifications: e.target.checked }))}
                      className="h-4 w-4 text-purple-600"
                    />
                  </label>
                </div>
              </div>

              {/* Email Configuration */}
              {commSettings.enableEmailNotifications && (
                <div className="border-t pt-6 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">📧 Email Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Service</label>
                      <select 
                        value={commSettings.emailService}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, emailService: e.target.value as any }))}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      >
                        <option value="custom">Custom/Manual</option>
                        <option value="sendgrid">SendGrid</option>
                        <option value="emailjs">EmailJS</option>
                        <option value="nodemailer">Nodemailer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                      <Input
                        type="password"
                        value={commSettings.emailApiKey}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, emailApiKey: e.target.value }))}
                        placeholder="Your email service API key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                      <Input
                        type="email"
                        value={commSettings.emailFromAddress}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, emailFromAddress: e.target.value }))}
                        placeholder="noreply@yourcompany.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                      <Input
                        value={commSettings.emailFromName}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, emailFromName: e.target.value }))}
                        placeholder="Your Company Name"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Auto Configuration */}
              {commSettings.enableWhatsAppAuto && (
                <div className="border-t pt-6 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">💬 WhatsApp Business API Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
                      <Input
                        value={commSettings.whatsappPhoneNumberId}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, whatsappPhoneNumberId: e.target.value }))}
                        placeholder="Your WhatsApp Phone Number ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
                      <Input
                        type="password"
                        value={commSettings.whatsappAccessToken}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, whatsappAccessToken: e.target.value }))}
                        placeholder="Your WhatsApp Access Token"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Token</label>
                      <Input
                        value={commSettings.whatsappWebhookToken}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, whatsappWebhookToken: e.target.value }))}
                        placeholder="Your Webhook Verification Token"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SMS Configuration */}
              {commSettings.enableSMSNotifications && (
                <div className="border-t pt-6 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">📱 SMS Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMS Service</label>
                      <select 
                        value={commSettings.smsService}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, smsService: e.target.value as any }))}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      >
                        <option value="twilio">Twilio</option>
                        <option value="aws-sns">AWS SNS</option>
                        <option value="messagebird">MessageBird</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                      <Input
                        type="password"
                        value={commSettings.smsApiKey}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, smsApiKey: e.target.value }))}
                        placeholder="Your SMS service API key"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Number</label>
                      <Input
                        value={commSettings.smsFromNumber}
                        onChange={(e) => setCommSettings(prev => ({ ...prev, smsFromNumber: e.target.value }))}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Message Templates */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">📝 Message Templates</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Template 
                      <span className="text-xs text-gray-500">(Variables: {'{invoiceNumber}'} {'{customerName}'} {'{amount}'} {'{dueDate}'} {'{status}'} {'{companyName}'})</span>
                    </label>
                    <textarea
                      value={commSettings.whatsappTemplate}
                      onChange={(e) => setCommSettings(prev => ({ ...prev, whatsappTemplate: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full h-32"
                      placeholder="🧾 *Invoice #{invoiceNumber}*&#10;&#10;Dear {customerName},&#10;&#10;I hope this message finds you well! 😊&#10;&#10;📋 *Invoice Details:*&#10;• Invoice Number: {invoiceNumber}&#10;• Amount Due: {amount}&#10;• Due Date: {dueDate}&#10;• Current Status: {status}&#10;&#10;💡 *Gentle Reminder:*&#10;We kindly request your attention to this invoice at your earliest convenience. Your prompt payment helps us continue providing excellent service to valued customers like you.&#10;&#10;If you have any questions or need assistance with payment options, please don't hesitate to reach out. We're here to help! 🤝&#10;&#10;Thank you so much for your continued trust and business partnership.&#10;&#10;Best regards,&#10;{companyName} Team 💼&#10;&#10;_This is an automated message. Reply to speak with our team._"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMS Template
                      <span className="text-xs text-gray-500">(Keep it short - 160 chars)</span>
                    </label>
                    <textarea
                      value={commSettings.smsTemplate}
                      onChange={(e) => setCommSettings(prev => ({ ...prev, smsTemplate: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full h-20"
                      placeholder="Invoice {invoiceNumber} - Amount: {amount}, Due: {dueDate}. {companyName}"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <Button onClick={handleSaveCommunicationSettings} className="bg-blue-600 hover:bg-blue-700">
                  Save Communication Settings
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (commSettings.enableWhatsAppManual) {
                      alert('📱 WhatsApp Manual: Ready to use! Click WhatsApp icons to send messages.');
                    }
                    if (commSettings.enableWhatsAppAuto && commSettings.whatsappAccessToken) {
                      alert('🚀 WhatsApp Auto: Configured! Messages will be sent automatically.');
                    } else if (commSettings.enableWhatsAppAuto) {
                      alert('⚠️ WhatsApp Auto: Enabled but missing configuration. Please add API credentials.');
                    }
                  }}
                >
                  Test Configuration
                </Button>
              </div>
            </div>
          </Card>

          {/* Payment Gateway Settings */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">💳 Payment Gateway Configuration</h3>
              
              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Payment Methods</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">📱 UPI Payments</div>
                      <div className="text-sm text-gray-500">Enable UPI QR codes and payment links</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 text-green-600"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">💳 Razorpay Integration</div>
                      <div className="text-sm text-gray-500">Cards, UPI, Net Banking via Razorpay</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="h-4 w-4 text-purple-600"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">🌍 PayPal Integration</div>
                      <div className="text-sm text-gray-500">International payments via PayPal</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="h-4 w-4 text-yellow-600"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">🏦 Bank Transfer</div>
                      <div className="text-sm text-gray-500">Direct bank transfer instructions</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="h-4 w-4 text-gray-600"
                    />
                  </label>
                </div>
              </div>

              {/* Business Payment Details */}
              <div className="border-t pt-6 mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">💼 Your Business Payment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <Input
                      value={paymentSettings.businessName}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                    <Input
                      value={paymentSettings.businessUPI}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, businessUPI: e.target.value }))}
                      placeholder="your-business@bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                    <Input
                      value={paymentSettings.bankAccountNumber}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      placeholder="Your bank account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                    <Input
                      value={paymentSettings.bankIFSC}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankIFSC: e.target.value }))}
                      placeholder="Bank IFSC code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <Input
                      value={paymentSettings.bankName}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Name of your bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                    <Input
                      value={paymentSettings.accountHolderName}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      placeholder="Account holder name"
                    />
                  </div>
                </div>
              </div>

              {/* Razorpay Configuration */}
              <div className="border-t pt-6 mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">🔧 Razorpay Configuration</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Setup Instructions</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Sign up at <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="underline">razorpay.com</a></li>
                          <li>Get your API keys from the dashboard</li>
                          <li>Enter them below to start accepting payments</li>
                          <li>Use test keys for testing, live keys for production</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Key ID</label>
                    <Input
                      type="password"
                      value={paymentSettings.razorpayKeyId}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                      placeholder="rzp_test_xxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your Razorpay API Key ID</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Key Secret</label>
                    <Input
                      type="password"
                      value={paymentSettings.razorpayKeySecret}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                      placeholder="Enter your secret key"
                    />
                    <p className="text-xs text-gray-500 mt-1">Keep this secret and secure!</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSavePaymentSettings}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                💾 Save Payment Settings
              </Button>
            </div>
          </Card>

          {/* Tax Rates */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Rates</h3>
              <div className="space-y-4">
                {taxRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rate.name}</div>
                      <div className="text-sm text-gray-500">{rate.rate}%</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline" className="text-red-600">Delete</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Tax Rate
                </Button>
              </div>
            </div>
          </Card>

          {/* Invoice Templates */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {invoiceTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500 mb-3">{template.layout}</div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Preview</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                  <Button variant="outline">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Create New Invoice</h3>
              <button
                onClick={() => setShowCreateInvoice(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information - Phone First Approach */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Customer Information
                </h4>
                
                {/* Phone Number Input with Autocomplete */}
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <DevicePhoneMobileIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="tel"
                      value={newInvoice.customerPhone}
                      onChange={(e) => handlePhoneSearch(e.target.value)}
                      onFocus={() => {
                        if (phoneSearchResults.length > 0) setShowPhoneDropdown(true);
                      }}
                      placeholder="Enter 10-digit mobile number"
                      className="pl-10"
                      maxLength={10}
                    />
                  </div>
                  
                  {/* Phone Search Dropdown */}
                  {showPhoneDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {phoneSearchResults.length > 0 ? (
                        <>
                          {phoneSearchResults.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{customer.name}</div>
                                  <div className="text-sm text-gray-500">📱 {customer.phone}</div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {customer.totalOrders} orders
                                </div>
                              </div>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={handleMarkAsNewCustomer}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 bg-gray-50 flex items-center text-green-600"
                          >
                            <UserPlusIcon className="w-5 h-5 mr-2" />
                            Add as New Customer
                          </button>
                        </>
                      ) : newInvoice.customerPhone.replace(/\D/g, '').length >= 10 ? (
                        <button
                          type="button"
                          onClick={handleMarkAsNewCustomer}
                          className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center text-green-600"
                        >
                          <UserPlusIcon className="w-5 h-5 mr-2" />
                          New Customer - Click to add details
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
                
                {/* Customer Status Indicator */}
                {selectedCustomerId && !isNewCustomer && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <UserIcon className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <span className="text-green-700 font-medium">Existing Customer: </span>
                      <span className="text-green-600">{newInvoice.customerName}</span>
                    </div>
                  </div>
                )}
                
                {isNewCustomer && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                    <UserPlusIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-blue-700">New Customer - Enter details below</span>
                  </div>
                )}
                
                {/* Customer Details Form */}
                {(showNewCustomerForm || isNewCustomer || !selectedCustomerId) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <Input
                        value={newInvoice.customerName}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Enter customer name"
                        disabled={!!selectedCustomerId && !isNewCustomer}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={newInvoice.customerEmail}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="customer@example.com"
                        disabled={!!selectedCustomerId && !isNewCustomer}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <Input
                        value={newInvoice.customerAddress}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, customerAddress: e.target.value }))}
                        placeholder="Enter address"
                        disabled={!!selectedCustomerId && !isNewCustomer}
                      />
                    </div>
                  </div>
                )}
                
                {/* Show selected customer details (read-only) */}
                {selectedCustomerId && !isNewCustomer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <div className="text-sm text-gray-700">{newInvoice.customerEmail || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Address</label>
                      <div className="text-sm text-gray-700">{newInvoice.customerAddress || '-'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date
                  </label>
                  <Input
                    type="date"
                    value={newInvoice.issueDate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, issueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newInvoice.status}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, status: e.target.value as any }))}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Items</h4>
                  <Button onClick={addItem} size="sm" variant="outline">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {newInvoice.items.map((item, index) => {
                    const stockStatus = getStockStatus(item.inventoryItemId, item.quantity);
                    return (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end relative">
                      <div className="col-span-5 relative">
                        <div className="flex items-center gap-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemSearch(index, e.target.value)}
                            onFocus={() => {
                              if (item.description.length >= 2) {
                                const results = searchInventoryItems(item.description);
                                setItemSearchResults(results.slice(0, 5));
                                setActiveItemIndex(index);
                              }
                            }}
                            onBlur={() => {
                              // Delay to allow click on dropdown
                              setTimeout(() => {
                                if (activeItemIndex === index) {
                                  setItemSearchResults([]);
                                  setActiveItemIndex(null);
                                }
                              }, 200);
                            }}
                            placeholder="Search item or type description..."
                            className={stockStatus?.isInsufficient ? 'border-red-300' : ''}
                          />
                          {/* Stock Status Badges */}
                          {stockStatus && (
                            <div className="flex flex-col gap-1">
                              {stockStatus.isOutOfStock && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                                  ⚠️ Out of Stock
                                </span>
                              )}
                              {!stockStatus.isOutOfStock && stockStatus.isInsufficient && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
                                  ⚠️ Only {stockStatus.availableStock} left
                                </span>
                              )}
                              {!stockStatus.isInsufficient && stockStatus.isLowStock && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                  ⚠️ Low Stock ({stockStatus.availableStock})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Inventory Item Dropdown */}
                        {activeItemIndex === index && itemSearchResults.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {itemSearchResults.map((invItem) => {
                              const isOutOfStock = invItem.quantity === 0;
                              const isLowStock = invItem.quantity > 0 && invItem.quantity <= invItem.min_stock_level;
                              const stockColor = isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600';
                              const stockBadge = isOutOfStock ? '🔴 Out of Stock' : isLowStock ? '🟡 Low Stock' : '🟢 In Stock';
                              
                              return (
                              <button
                                key={invItem.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectInventoryItem(index, invItem);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-sm">{invItem.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                      {invItem.sku && `SKU: ${invItem.sku} · `}
                                      <span className={stockColor}>{stockBadge} ({invItem.quantity} units)</span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-green-600 ml-2">
                                    ₹{invItem.selling_price.toLocaleString()}
                                  </div>
                                </div>
                              </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          min={1}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="Rate"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                          {formatCurrency(item.quantity * item.rate)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {newInvoice.items.length > 1 && (
                          <Button
                            onClick={() => removeItem(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span>Tax:</span>
                        <Input
                          type="number"
                          value={newInvoice.taxRate}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                          className="w-16 text-sm"
                        />
                        <span>%</span>
                      </div>
                      <span>{formatCurrency(calculateTaxAmount())}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full h-20"
                  placeholder="Add any notes or additional information..."
                />
              </div>
            </div>

            {/* Stock Warning Summary */}
            {(() => {
              const stockIssues = newInvoice.items
                .map((item, index) => ({ item, index, stockStatus: getStockStatus(item.inventoryItemId, item.quantity) }))
                .filter(({ stockStatus }) => stockStatus && (stockStatus.isOutOfStock || stockStatus.isInsufficient));
              
              if (stockIssues.length === 0) return null;
              
              return (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-900 mb-2">Stock Availability Warning</h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        {stockIssues.map(({ item, stockStatus }) => (
                          <li key={item.inventoryItemId}>
                            <strong>{item.description}</strong>: Requesting {item.quantity} units, 
                            {stockStatus!.isOutOfStock ? ' but OUT OF STOCK' : ` only ${stockStatus!.availableStock} available`}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-amber-700 mt-2">
                        ℹ️ You can still create this invoice for pre-orders, back-orders, or services. Stock will be deducted where available.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex space-x-3 mt-6 pt-6 border-t">
              <Button 
                onClick={() => setShowCreateInvoice(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateInvoice}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            {(() => {
              const invoice = invoices.find(inv => inv.id === showPaymentModal);
              return (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
                  {invoice && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Invoice: {invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-600">Customer: {invoice.customerName}</div>
                      <div className="text-sm font-medium text-gray-900">
                        Outstanding: {formatCurrency(invoice.outstandingAmount || invoice.totalAmount)}
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder={invoice ? `Max: ${invoice.outstandingAmount || invoice.totalAmount}` : "Enter amount"}
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                      {invoice && (
                        <button
                          type="button"
                          onClick={() => setPaymentForm(prev => ({ 
                            ...prev, 
                            amount: (invoice.outstandingAmount || invoice.totalAmount).toString()
                          }))}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Pay full amount
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value as any }))}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference
                      </label>
                      <Input 
                        placeholder="Transaction reference (optional)"
                        value={paymentForm.reference}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <Button 
                      onClick={() => {
                        setShowPaymentModal(null);
                        setPaymentForm({ amount: '', method: 'cash', reference: '' });
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handlePaymentSubmit}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={!paymentForm.amount}
                    >
                      Record Payment
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Payment Options Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {(() => {
              const invoice = invoices.find(inv => inv.id === showPaymentOptions);
              if (!invoice) return null;
              
              return (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Payment Options</h3>
                      <p className="text-sm text-gray-600">
                        Invoice {invoice.invoiceNumber} - {invoice.customerName}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPaymentOptions(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ✕
                    </button>
                  </div>

                  <PaymentOptions
                    invoiceId={invoice.id!}
                    invoiceNumber={invoice.invoiceNumber}
                    amount={invoice.outstandingAmount || invoice.totalAmount}
                    currency="INR"
                    customerName={invoice.customerName}
                    customerEmail={invoice.customerEmail}
                    customerPhone={invoice.customerPhone}
                    description={`Payment for Invoice ${invoice.invoiceNumber}`}
                    paymentSettings={paymentSettings}
                    onPaymentMethodSelect={(method, details) => {
                      console.log('Payment method selected:', method, details);
                      // You can add additional logic here when payment method is selected
                    }}
                  />

                  <div className="mt-6 text-center">
                    <Button
                      onClick={() => setShowPaymentOptions(null)}
                      variant="outline"
                    >
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {showDeleteConfirm && invoiceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center mb-4 text-red-600">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-bold">Delete Invoice</h2>
            </div>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this invoice?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="text-sm">
                <div><strong>Invoice #:</strong> {invoiceToDelete.invoiceNumber}</div>
                <div><strong>Customer:</strong> {invoiceToDelete.customerName}</div>
                <div><strong>Amount:</strong> {formatCurrency(invoiceToDelete.totalAmount)}</div>
                <div><strong>Status:</strong> {invoiceToDelete.status}</div>
              </div>
            </div>
            <p className="text-sm text-orange-600 mb-4">
              ⚠️ This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={handleDeleteInvoice}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setInvoiceToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Action Button (FAB) - Based on Fitts's Law for easy access */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowCreateInvoice(true)}
          className="group flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          title="Create New Invoice (Press N)"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-16 right-0 hidden group-hover:block">
          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            New Invoice <kbd className="ml-1 bg-gray-700 px-1 rounded">N</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
