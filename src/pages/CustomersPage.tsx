import { useState, useEffect } from 'react';
import { useCustomerStore } from '../store/useCustomerStore';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Tag,
  Eye,
  UserPlus,
  Filter,
  LineChart
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { 
    customers, 
    isLoading, 
    loadCustomers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer,
    getTopCustomers 
  } = useCustomerStore();

  // Get branch context for filtering
  const { selectedBranchId } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    tags: [] as string[],
    type: 'regular' as 'regular' | 'vip' | 'wholesale' | 'retail',
    status: 'active' as const
  });

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers, selectedBranchId]); // Reload when branch changes

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    
    try {
      await addCustomer({
        ...newCustomer,
        averageOrderValue: 0
      });
      // Store already calls loadCustomers() after adding
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        tags: [],
        type: 'regular',
        status: 'active'
      });
      setIsAddingCustomer(false);
    } catch (error) {
      console.error('Failed to add customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  const handleEditCustomer = async (id: number) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      try {
        await updateCustomer(id, { ...customer, updatedAt: new Date() });
        // Store already calls loadCustomers() after updating
        setEditingCustomer(null);
      } catch (error) {
        console.error('Failed to update customer:', error);
        alert('Failed to update customer. Please try again.');
      }
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        // Store already calls loadCustomers() after deleting
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm);
    
    const matchesTag = selectedTag === 'all' || 
                      (customer.tags && customer.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));
  const topCustomers = getTopCustomers(5);
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'N/A';
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      return 'N/A';
    }
  };

  // Placeholder for backend-driven customer growth data
  const customerGrowthData: [string, number][] = [
    ['Jun 2025', 120],
    ['Jul 2025', 140],
    ['Aug 2025', 180],
    ['Sep 2025', 210],
    ['Oct 2025', 250],
    ['Nov 2025', 300],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage your customer relationships and track interactions</p>
        </div>
        <Button 
          onClick={() => setIsAddingCustomer(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
            </div>
            <UserPlus className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalCustomers > 0 ? totalRevenue / totalCustomers : 0)}
              </p>
            </div>
            <ShoppingBag className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Customer Growth (Line Chart) */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Customer Growth
        </h2>
        <div className="h-64 flex items-end gap-4 px-4">
          {customerGrowthData.map(([month, count], index) => {
            const maxCount = Math.max(...customerGrowthData.map(([, c]) => c));
            const height = (count / maxCount) * 200;
            return (
              <div key={month} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-green-500 rounded-t-md w-6 transition-all hover:bg-green-600"
                  style={{ height: `${height}px`, minHeight: '20px' }}
                  title={count.toString()}
                />
                <div className="mt-2 text-xs text-gray-600 text-center">{month}</div>
                <div className="text-xs font-medium text-gray-900 text-center">{count}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Customer List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          All Customers ({filteredCustomers.length})
        </h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || selectedTag !== 'all' ? 'No customers match your search criteria' : 'No customers yet. Add your first customer!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.address}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDate(customer.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(customer.totalSpent)}
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <ShoppingBag className="h-3 w-3" />
                        {customer.totalOrders} orders
                      </div>
                      {customer.lastOrderDate && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Last order: {formatDate(customer.lastOrderDate)}
                        </div>
                      )}
                    </div>

                    {customer.tags && customer.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {customer.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingCustomer(customer.id!)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCustomer(customer.id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      {isAddingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
            <div className="space-y-4">
              <Input
                label="Name *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                placeholder="Enter customer name"
              />
              <Input
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                placeholder="Enter email address"
              />
              <Input
                label="Phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                placeholder="Enter phone number"
              />
              <Input
                label="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                placeholder="Enter address"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <Input
                  value={newCustomer.tags.join(', ')}
                  onChange={(e) => setNewCustomer({
                    ...newCustomer, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="Enter tags separated by commas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                  placeholder="Additional notes about the customer"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleAddCustomer}
                className="flex-1"
                disabled={!newCustomer.name.trim()}
              >
                Add Customer
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingCustomer(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
