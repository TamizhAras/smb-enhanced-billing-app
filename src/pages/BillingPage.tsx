import React, { useEffect, useState } from 'react';
import { Plus, FileText, DollarSign, Calendar, X, Trash2, LineChart, BarChart3 } from 'lucide-react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { apiGetAnalyticsMonthlyRevenue, apiGetAnalyticsRevenueByBranch, apiGetAnalyticsOverdueRevenue, apiGetAnalyticsPendingRevenue } from '../lib/apiService';
import { format } from 'date-fns';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const BillingPage: React.FC = () => {
  const {
    invoices,
    isLoading,
    loadInvoices,
    addInvoice,
    getTotalRevenue,
    getPendingPayments,
    getRecentInvoices
  } = useInvoiceStore();

  const { customers, loadCustomers } = useCustomerStore();

  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: '',
    customerId: 0,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    taxRate: 18,
    notes: '',
    status: 'pending'
  });

  // --- Customer Growth Chart (backend or local) ---
  // Local fallback: monthly new customers (last 6 months)
  const customerGrowthData = (() => {
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (Array.isArray(customers)) {
      customers.forEach(customer => {
        if (!customer.createdAt) return;
        const date = new Date(customer.createdAt);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });
    }
    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6);
  })();
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = String(invoices.length + 1).padStart(3, '0');
    return `INV-${year}${month}-${count}`;
  };

  const handleCustomerSelect = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setNewInvoice({
        ...newInvoice,
        customerId: customer.id!,
        customerName: customer.name,
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        customerAddress: customer.address || ''
      });
    }
  };

  const addInvoiceItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeInvoiceItem = (index: number) => {
    const newItems = newInvoice.items.filter((_, i) => i !== index);
    setNewInvoice({ ...newInvoice, items: newItems });
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...newInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate amount for this item
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    
    setNewInvoice({ ...newInvoice, items: newItems });
  };

  const calculateSubtotal = () => {
    return newInvoice.items.reduce((sum, item) => sum + item.amount, 0);
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
      invoiceNumber: newInvoice.invoiceNumber || generateInvoiceNumber(),
      customerId: newInvoice.customerId || undefined,
      customerName: newInvoice.customerName,
      customerEmail: newInvoice.customerEmail,
      customerPhone: newInvoice.customerPhone,
      customerAddress: newInvoice.customerAddress,
      issueDate: new Date(newInvoice.issueDate),
      dueDate: new Date(newInvoice.dueDate),
      items: newInvoice.items.filter(item => item.description.trim() !== ''),
      subtotal: calculateSubtotal(),
      taxRate: newInvoice.taxRate,
      taxAmount: calculateTaxAmount(),
      totalAmount: calculateTotal(),
      status: newInvoice.status as 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial',
      notes: newInvoice.notes
    };

    await addInvoice(invoiceData);
    
    // Reset form
    setNewInvoice({
      invoiceNumber: '',
      customerId: 0,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      taxRate: 18,
      notes: '',
      status: 'pending'
    });
    setIsCreatingInvoice(false);
  };

  // --- Backend analytics for overdue/pending KPIs ---
  const [apiOverdueRevenue, setApiOverdueRevenue] = useState<number | null>(null);
  const [apiPendingRevenue, setApiPendingRevenue] = useState<number | null>(null);

  useEffect(() => {
    const fetchKPIAnalytics = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          const overdueData = await apiGetAnalyticsOverdueRevenue(tenantId);
          const pendingData = await apiGetAnalyticsPendingRevenue(tenantId);
          setApiOverdueRevenue(overdueData.overdueRevenue || overdueData.overdue_revenue || null);
          setApiPendingRevenue(pendingData.pendingRevenue || pendingData.pending_revenue || null);
        }
      } catch (err) {
        // fallback: do nothing, use local
      }
    };
    fetchKPIAnalytics();
  }, []);

  const pendingPayments = apiPendingRevenue !== null
    ? apiPendingRevenue
    : getPendingPayments();

  const overduePayments = apiOverdueRevenue !== null
    ? apiOverdueRevenue
    : invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const recentInvoices = getRecentInvoices(5);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  // --- Backend analytics integration (branch performance) ---
  const [apiRevenueByBranch, setApiRevenueByBranch] = useState<any[]>([]);

  useEffect(() => {
    const fetchBranchAnalytics = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          const revenueData = await apiGetAnalyticsRevenueByBranch(tenantId);
          setApiRevenueByBranch(revenueData);
        }
      } catch (err) {
        // fallback: do nothing, use local
      }
    };
    fetchBranchAnalytics();
  }, []);

  // Branch performance: prefer backend, fallback to local
  const branchPerformance = apiRevenueByBranch && apiRevenueByBranch.length > 0
    ? apiRevenueByBranch.map((row: any) => ({
        name: row.branchName || row.name,
        totalRevenue: row.totalRevenue,
        invoiceCount: row.invoiceCount
      }))
    : (() => {
      // Group local invoices by branch
      const branchMap: { [key: string]: { name: string, totalRevenue: number, invoiceCount: number } } = {};
      invoices.filter(inv => inv.status === 'paid').forEach(inv => {
        // Use branchName if available, else branch_id, else Unknown
        let branch = 'Unknown';
  if ('branchName' in inv && inv.branchName) branch = String(inv.branchName);
        else if ('branch_id' in inv && inv.branch_id) branch = String(inv.branch_id);
        if (!branchMap[branch]) branchMap[branch] = { name: branch, totalRevenue: 0, invoiceCount: 0 };
        branchMap[branch].totalRevenue += inv.totalAmount;
        branchMap[branch].invoiceCount += 1;
      });
      return Object.values(branchMap);
    })();
  // ---
  const [apiMonthlyRevenue, setApiMonthlyRevenue] = useState<any[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          const monthlyData = await apiGetAnalyticsMonthlyRevenue(tenantId);
          setApiMonthlyRevenue(monthlyData);
        }
      } catch (err) {
        setAnalyticsError('Failed to load analytics from backend. Showing local data.');
      } finally {
        setIsAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Monthly revenue: prefer backend, fallback to local
  const monthlyRevenue = apiMonthlyRevenue && apiMonthlyRevenue.length > 0
    ? apiMonthlyRevenue.map((row: any) => [row.month, row.totalRevenue])
    : (() => {
      const monthlyData: { [key: string]: number } = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      invoices.filter(inv => inv.status === 'paid').forEach(invoice => {
        const date = new Date(invoice.issueDate);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + invoice.totalAmount;
      });
      return Object.entries(monthlyData)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .slice(-6);
    })();

  // --- UI ---
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
        <Button onClick={() => setIsCreatingInvoice(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Branch Performance (Bar Chart) */}
      <Card className="p-6 mb-8 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
        <h2 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2 tracking-tight">
          <BarChart3 className="h-6 w-6 text-indigo-500" />
          Branch Performance
        </h2>
        <div className="h-64 flex items-end gap-6 px-6">
          {branchPerformance.map((branch, index) => {
            const maxRevenue = Math.max(...branchPerformance.map(b => b.totalRevenue));
            const height = (branch.totalRevenue / maxRevenue) * 200;
            return (
              <div key={branch.name} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-gradient-to-t from-indigo-400 to-indigo-300 rounded-t-lg w-10 shadow-md hover:from-indigo-500 hover:to-indigo-400 transition-all"
                  style={{ height: `${height}px`, minHeight: '20px' }}
                  title={branch.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                ></div>
                <div className="mt-2 text-xs text-indigo-700 text-center font-medium">{branch.name}</div>
                <div className="text-xs font-bold text-indigo-900 text-center">
                  ₹{branch.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-indigo-500 text-center">{branch.invoiceCount} invoices</div>
              </div>
            );
          })}
        </div>
      </Card>
      {/* Monthly Revenue Trend (Line Chart) */}
      <Card className="p-6 mb-8 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2 tracking-tight">
          <LineChart className="h-6 w-6 text-blue-500" />
          Monthly Revenue Trend
        </h2>
        {isAnalyticsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-2 text-gray-500">Loading analytics...</p>
          </div>
        ) : (
          <div className="h-64 flex items-end gap-6 px-6">
            {monthlyRevenue.map(([month, revenue], index) => {
              const maxRevenue = Math.max(...monthlyRevenue.map(([, rev]) => rev));
              const height = (revenue / maxRevenue) * 200;
              return (
                <div key={month} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-gradient-to-t from-blue-400 to-blue-300 rounded-t-lg w-8 shadow-md hover:from-blue-500 hover:to-blue-400 transition-all"
                    style={{ height: `${height}px`, minHeight: '20px' }}
                    title={revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  ></div>
                  <div className="mt-2 text-xs text-blue-700 text-center font-medium">{month}</div>
                  <div className="text-xs font-bold text-blue-900 text-center">
                    ₹{revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{(apiRevenueByBranch && apiRevenueByBranch.length > 0
                ? apiRevenueByBranch.reduce((sum, b) => sum + (b.totalRevenue || 0), 0)
                : getTotalRevenue()
              ).toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">₹{pendingPayments.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No invoices found</p>
            <Button>
              Create First Invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{invoice.totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice Creation Modal */}
      {isCreatingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingInvoice(false)}
                  className="p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <Input
                    label="Invoice Number"
                    value={newInvoice.invoiceNumber}
                    onChange={(e) => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})}
                    placeholder={generateInvoiceNumber()}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer *
                    </label>
                    <select
                      value={newInvoice.customerId}
                      onChange={(e) => {
                        const customerId = parseInt(e.target.value);
                        if (customerId === 0) {
                          setNewInvoice({
                            ...newInvoice,
                            customerId: 0,
                            customerName: '',
                            customerEmail: '',
                            customerPhone: '',
                            customerAddress: ''
                          });
                        } else {
                          handleCustomerSelect(customerId);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value={0}>Select existing customer or enter manually</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Customer Name *"
                    value={newInvoice.customerName}
                    onChange={(e) => setNewInvoice({...newInvoice, customerName: e.target.value})}
                    placeholder="Enter customer name"
                  />

                  <Input
                    label="Customer Email"
                    type="email"
                    value={newInvoice.customerEmail}
                    onChange={(e) => setNewInvoice({...newInvoice, customerEmail: e.target.value})}
                    placeholder="customer@example.com"
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <Input
                    label="Customer Phone"
                    value={newInvoice.customerPhone}
                    onChange={(e) => setNewInvoice({...newInvoice, customerPhone: e.target.value})}
                    placeholder="+91 98765 43210"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Address
                    </label>
                    <textarea
                      value={newInvoice.customerAddress}
                      onChange={(e) => setNewInvoice({...newInvoice, customerAddress: e.target.value})}
                      placeholder="Customer address"
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Issue Date"
                      type="date"
                      value={newInvoice.issueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, issueDate: e.target.value})}
                    />
                    <Input
                      label="Due Date"
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
                  <Button onClick={addInvoiceItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <Input
                          label={index === 0 ? "Description" : ""}
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label={index === 0 ? "Qty" : ""}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label={index === 0 ? "Rate" : ""}
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateInvoiceItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label={index === 0 ? "Amount" : ""}
                          value={item.amount.toFixed(2)}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1">
                        {newInvoice.items.length > 1 && (
                          <Button
                            onClick={() => removeInvoiceItem(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tax ({newInvoice.taxRate}%):</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newInvoice.taxRate}
                            onChange={(e) => setNewInvoice({...newInvoice, taxRate: parseFloat(e.target.value) || 0})}
                            className="w-16 p-1 border border-gray-300 rounded text-center text-sm"
                          />
                          <span className="font-medium">₹{calculateTaxAmount().toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-lg">₹{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                    placeholder="Additional notes or terms..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setIsCreatingInvoice(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInvoice}>
                    Create Invoice
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
