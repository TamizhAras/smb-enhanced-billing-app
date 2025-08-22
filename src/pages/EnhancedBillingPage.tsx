import { useEffect, useState } from 'react';
import { useEnhancedInvoiceStore } from '../store/useEnhancedInvoiceStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PaymentOptions } from '../components/PaymentOptions';
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
  DevicePhoneMobileIcon
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
    generateInvoiceNumber,
    updateCommunicationSettings
  } = useEnhancedInvoiceStore();

  const [selectedTab, setSelectedTab] = useState<'invoices' | 'payments' | 'analytics' | 'settings'>('invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState<number | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  // Communication dropdown state
  const [showCommMenu, setShowCommMenu] = useState<number | null>(null);

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

  // New Invoice Form State
  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, rate: 0 }],
    taxRate: 18,
    notes: '',
    status: 'pending' as const
  });

  useEffect(() => {
    loadInvoices();
    loadPayments();
    loadCompanySettings();
    loadTaxRates();
    loadInvoiceTemplates();
    
    // Process recurring invoices on page load
    processRecurringInvoices();
  }, []);

  // Load communication settings when company settings change
  useEffect(() => {
    if (companySettings?.communicationSettings) {
      setCommSettings(prev => ({
        ...prev,
        ...companySettings.communicationSettings
      }));
    }
  }, [companySettings]);

  const filteredInvoices = getFilteredInvoices();
  const totalRevenue = getTotalRevenue();
  const pendingAmount = getPendingPayments();
  const overdueInvoices = getOverdueInvoices();
  const recentInvoices = getRecentInvoices(5);
  const paymentAnalytics = getPaymentAnalytics();
  const revenueAnalytics = getRevenueAnalytics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-gray-500 bg-gray-100';
      case 'partial': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
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

  // Invoice form helper functions
  const addItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
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

    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      customerId: 0, // Will be set when customer is selected
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
      
      // Reset form
      setNewInvoice({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, rate: 0 }],
        taxRate: 18,
        notes: '',
        status: 'pending'
      });
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'invoices', name: 'Invoices', icon: DocumentTextIcon },
            { id: 'payments', name: 'Payments', icon: CreditCardIcon },
            { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
            { id: 'settings', name: 'Settings', icon: Cog6ToothIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Invoices Tab */}
      {selectedTab === 'invoices' && (
        <div className="space-y-6">
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
                    <tr key={invoice.id} className="hover:bg-gray-50">
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
                          {invoice.issueDate.toLocaleDateString()}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                        {invoice.isRecurring && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.dueDate.toLocaleDateString()}
                        {invoice.dueDate < new Date() && invoice.status !== 'paid' && (
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {selectedTab === 'payments' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
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
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentDate.toLocaleDateString()}
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
                      defaultValue="Your Business Name"
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                    <Input
                      defaultValue="yourbusiness@paytm"
                      placeholder="your-business@bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                    <Input
                      defaultValue="XXXXXXXXXXXX"
                      placeholder="Your bank account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                    <Input
                      defaultValue="BANKXXXXX"
                      placeholder="Bank IFSC code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <Input
                      defaultValue="Your Bank Name"
                      placeholder="Name of your bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                    <Input
                      defaultValue="Your Business Name"
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
                      placeholder="rzp_test_xxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">Your Razorpay API Key ID</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Key Secret</label>
                    <Input
                      type="password"
                      placeholder="Enter your secret key"
                    />
                    <p className="text-xs text-gray-500 mt-1">Keep this secret and secure!</p>
                  </div>
                </div>
              </div>

              <Button className="bg-green-600 hover:bg-green-700 text-white">
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
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <Input
                    value={newInvoice.customerName}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter customer name"
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    value={newInvoice.customerPhone}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <Input
                    value={newInvoice.customerAddress}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="Enter address"
                  />
                </div>
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
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Qty"
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
                  ))}
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
    </div>
  );
}
