import React, { useEffect, useState, useCallback } from 'react';
import { Package, Plus, AlertTriangle, TrendingUp, Search, Info, Trash2 } from 'lucide-react';
import { useInventoryStore, type InventoryItem } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const InventoryPage = () => {
  const {
    items,
    categories,
    isLoading,
    loadItems,
    loadCategories,
    createItem,
    deleteItem,
    adjustStock,
    searchItems,
    getLowStockItems,
    getOutOfStockItems,
    getInventoryStats,
    findSimilarItems
  } = useInventoryStore();

  // Get branch context for filtering
  const { selectedBranchId } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [similarItems, setSimilarItems] = useState<InventoryItem[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'remove' | 'adjust'>('add');
  const [stockData, setStockData] = useState({
    quantity: '',
    reason: '',
    cost: '',
    reference: ''
  });

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    sku: '',
    selling_price: '',
    cost_price: '',
    quantity: '',
    min_stock_level: '',
    tenant_id: '',
    branch_id: ''
  });

  // Debounced search for similar items as user types
  const searchSimilarItems = useCallback(async (name: string) => {
    if (name.trim().length >= 2) {
      const similar = await findSimilarItems(name);
      setSimilarItems(similar);
      setShowDuplicateWarning(similar.length > 0);
    } else {
      setSimilarItems([]);
      setShowDuplicateWarning(false);
    }
  }, [findSimilarItems]);

  // Handle name change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showCreateForm && newItem.name) {
        searchSimilarItems(newItem.name);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newItem.name, showCreateForm, searchSimilarItems]);

  useEffect(() => {
    loadItems();
    loadCategories();
    loadStats();
  }, [loadItems, loadCategories, selectedBranchId]); // Reload when branch changes

  const loadStats = async () => {
    try {
      const inventoryStats = await getInventoryStats();
      setStats(inventoryStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filteredItems = searchQuery
    ? searchItems(searchQuery)
    : selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createItem({
        name: newItem.name,
        category: newItem.category,
        sku: newItem.sku,
        selling_price: parseFloat(newItem.selling_price),
        cost_price: parseFloat(newItem.cost_price),
        quantity: parseInt(newItem.quantity),
        min_stock_level: parseInt(newItem.min_stock_level),
        tenant_id: newItem.tenant_id,
        branch_id: newItem.branch_id
      });
      
      setShowCreateForm(false);
      resetNewItem();
      loadStats();
    } catch (error: any) {
      console.error('Failed to create item:', error);
      setFormError(error?.message || 'Failed to create item. Please try again.');
    }
  };

  const resetNewItem = () => {
    setNewItem({
      name: '',
      category: '',
      sku: '',
      selling_price: '',
      cost_price: '',
      quantity: '',
      min_stock_level: '',
      tenant_id: '',
      branch_id: ''
    });
    setSimilarItems([]);
    setShowDuplicateWarning(false);
    setFormError(null);
  };

  const handleStockAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const quantity = parseInt(stockData.quantity);
      let quantityChange = quantity;
      
      // For remove, make quantity negative
      if (stockAction === 'remove') {
        quantityChange = -quantity;
      }
      
      await adjustStock(
        selectedItem.id,
        quantityChange,
        stockData.reason || `${stockAction} stock`
      );
      
      setShowStockModal(false);
      setSelectedItem(null);
      setStockData({ quantity: '', reason: '', cost: '', reference: '' });
      loadStats();
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.id);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      loadStats();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (item.quantity <= item.min_stock_level) return { label: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your inventory</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{stats.total_items || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">₹{(stats.total_value || 0).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stats.low_stock_count || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_count || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800 font-medium">Inventory Alerts</span>
          </div>
          <div className="text-sm text-orange-700">
            {outOfStockItems.length > 0 && (
              <p>{outOfStockItems.length} item(s) are out of stock</p>
            )}
            {lowStockItems.length > 0 && (
              <p>{lowStockItems.length} item(s) are running low</p>
            )}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Items Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map(item => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.sku && (
                          <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.quantity} units
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.min_stock_level} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.selling_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowStockModal(true);
                        }}
                      >
                        Manage Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setItemToDelete(item);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items found matching your criteria
            </div>
          )}
        </div>
      </Card>

      {/* Create Item Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Item</h2>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {formError}
                </div>
              )}
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Item name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="SKU (optional, must be unique)"
                      value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">SKU must be unique if provided</p>
                  </div>
                </div>

                {/* Similar Items Warning */}
                {showDuplicateWarning && similarItems.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">Similar items found</p>
                        <p className="text-xs text-yellow-700 mb-2">
                          These items have similar names. You can still add a new item if needed.
                        </p>
                        <div className="space-y-1">
                          {similarItems.map((item) => (
                            <div key={item.id} className="text-xs bg-yellow-100 px-2 py-1 rounded flex justify-between">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-yellow-600">
                                {item.sku && `SKU: ${item.sku} · `}
                                Stock: {item.quantity} units
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="SKU"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Selling Price"
                    value={newItem.selling_price}
                    onChange={(e) => setNewItem({ ...newItem, selling_price: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Cost Price"
                    value={newItem.cost_price}
                    onChange={(e) => setNewItem({ ...newItem, cost_price: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Initial Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Min Stock Level"
                    value={newItem.min_stock_level}
                    onChange={(e) => setNewItem({ ...newItem, min_stock_level: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">Add Item</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetNewItem();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              Manage Stock: {selectedItem.name}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Current Stock: {selectedItem.quantity} units
            </p>
            
            <form onSubmit={handleStockAction} className="space-y-4">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setStockAction('add')}
                  className={`px-3 py-2 rounded text-sm ${stockAction === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockAction('remove')}
                  className={`px-3 py-2 rounded text-sm ${stockAction === 'remove' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Remove Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockAction('adjust')}
                  className={`px-3 py-2 rounded text-sm ${stockAction === 'adjust' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Adjust Stock
                </button>
              </div>
              
              <Input
                type="number"
                placeholder={stockAction === 'adjust' ? 'New stock quantity' : 'Quantity'}
                value={stockData.quantity}
                onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                required
              />
              
              <Input
                placeholder="Reason"
                value={stockData.reason}
                onChange={(e) => setStockData({ ...stockData, reason: e.target.value })}
                required
              />
              
              {stockAction === 'add' && (
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Cost per unit (optional)"
                  value={stockData.cost}
                  onChange={(e) => setStockData({ ...stockData, cost: e.target.value })}
                />
              )}
              
              {stockAction === 'remove' && (
                <Input
                  placeholder="Reference (invoice, order, etc.)"
                  value={stockData.reference}
                  onChange={(e) => setStockData({ ...stockData, reference: e.target.value })}
                />
              )}
              
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  {stockAction === 'add' ? 'Add Stock' : stockAction === 'remove' ? 'Remove Stock' : 'Adjust Stock'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStockModal(false);
                    setSelectedItem(null);
                    setStockData({ quantity: '', reason: '', cost: '', reference: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-bold">Delete Item</h2>
            </div>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <strong>{itemToDelete.name}</strong>?
            </p>
            {itemToDelete.sku && (
              <p className="text-sm text-gray-500 mb-2">SKU: {itemToDelete.sku}</p>
            )}
            <p className="text-sm text-gray-500 mb-4">
              Current Stock: {itemToDelete.quantity} units
            </p>
            <p className="text-sm text-orange-600 mb-4">
              This item will be marked as inactive and removed from the list.
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={handleDeleteItem}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
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
