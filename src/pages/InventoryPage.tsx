import React, { useEffect, useState } from 'react';
import { Package, Plus, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { InventoryItem } from '../lib/database';

export const InventoryPage = () => {
  const {
    items,
    categories,
    isLoading,
    loadItems,
    loadCategories,
    createItem,
    addStock,
    removeStock,
    adjustStock,
    searchItems,
    getLowStockItems,
    getOutOfStockItems,
    getInventoryStats
  } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [stockAction, setStockAction] = useState<'add' | 'remove' | 'adjust'>('add');
  const [stockData, setStockData] = useState({
    quantity: '',
    reason: '',
    cost: '',
    reference: ''
  });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    price: '',
    cost: '',
    currentStock: '',
    minStockLevel: '',
    maxStockLevel: '',
    unit: 'piece',
    supplier: '',
    supplierContact: '',
    tags: ''
  });

  useEffect(() => {
    loadItems();
    loadCategories();
    loadStats();
  }, [loadItems, loadCategories]);

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
    try {
      await createItem({
        name: newItem.name,
        description: newItem.description || undefined,
        category: newItem.category,
        sku: newItem.sku || undefined,
        price: parseFloat(newItem.price),
        cost: newItem.cost ? parseFloat(newItem.cost) : undefined,
        currentStock: parseInt(newItem.currentStock),
        minStockLevel: parseInt(newItem.minStockLevel),
        maxStockLevel: newItem.maxStockLevel ? parseInt(newItem.maxStockLevel) : undefined,
        unit: newItem.unit,
        supplier: newItem.supplier || undefined,
        supplierContact: newItem.supplierContact || undefined,
        isActive: true,
        tags: newItem.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      
      setShowCreateForm(false);
      resetNewItem();
      loadStats();
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const resetNewItem = () => {
    setNewItem({
      name: '',
      description: '',
      category: '',
      sku: '',
      price: '',
      cost: '',
      currentStock: '',
      minStockLevel: '',
      maxStockLevel: '',
      unit: 'piece',
      supplier: '',
      supplierContact: '',
      tags: ''
    });
  };

  const handleStockAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const quantity = parseInt(stockData.quantity);
      
      switch (stockAction) {
        case 'add':
          await addStock(
            selectedItem.id!,
            quantity,
            stockData.reason,
            stockData.cost ? parseFloat(stockData.cost) : undefined
          );
          break;
        case 'remove':
          await removeStock(
            selectedItem.id!,
            quantity,
            stockData.reason,
            stockData.reference || undefined
          );
          break;
        case 'adjust':
          await adjustStock(
            selectedItem.id!,
            quantity,
            stockData.reason
          );
          break;
      }
      
      setShowStockModal(false);
      setSelectedItem(null);
      setStockData({ quantity: '', reason: '', cost: '', reference: '' });
      loadStats();
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (item.currentStock <= item.minStockLevel) return { label: 'Low Stock', color: 'text-orange-600 bg-orange-50' };
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
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
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
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minStockLevel} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.price.toLocaleString()}
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
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Item</h2>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="SKU (optional)"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  />
                </div>
                
                <textarea
                  placeholder="Description (optional)"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="Category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    type="number"
                    placeholder="Current Stock"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Min Stock Level"
                    value={newItem.minStockLevel}
                    onChange={(e) => setNewItem({ ...newItem, minStockLevel: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Max Stock Level"
                    value={newItem.maxStockLevel}
                    onChange={(e) => setNewItem({ ...newItem, maxStockLevel: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Supplier (optional)"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newItem.tags}
                    onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
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
              Current Stock: {selectedItem.currentStock} {selectedItem.unit}
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
    </div>
  );
};
