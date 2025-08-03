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
  Brain
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Enhanced Billing',
    href: '/enhanced-billing',
    icon: FileText,
    description: 'Advanced invoice & payment management'
  },
  {
    name: 'Basic Billing',
    href: '/billing',
    icon: FileText,
    description: 'Simple invoices & payments'
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
  return (
    <div className="w-64 bg-white shadow-lg">
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

      {/* Navigation */}
      <nav className="p-4">
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

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>SMB Offline Manager v3.0</p>
          <p>Enhanced Billing + PWA Ready</p>
        </div>
      </div>
    </div>
  );
};
