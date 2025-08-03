import { useState, useEffect } from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useFeedbackStore } from '../store/useFeedbackStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  BarChart3, 
  TrendingUp, 
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
  Clock
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { invoices, loadInvoices } = useInvoiceStore();
  const { customers, loadCustomers, getTopCustomers } = useCustomerStore();
  const { feedback, loadFeedback, getAverageRating } = useFeedbackStore();
  
  const [timeRange, setTimeRange] = useState<string>('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadInvoices(),
        loadCustomers(),
        loadFeedback()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [loadInvoices, loadCustomers, loadFeedback]);

  // Calculate analytics
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const overdueRevenue = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

  const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / paidInvoices : 0;
  const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  const topCustomers = getTopCustomers(5);
  const averageFeedbackRating = getAverageRating();

  // Monthly revenue calculation
  const getMonthlyRevenue = () => {
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    invoices.filter(inv => inv.status === 'paid').forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + invoice.totalAmount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6); // Last 6 months
  };

  const monthlyRevenue = getMonthlyRevenue();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-500 mt-1">
                +12% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Revenue</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {pendingInvoices} invoices pending
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
              <p className="text-xs text-blue-500 mt-1">
                +{customers.filter(c => c.status === 'active').length} active
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payment Rate</p>
              <p className="text-2xl font-bold text-purple-600">{paymentRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {paidInvoices}/{totalInvoices} invoices paid
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Revenue Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Breakdown
          </h2>
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
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
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
              <span className="font-semibold text-green-600">+12.5%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Monthly Revenue Trend
        </h2>
        <div className="h-64 flex items-end gap-4 px-4">
          {monthlyRevenue.map(([month, revenue], index) => {
            const maxRevenue = Math.max(...monthlyRevenue.map(([, rev]) => rev));
            const height = (revenue / maxRevenue) * 200;
            
            return (
              <div key={month} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-blue-500 rounded-t-md w-full transition-all hover:bg-blue-600"
                  style={{ height: `${height}px`, minHeight: '20px' }}
                  title={formatCurrency(revenue)}
                ></div>
                <div className="mt-2 text-xs text-gray-600 text-center">{month}</div>
                <div className="text-xs font-medium text-gray-900 text-center">
                  {formatCurrency(revenue)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Customers & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers
          </h2>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.status === 'paid' ? 'bg-green-100 text-green-800' :
                    activity.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {activity.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Items */}
      {(overdueInvoices > 0 || pendingInvoices > 0) && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Action Required
          </h2>
          <div className="space-y-3">
            {overdueInvoices > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                <div>
                  <p className="font-medium text-red-900">Overdue Invoices</p>
                  <p className="text-sm text-red-600">
                    {overdueInvoices} invoices totaling {formatCurrency(overdueRevenue)} are overdue
                  </p>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  Send Reminders
                </Button>
              </div>
            )}
            {pendingInvoices > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                <div>
                  <p className="font-medium text-orange-900">Pending Payments</p>
                  <p className="text-sm text-orange-600">
                    {pendingInvoices} invoices totaling {formatCurrency(pendingRevenue)} are pending
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Follow Up
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
