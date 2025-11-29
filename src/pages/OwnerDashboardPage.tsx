import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface BranchStats {
  branchId: string;
  branchName: string;
  branchType: string;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  invoiceCount: number;
  customerCount: number;
  avgInvoiceValue: number;
}

interface DashboardData {
  branches: BranchStats[];
  totals: {
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    overdueRevenue: number;
    totalInvoices: number;
    totalCustomers: number;
  };
}

export const OwnerDashboardPage: React.FC = () => {
  const { branches, selectedBranchId, getToken, getTenantId, isOwner } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedBranchId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      const tenantId = getTenantId();

      if (!token || !tenantId) {
        throw new Error('Not authenticated');
      }

      // Fetch dashboard data from backend
      const response = await fetch(`/api/analytics/dashboard/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard');
      
      // Generate mock data for demo
      setDashboardData(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = (): DashboardData => {
    // If no branches available, create a default branch for demo
    const branchList = branches.length > 0 ? branches : [
      { id: 'default', name: 'My Branch', type: 'retail' }
    ];
    
    const branchStats: BranchStats[] = branchList.map((branch, index) => ({
      branchId: branch.id,
      branchName: branch.name,
      branchType: branch.type || 'retail',
      totalRevenue: 50000 + Math.random() * 100000,
      paidRevenue: 40000 + Math.random() * 60000,
      pendingRevenue: 5000 + Math.random() * 20000,
      overdueRevenue: 1000 + Math.random() * 10000,
      invoiceCount: 50 + Math.floor(Math.random() * 150),
      customerCount: 20 + Math.floor(Math.random() * 80),
      avgInvoiceValue: 500 + Math.random() * 1000
    }));

    const totals = branchStats.reduce((acc, branch) => ({
      totalRevenue: acc.totalRevenue + branch.totalRevenue,
      paidRevenue: acc.paidRevenue + branch.paidRevenue,
      pendingRevenue: acc.pendingRevenue + branch.pendingRevenue,
      overdueRevenue: acc.overdueRevenue + branch.overdueRevenue,
      totalInvoices: acc.totalInvoices + branch.invoiceCount,
      totalCustomers: acc.totalCustomers + branch.customerCount
    }), {
      totalRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      overdueRevenue: 0,
      totalInvoices: 0,
      totalCustomers: 0
    });

    return { branches: branchStats, totals };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Show viewing mode based on selected branch
  const isViewingAllBranches = selectedBranchId === 'all' || !selectedBranchId;
  const viewingBranch = branches.find(b => b.id === selectedBranchId);

  // Filter data based on selected branch
  const displayData = dashboardData ? (
    isViewingAllBranches 
      ? dashboardData 
      : {
          branches: dashboardData.branches.filter(b => b.branchId === selectedBranchId),
          totals: dashboardData.branches
            .filter(b => b.branchId === selectedBranchId)
            .reduce((acc, branch) => ({
              totalRevenue: branch.totalRevenue,
              paidRevenue: branch.paidRevenue,
              pendingRevenue: branch.pendingRevenue,
              overdueRevenue: branch.overdueRevenue,
              totalInvoices: branch.invoiceCount,
              totalCustomers: branch.customerCount
            }), {
              totalRevenue: 0,
              paidRevenue: 0,
              pendingRevenue: 0,
              overdueRevenue: 0,
              totalInvoices: 0,
              totalCustomers: 0
            })
        }
  ) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isOwner() ? 'Owner Dashboard' : 'Branch Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isViewingAllBranches 
              ? `Viewing all ${branches.length} branches` 
              : `Viewing: ${viewingBranch?.name || 'Selected Branch'}`}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {error} - Showing demo data
        </div>
      )}

      {displayData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(displayData.totals.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {getPercentage(displayData.totals.paidRevenue, displayData.totals.totalRevenue)}% collected
                </span>
              </div>
            </Card>

            {/* Total Invoices */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(displayData.totals.totalInvoices)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Across {isViewingAllBranches ? branches.length : 1} branch{isViewingAllBranches && branches.length !== 1 ? 'es' : ''}
              </div>
            </Card>

            {/* Total Customers */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatNumber(displayData.totals.totalCustomers)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Active customers
              </div>
            </Card>

            {/* Overdue Amount */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Overdue Amount</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(displayData.totals.overdueRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <Clock className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-600 font-medium">
                  {getPercentage(displayData.totals.overdueRevenue, displayData.totals.totalRevenue)}% of total
                </span>
              </div>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(displayData.totals.paidRevenue)}
                </p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(displayData.totals.pendingRevenue)}
                </p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(displayData.totals.overdueRevenue)}
                </p>
              </div>
            </Card>
          </div>

          {/* Branch Comparison (only when viewing all branches) */}
          {isViewingAllBranches && displayData.branches.length > 1 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Branch Performance Comparison</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Branch</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Invoices</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Customers</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Avg. Invoice</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Collection %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.branches
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .map((branch, index) => (
                        <tr 
                          key={branch.branchId} 
                          className={`border-b border-gray-100 hover:bg-gray-50 ${index === 0 ? 'bg-green-50' : ''}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                index === 0 ? 'bg-green-500' : 'bg-blue-100'
                              }`}>
                                <Building2 className={`h-4 w-4 ${index === 0 ? 'text-white' : 'text-blue-600'}`} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{branch.branchName}</p>
                                <p className="text-xs text-gray-500 capitalize">{branch.branchType}</p>
                              </div>
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Top
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-gray-900">
                            {formatCurrency(branch.totalRevenue)}
                          </td>
                          <td className="py-4 px-4 text-right text-gray-600">
                            {formatNumber(branch.invoiceCount)}
                          </td>
                          <td className="py-4 px-4 text-right text-gray-600">
                            {formatNumber(branch.customerCount)}
                          </td>
                          <td className="py-4 px-4 text-right text-gray-600">
                            {formatCurrency(branch.avgInvoiceValue)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                              getPercentage(branch.paidRevenue, branch.totalRevenue) >= 80
                                ? 'bg-green-100 text-green-700'
                                : getPercentage(branch.paidRevenue, branch.totalRevenue) >= 60
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {getPercentage(branch.paidRevenue, branch.totalRevenue)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Revenue Distribution Bar */}
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Revenue Distribution</p>
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                  {displayData.branches
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((branch, index) => {
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                      const percentage = getPercentage(branch.totalRevenue, displayData.totals.totalRevenue);
                      return (
                        <div
                          key={branch.branchId}
                          className={`${colors[index % colors.length]} transition-all`}
                          style={{ width: `${percentage}%` }}
                          title={`${branch.branchName}: ${percentage}%`}
                        />
                      );
                    })}
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {displayData.branches
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map((branch, index) => {
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                      return (
                        <div key={branch.branchId} className="flex items-center gap-2 text-sm">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                          <span className="text-gray-600">{branch.branchName}</span>
                          <span className="text-gray-400">
                            ({getPercentage(branch.totalRevenue, displayData.totals.totalRevenue)}%)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/analytics"
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">View Detailed Analytics</span>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </a>
              
              <a
                href="/enhanced-billing"
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Create Invoice</span>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600" />
              </a>
              
              <a
                href="/customers"
                className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Manage Customers</span>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-600" />
              </a>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default OwnerDashboardPage;
