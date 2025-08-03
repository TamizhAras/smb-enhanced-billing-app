import { useState, useEffect } from 'react';
import { useStaffStore } from '../store/useStaffStore';
import type { Staff } from '../lib/database';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  UserCheck,
  UserX,
  Crown,
  Briefcase,
  User,
  Mail,
  Phone,
  Clock
} from 'lucide-react';

export default function StaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff, fetchStaff } = useStaffStore();
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<number | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as const,
    permissions: {
      billing: false,
      customers: false,
      feedback: false,
      analytics: false,
      tasks: false,
      inventory: false,
      staff: false
    }
  });

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'manager': return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'staff': return <User className="h-4 w-4 text-gray-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddStaff = () => {
    addStaff({
      ...newStaff,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setNewStaff({
      name: '',
      email: '',
      phone: '',
      role: 'staff' as const,
      permissions: {
        billing: false,
        customers: false,
        feedback: false,
        analytics: false,
        tasks: false,
        inventory: false,
        staff: false
      }
    });
    setIsAddingStaff(false);
  };

  const handleToggleStatus = (id: number, isActive: boolean) => {
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      updateStaff(id, { ...staffMember, isActive: !isActive, updatedAt: new Date() });
    }
  };

  const formatLastLogin = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  };

  const activeStaff = staff.filter(s => s.isActive);
  const inactiveStaff = staff.filter(s => !s.isActive);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage team members, roles, and permissions</p>
        </div>
        <Button 
          onClick={() => setIsAddingStaff(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeStaff.length}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Managers</p>
              <p className="text-2xl font-bold text-blue-600">
                {staff.filter(s => s.role === 'manager').length}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-2xl font-bold text-purple-600">
                {staff.filter(s => s.isActive && s.lastLogin && 
                  new Date().getTime() - s.lastLogin.getTime() < 60 * 60 * 1000).length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Active Staff */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-green-500" />
          Active Staff ({activeStaff.length})
        </h2>
        <div className="space-y-4">
          {activeStaff.map((member) => (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {member.lastLogin ? formatLastLogin(member.lastLogin) : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingStaff(member.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleStatus(member.id, member.isActive)}
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                  {member.role !== 'owner' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteStaff(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Permissions */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(member.permissions).map(([perm, hasAccess]) => (
                    hasAccess && (
                      <span key={perm} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        {perm.charAt(0).toUpperCase() + perm.slice(1)}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Inactive Staff */}
      {inactiveStaff.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-500" />
            Inactive Staff ({inactiveStaff.length})
          </h2>
          <div className="space-y-3">
            {inactiveStaff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleToggleStatus(member.id, member.isActive)}
                >
                  Reactivate
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Staff Member</h3>
            <div className="space-y-4">
              <Input
                label="Name"
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                placeholder="Enter full name"
              />
              <Input
                label="Email"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                placeholder="Enter email address"
              />
              <Input
                label="Phone"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                placeholder="Enter phone number"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select 
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {Object.entries(newStaff.permissions).map(([perm, hasAccess]) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hasAccess}
                        onChange={(e) => setNewStaff({
                          ...newStaff,
                          permissions: {
                            ...newStaff.permissions,
                            [perm]: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleAddStaff}
                className="flex-1"
                disabled={!newStaff.name || !newStaff.email}
              >
                Add Staff
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingStaff(false)}
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
}
