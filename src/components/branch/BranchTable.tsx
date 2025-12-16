import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Pencil, Trash2, Search, AlertCircle, Loader, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  type?: string;
  address?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

interface BranchTableProps {
  branches: Branch[];
  isLoading: boolean;
  onBranchUpdated: () => void;
  onBranchDeleted: () => void;
}

export const BranchTable: React.FC<BranchTableProps> = React.memo(({
  branches,
  isLoading,
  onBranchUpdated,
  onBranchDeleted
}) => {
  const { getToken } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', type: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Batch operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchOperating, setBatchOperating] = useState(false);
  
  // Filtering state
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    branches.forEach(b => b.type && types.add(b.type));
    return Array.from(types).sort();
  }, [branches]);

  // Filter branches based on search and type filters (using debounced search)
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      const matchesSearch = branch.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (branch.type && branch.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesType = typeFilter.length === 0 || (branch.type && typeFilter.includes(branch.type));
      return matchesSearch && matchesType;
    });
  }, [branches, debouncedSearchTerm, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBranches = filteredBranches.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setEditForm({ name: branch.name, type: branch.type || '' });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', type: '' });
    setError(null);
  };

  const handleSaveEdit = async (branchId: string) => {
    try {
      setError(null);
      const token = getToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/branches/${branchId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update branch');
      }

      setEditingId(null);
      setEditForm({ name: '', type: '' });
      onBranchUpdated();
    } catch (err) {
      console.error('Error updating branch:', err);
      setError(err instanceof Error ? err.message : 'Failed to update branch');
    }
  };

  const handleDelete = async (branchId: string, branchName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${branchName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError(null);
      setDeletingId(branchId);
      const token = getToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete branch');
      }

      onBranchDeleted();
    } catch (err) {
      console.error('Error deleting branch:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete branch');
    } finally {
      setDeletingId(null);
    }
  };

  // Batch operations
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedBranches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedBranches.map(b => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} branch(es)? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setBatchOperating(true);
      setError(null);
      const token = getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/branches/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          ids: Array.from(selectedIds)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete branches');
      }

      setSelectedIds(new Set());
      onBranchDeleted();
    } catch (err) {
      console.error('Error batch deleting:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete branches');
    } finally {
      setBatchOperating(false);
    }
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Get branch type badge color
  const getTypeBadgeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-700';
    
    const typeColors: Record<string, string> = {
      retail: 'bg-blue-100 text-blue-700',
      warehouse: 'bg-green-100 text-green-700',
      service: 'bg-orange-100 text-orange-700',
      office: 'bg-purple-100 text-purple-700',
      manufacturing: 'bg-red-100 text-red-700',
      distribution: 'bg-indigo-100 text-indigo-700'
    };

    return typeColors[type.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton Search Bar */}
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        
        {/* Skeleton Table */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {branches.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search branches by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Type Filters */}
          {uniqueTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium">Filter by type:</span>
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    typeFilter.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
              {typeFilter.length > 0 && (
                <button
                  onClick={() => setTypeFilter([])}
                  className="px-3 py-1 rounded-full text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Batch Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.size} branch{selectedIds.size !== 1 ? 'es' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-white rounded transition-colors"
              disabled={batchOperating}
            >
              Clear
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
              disabled={batchOperating}
            >
              {batchOperating ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {branches.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No branches yet</h3>
          <p className="text-sm text-gray-500">Create your first branch using the form on the right</p>
        </div>
      )}

      {/* No Results */}
      {branches.length > 0 && filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No branches match your search</p>
        </div>
      )}

      {/* Table */}
      {filteredBranches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedBranches.length && paginatedBranches.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(branch.id)}
                      onChange={() => toggleSelect(branch.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {editingId === branch.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{branch.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === branch.id ? (
                      <input
                        type="text"
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Branch type"
                      />
                    ) : branch.type ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(branch.type)}`}>
                        {branch.type.charAt(0).toUpperCase() + branch.type.slice(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(branch.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === branch.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSaveEdit(branch.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Edit branch"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id, branch.name)}
                          disabled={deletingId === branch.id}
                          className="p-1 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete branch"
                        >
                          {deletingId === branch.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredBranches.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBranches.length)} of {filteredBranches.length} branches
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
