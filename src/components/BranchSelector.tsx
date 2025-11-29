import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const BranchSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    branches, 
    selectedBranchId, 
    setSelectedBranch, 
    canAccessAllBranches,
    isOwner 
  } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only show for users who can access multiple branches
  // Show if user can access all branches AND has more than 1 branch
  if (!canAccessAllBranches()) {
    return null;
  }

  // If only 1 branch, show a simple info display (no dropdown)
  if (branches.length <= 1) {
    const singleBranch = branches[0];
    return (
      <div>
        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>Current Branch</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="text-sm font-medium text-gray-900">
            {singleBranch?.name || 'No branches'}
          </div>
        </div>
      </div>
    );
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const displayName = selectedBranchId === 'all' 
    ? 'All Branches' 
    : selectedBranch?.name || 'Select Branch';

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        <span>Viewing Branch</span>
      </div>

      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="text-left min-w-0">
            <div className="font-medium text-gray-900 truncate text-sm">
              {displayName}
            </div>
            {selectedBranchId !== 'all' && selectedBranch?.type && (
              <div className="text-xs text-gray-500 truncate">
                {selectedBranch.type}
              </div>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {/* All Branches Option (only for owners) */}
            {isOwner() && (
              <>
                <button
                  onClick={() => handleBranchSelect('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                    selectedBranchId === 'all' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">All Branches</div>
                    <div className="text-xs text-gray-500">Aggregate view</div>
                  </div>
                  {selectedBranchId === 'all' && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
                <div className="border-t border-gray-100" />
              </>
            )}

            {/* Individual Branches */}
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchSelect(branch.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                  selectedBranchId === branch.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {branch.name}
                  </div>
                  {branch.type && (
                    <div className="text-xs text-gray-500 truncate">{branch.type}</div>
                  )}
                </div>
                {selectedBranchId === branch.id && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {branches.length} branch{branches.length !== 1 ? 'es' : ''} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
