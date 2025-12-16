import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Building2, Plus, AlertCircle, Keyboard, Upload } from 'lucide-react';
import { BranchTable } from '../components/branch/BranchTable';
import { BranchCreateForm } from '../components/branch/BranchCreateForm';
import { BranchImportModal } from '../components/branch/BranchImportModal';

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

export const BranchManagementPage: React.FC = () => {
  const { getToken, getTenantId, isOwner } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [focusFormTrigger, setFocusFormTrigger] = useState(0);

  const tenantId = getTenantId();
  const token = getToken();

  // Redirect if not owner
  useEffect(() => {
    if (!isOwner()) {
      window.location.href = '/dashboard';
    }
  }, [isOwner]);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      if (!tenantId || !token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/branches/${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch branches');
        }

        const data = await response.json();
        setBranches(data);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError(err instanceof Error ? err.message : 'Failed to load branches');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [tenantId, token, refreshTrigger]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N: Focus on create form
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setFocusFormTrigger(prev => prev + 1);
      }
      // ?: Show keyboard shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowKeyboardHelp(prev => !prev);
        }
      }
      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowImportModal(false);
        setShowKeyboardHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBranchCreated = () => {
    // Trigger refresh of branches list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBranchUpdated = () => {
    // Trigger refresh of branches list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBranchDeleted = () => {
    // Trigger refresh of branches list
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isOwner()) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
              <p className="text-sm text-gray-500">Create and manage your organization's branches</p>
            </div>
          </div>
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Keyboard shortcuts (Press ?)"
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content - Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Branch List (60%) */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Existing Branches</h2>
                <span className="text-sm text-gray-500">
                  {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
                </span>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Import CSV
              </button>
            </div>
            
            <BranchTable
              branches={branches}
              isLoading={isLoading}
              onBranchUpdated={handleBranchUpdated}
              onBranchDeleted={handleBranchDeleted}
            />
          </Card>
        </div>

        {/* Right Panel - Quick Create Form (40%) */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Create Branch</h2>
            </div>
            
            <BranchCreateForm
              existingBranches={branches}
              onBranchCreated={handleBranchCreated}
              focusTrigger={focusFormTrigger}
            />
          </Card>
        </div>
      </div>

      {/* Import Modal */}
      <BranchImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          setShowImportModal(false);
          setRefreshTrigger(prev => prev + 1);
        }}
        existingBranches={branches}
      />

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Create new branch</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+N</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Close modals</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-700">Submit form</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Show this help</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">?</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
