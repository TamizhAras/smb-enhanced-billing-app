import { useState, useEffect, useMemo } from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useFeedbackStore } from '../store/useFeedbackStore';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
  Calendar,
  Star,
  Download,
  RefreshCw,
  Target,
  ShoppingBag,
  Clock,
  BarChartHorizontal,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  PieChart,
  Activity,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Wallet,
  Filter,
  Zap
} from 'lucide-react';
import {
  apiGetAnalyticsRevenueByBranch,
  apiGetAnalyticsTotalInvoices,
  apiGetAnalyticsCustomerCount,
  apiGetAnalyticsOverdueRevenue,
  apiGetAnalyticsPendingRevenue,
  apiGetAnalyticsMonthlyRevenue
} from '../lib/apiService';


export const AnalyticsPage: React.FC = () => {
  const { invoices, loadInvoices } = useInvoiceStore();
  const { customers, loadCustomers, getTopCustomers } = useCustomerStore();
  const { feedback, loadFeedback, getAverageRating } = useFeedbackStore();
  
  // Get branch context for filtering
  const { selectedBranchId } = useAuthStore();

  const [timeRange, setTimeRange] = useState<string>('30');
  const [isLoading, setIsLoading] = useState(true);
  const [apiRevenueByBranch, setApiRevenueByBranch] = useState<any[]>([]);
  const [apiTotalInvoices, setApiTotalInvoices] = useState<number | null>(null);
  const [apiCustomerCount, setApiCustomerCount] = useState<number | null>(null);
  const [apiOverdueRevenue, setApiOverdueRevenue] = useState<number | null>(null);
  const [apiPendingRevenue, setApiPendingRevenue] = useState<number | null>(null);
  const [apiMonthlyRevenue, setApiMonthlyRevenue] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        // Load local data for fallback
        await Promise.all([
          loadInvoices(),
          loadCustomers(),
          loadFeedback()
        ]);

        // Try backend analytics API
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          const [revenueData, totalInvoicesData, customerCountData, overdueData, pendingData, monthlyData] = await Promise.all([
            apiGetAnalyticsRevenueByBranch(tenantId),
            apiGetAnalyticsTotalInvoices(tenantId),
            apiGetAnalyticsCustomerCount(tenantId),
            apiGetAnalyticsOverdueRevenue(tenantId),
            apiGetAnalyticsPendingRevenue(tenantId),
            apiGetAnalyticsMonthlyRevenue(tenantId)
          ]);
          setApiRevenueByBranch(revenueData);
          setApiTotalInvoices(totalInvoicesData.totalInvoices || totalInvoicesData.total_invoices || null);
          setApiCustomerCount(customerCountData.customerCount || customerCountData.customer_count || null);
          setApiOverdueRevenue(overdueData.overdueRevenue || overdueData.overdue_revenue || null);
          setApiPendingRevenue(pendingData.pendingRevenue || pendingData.pending_revenue || null);
          setApiMonthlyRevenue(monthlyData);
        }
      } catch (err: any) {
        setApiError('Failed to load analytics from backend. Showing local data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadInvoices, loadCustomers, loadFeedback, selectedBranchId]);


  // Calculate analytics (fallback to local if API not available)

  const totalRevenue = apiRevenueByBranch && apiRevenueByBranch.length > 0
    ? apiRevenueByBranch.reduce((sum, b) => sum + (b.totalRevenue || 0), 0)
    : invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0);

  const pendingRevenue = apiPendingRevenue !== null
    ? apiPendingRevenue
    : invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.totalAmount, 0);

  const overdueRevenue = apiOverdueRevenue !== null
    ? apiOverdueRevenue
    : invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalInvoices = apiTotalInvoices !== null
    ? apiTotalInvoices
    : invoices.length;

  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  const customerCount = apiCustomerCount !== null
    ? apiCustomerCount
    : customers.length;

  const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / paidInvoices : 0;
  const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  const topCustomers = getTopCustomers(5);
  const averageFeedbackRating = getAverageRating();


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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Check if dateObj is valid before calling getTime()
      if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '-';
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.warn('Invalid date:', date, error);
      return '-';
    }
  };

  const getRecentActivity = () => {
    const recentInvoices = invoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    return recentInvoices.map(invoice => ({
      type: 'invoice',
      title: `Invoice ${invoice.invoiceNumber}`,
      subtitle: `${invoice.customerName} - ${formatCurrency(invoice.totalAmount)}`,
      date: invoice.createdAt,
      status: invoice.status
    }));
  };

  const recentActivity = getRecentActivity();

  // Calculate metrics for insights
  const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;
  const avgTimeToPayment = 7; // Mock - would calculate from actual data
  const growthPercentage = 12.5; // Mock - would calculate from historical data
  const isGrowthPositive = growthPercentage >= 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        {/* Skeleton Header */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
        
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-80 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-full bg-gray-100 rounded-lg"></div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-80 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-full bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Business Analytics
            </h1>
            <p className="text-gray-500 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Real-time insights into your business performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Range Selector with Icons */}
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-200">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <Button variant="outline" className="flex items-center gap-2 rounded-xl shadow-sm border-gray-200 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-200">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full -translate-y-8 translate-x-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-200">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3" />
                +{growthPercentage}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
        </div>
        
        {/* Pending Revenue Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-50 rounded-full -translate-y-8 translate-x-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-200">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                {pendingInvoices} pending
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(pendingRevenue)}</p>
            <p className="text-sm text-gray-500">Pending Revenue</p>
          </div>
        </div>
        
        {/* Total Customers Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full -translate-y-8 translate-x-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Activity className="h-3 w-3" />
                Active
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{customerCount}</p>
            <p className="text-sm text-gray-500">Total Customers</p>
          </div>
        </div>

        {/* Total Invoices Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-50 rounded-full -translate-y-8 translate-x-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                {paidInvoices} paid
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{totalInvoices}</p>
            <p className="text-sm text-gray-500">Total Invoices</p>
          </div>
        </div>

        {/* Overdue Revenue Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100 to-rose-50 rounded-full -translate-y-8 translate-x-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-200">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              {overdueInvoices > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full animate-pulse">
                  {overdueInvoices} overdue
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(overdueRevenue)}</p>
            <p className="text-sm text-gray-500">Overdue Revenue</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-lg font-bold text-gray-900">{collectionRate}%</p>
              <p className="text-xs text-gray-500">Collection Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-lg font-bold text-gray-900">{avgTimeToPayment} days</p>
              <p className="text-xs text-gray-500">Avg Payment Time</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <Wallet className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(averageInvoiceValue)}</p>
              <p className="text-xs text-gray-500">Avg Invoice Value</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl">
            <Star className="h-8 w-8 text-yellow-500 fill-current" />
            <div>
              <p className="text-lg font-bold text-gray-900">{averageFeedbackRating.toFixed(1)}/5</p>
              <p className="text-xs text-gray-500">Customer Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
            Revenue Breakdown
          </h2>
          {apiError && (
            <div className="mb-2 text-sm text-red-500">{apiError}</div>
          )}
          {apiRevenueByBranch && apiRevenueByBranch.length > 0 ? (
            <div className="space-y-4">
              {apiRevenueByBranch.map((branch: any) => (
                <div key={branch.branchId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-blue-900">{branch.branchName || branch.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-900">{formatCurrency(branch.totalRevenue)}</p>
                    <p className="text-sm text-blue-600">{branch.invoiceCount} invoices</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-900">Paid Invoices</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-900">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm text-green-600">{paidInvoices} invoices</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-medium text-orange-900">Pending Payments</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-900">{formatCurrency(pendingRevenue)}</p>
                  <p className="text-sm text-orange-600">{pendingInvoices} invoices</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-900">Overdue Payments</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-900">{formatCurrency(overdueRevenue)}</p>
                  <p className="text-sm text-red-600">{overdueInvoices} invoices</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            Key Performance Indicators
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Invoice Value</span>
              <span className="font-semibold text-gray-900">{formatCurrency(averageInvoiceValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Customer Satisfaction</span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-semibold text-gray-900">{averageFeedbackRating.toFixed(1)}/5</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Feedback Received</span>
              <span className="font-semibold text-gray-900">{feedback.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Revenue Growth</span>
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span className="font-semibold">+{growthPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend (Line Chart) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <LineChart className="h-5 w-5 text-indigo-600" />
          </div>
          Monthly Revenue Trend
          <span className="ml-auto text-xs font-normal text-gray-400">Last 6 months</span>
        </h2>
        <div className="h-64 flex items-end gap-4 px-4">
          {monthlyRevenue.map(([month, revenue], index) => {
            const maxRevenue = Math.max(...monthlyRevenue.map(([, rev]) => rev));
            const height = (revenue / maxRevenue) * 200;
            return (
              <div key={month} className="flex-1 flex flex-col items-center group">
                <div
                  className="bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-lg w-8 transition-all duration-300 hover:from-indigo-700 hover:to-blue-500 cursor-pointer relative"
                  style={{ height: `${height}px`, minHeight: '20px' }}
                  title={formatCurrency(revenue)}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(revenue)}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 font-medium text-center">{month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Branch Performance (Bar Chart) */}
      {apiRevenueByBranch && apiRevenueByBranch.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <BarChartHorizontal className="h-5 w-5 text-cyan-600" />
            </div>
            Branch Performance
            <span className="ml-auto text-xs font-normal text-gray-400">By revenue</span>
          </h2>
          <div className="h-64 flex flex-col gap-3 justify-center">
            {apiRevenueByBranch
              .slice()
              .sort((a, b) => b.totalRevenue - a.totalRevenue)
              .map((branch: any, idx: number) => {
                const maxRevenue = Math.max(...apiRevenueByBranch.map((b: any) => b.totalRevenue));
                const width = (branch.totalRevenue / maxRevenue) * 85;
                return (
                  <div key={branch.branchId || branch.branch_id || idx} className="flex items-center gap-3 group">
                    <span className="w-28 truncate text-sm text-gray-600 font-medium">{branch.branchName || branch.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500 group-hover:from-cyan-600 group-hover:to-blue-600"
                        style={{ width: `${width}%`, minWidth: '10%' }}
                      ></div>
                    </div>
                    <span className="w-24 text-sm font-semibold text-gray-700 text-right">{formatCurrency(branch.totalRevenue)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Customer Growth (Line Chart Placeholder) */}
      {/* For real backend-driven customer growth, fetch and plot monthly customer counts */}
      {/* <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Customer Growth
        </h2>
        <div className="h-64 flex items-end gap-4 px-4">
          {customerGrowthData.map(([month, count], index) => (
            <div key={month} className="flex-1 flex flex-col items-center">
              <div
                className="bg-green-500 rounded-t-md w-6 transition-all hover:bg-green-600"
                style={{ height: `${(count / maxCount) * 200}px`, minHeight: '20px' }}
                title={count}
              ></div>
              <div className="mt-2 text-xs text-gray-600 text-center">{month}</div>
              <div className="text-xs font-medium text-gray-900 text-center">{count}</div>
            </div>
          ))}
        </div>
      </Card> */}

      {/* Top Customers & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            Top Customers
            <span className="ml-auto text-xs font-normal text-gray-400 flex items-center gap-1">
              <Eye className="h-3 w-3" /> By spend
            </span>
          </h2>
          {topCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Users className="h-12 w-12 mb-2" />
              <p className="text-sm">No customers yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.totalOrders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Activity className="h-5 w-5 text-violet-600" />
            </div>
            Recent Activity
            <span className="ml-auto text-xs font-normal text-gray-400">Last 5 invoices</span>
          </h2>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Activity className="h-12 w-12 mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-violet-700 transition-colors">{activity.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">{activity.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                      activity.status === 'paid' ? 'bg-green-100 text-green-700' :
                      activity.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      activity.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {activity.status === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                      {activity.status === 'overdue' && <XCircle className="h-3 w-3" />}
                      {activity.status === 'draft' && <FileText className="h-3 w-3" />}
                      {activity.status}
                    </span>
                    <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Items */}
      {(overdueInvoices > 0 || pendingInvoices > 0) && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg animate-pulse">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            Action Required
            <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
              {overdueInvoices + pendingInvoices}
            </span>
          </h2>
          <div className="space-y-3">
            {overdueInvoices > 0 && (
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">Overdue Invoices</p>
                    <p className="text-sm text-red-600">
                      {overdueInvoices} invoice{overdueInvoices > 1 ? 's' : ''} totaling <span className="font-bold">{formatCurrency(overdueRevenue)}</span>
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-200 rounded-xl flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Send Reminders
                </Button>
              </div>
            )}
            {pendingInvoices > 0 && (
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">Pending Payments</p>
                    <p className="text-sm text-amber-600">
                      {pendingInvoices} invoice{pendingInvoices > 1 ? 's' : ''} totaling <span className="font-bold">{formatCurrency(pendingRevenue)}</span>
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  Follow Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
