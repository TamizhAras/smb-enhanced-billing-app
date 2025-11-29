import React, { useEffect, useState } from 'react';
import { Plus, Clock, AlertCircle, CheckCircle2, Users, Search } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { Task } from '../lib/database';

export const TasksPage = () => {
  const {
    tasks,
    staff,
    isLoading,
    loadTasks,
    loadStaff,
    createTask,
    updateTask,
    completeTask,
    getTaskStats,
    getOverdueTasks
  } = useTaskStore();

  // Get branch context for filtering
  const { selectedBranchId } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    customerId: '',
    type: 'general' as const,
    priority: 'medium' as const,
    dueDate: '',
    tags: ''
  });

  useEffect(() => {
    loadTasks();
    loadStaff();
  }, [loadTasks, loadStaff, selectedBranchId]); // Reload when branch changes

  const stats = getTaskStats();
  const overdueTasks = getOverdueTasks();

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesAssignee = filterAssignee === 'all' || task.assignedTo?.toString() === filterAssignee;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({
        title: newTask.title,
        description: newTask.description || undefined,
        assignedTo: newTask.assignedTo ? parseInt(newTask.assignedTo) : undefined,
        assignedToName: staff.find(s => s.id === parseInt(newTask.assignedTo))?.name,
        customerId: newTask.customerId ? parseInt(newTask.customerId) : undefined,
        type: newTask.type === 'general' ? 'other' : newTask.type,
        priority: newTask.priority,
        status: 'pending',
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        createdBy: 1 // Default to owner
      });
      
      setShowCreateForm(false);
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        customerId: '',
        type: 'general',
        priority: 'medium',
        dueDate: '',
        tags: ''
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      if (newStatus === 'completed') {
        await completeTask(taskId);
      } else {
        await updateTask(taskId, { status: newStatus as any });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'text-blue-600 bg-blue-50';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Organize and track team tasks</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">
              {overdueTasks.length} task(s) are overdue and need attention
            </span>
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
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Assignees</option>
            {staff.map(member => (
              <option key={member.id} value={member.id?.toString()}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map(task => (
          <Card key={task.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>
                
                {task.description && (
                  <p className="text-gray-600 mb-2">{task.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {task.assignedToName && (
                    <span>Assigned to: {task.assignedToName}</span>
                  )}
                  {task.customerName && (
                    <span>Customer: {task.customerName}</span>
                  )}
                  {task.dueDate && (
                    <span className={task.dueDate < new Date() && task.status !== 'completed' ? 'text-red-600' : ''}>
                      Due: {task.dueDate.toLocaleDateString()}
                    </span>
                  )}
                  <span>Type: {task.type}</span>
                </div>
              </div>
              
              <div className="ml-4">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id!, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </Card>
        ))}
        
        {filteredTasks.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No tasks found matching your criteria</p>
          </Card>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              
              <textarea
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
              
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Assign to (optional)</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id?.toString()}>
                    {member.name}
                  </option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="general">General</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="inventory">Inventory</option>
                  <option value="support">Support</option>
                  <option value="billing">Billing</option>
                </select>
                
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
              
              <Input
                placeholder="Tags (comma separated)"
                value={newTask.tags}
                onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
              />
              
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">Create Task</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
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
