import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Building2,
  CheckSquare,
  Package,
  UserCheck,
  Brain,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { BranchSelector } from './BranchSelector';
import { useAuthStore } from '../store/useAuthStore';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & branch performance'
  },
  {
    name: 'Billing',
    href: '/enhanced-billing',
    icon: FileText,
    description: 'Invoices & payment management'
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    description: 'Manage customer relationships'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Track team tasks & assignments'
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    description: 'Manage stock & inventory'
  },
  {
    name: 'Staff',
    href: '/staff',
    icon: UserCheck,
    description: 'Manage team & permissions'
  },
  {
    name: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    description: 'Collect & analyze customer feedback'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Business insights & reports'
  },
  {
    name: 'AI Insights',
    href: '/ai-insights',
    icon: Brain,
    description: 'Smart business recommendations'
  }
];

export const Sidebar: React.FC = () => {
  const { user, logout, canAccessAllBranches } = useAuthStore();

  const displayName = user?.username || user?.name || user?.email || 'User';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Member';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">SMB Manager</h1>
            <p className="text-xs text-gray-500">Business Management Suite</p>
          </div>
        </div>
      </div>

      {/* Branch Selector (for owners/admins with multiple branches) */}
      {canAccessAllBranches() && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
          <BranchSelector />
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer - User Info & Logout */}
      <div className="border-t border-gray-200 bg-gray-50">
        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {displayInitial}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {/* Version */}
        <div className="px-4 pb-3 text-xs text-gray-500 text-center">
          <p>SMB Offline Manager v3.0</p>
        </div>
      </div>
    </div>
  );
};
