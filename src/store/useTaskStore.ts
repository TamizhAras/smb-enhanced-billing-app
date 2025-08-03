import { create } from 'zustand';
import { databaseService } from '../lib/database';
import type { Task, Staff } from '../lib/database';

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    'follow-up': number;
    inventory: number;
    support: number;
    billing: number;
    general: number;
  };
}

interface TaskStore {
  tasks: Task[];
  staff: Staff[];
  currentUser: Staff | null;
  isLoading: boolean;
  
  // Actions
  loadTasks: () => Promise<void>;
  loadStaff: () => Promise<void>;
  setCurrentUser: (userId: number) => Promise<void>;
  
  // Task CRUD
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  completeTask: (id: number) => Promise<void>;
  
  // Task filtering
  getTasksByStatus: (status: string) => Task[];
  getTasksByAssignee: (assignedTo: number) => Task[];
  getOverdueTasks: () => Task[];
  getTasksByType: (type: string) => Task[];
  
  // Analytics
  getTaskStats: () => TaskStats;
  
  // Staff management
  createStaff: (staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateStaff: (id: number, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  staff: [],
  currentUser: null,
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const db = databaseService.getDatabase();
      const tasks = await db.tasks.orderBy('createdAt').reverse().toArray();
      set({ tasks });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadStaff: async () => {
    try {
      const db = databaseService.getDatabase();
      const staff = await db.staff.where('isActive').equals(1).toArray();
      set({ staff });
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  },

  setCurrentUser: async (userId: number) => {
    try {
      const db = databaseService.getDatabase();
      const user = await db.staff.get(userId);
      if (user) {
        set({ currentUser: user });
        await db.staff.update(userId, { lastLogin: new Date() });
      }
    } catch (error) {
      console.error('Failed to set current user:', error);
    }
  },

  createTask: async (taskData) => {
    try {
      const db = databaseService.getDatabase();
      const currentUser = get().currentUser;
      
      const task: Omit<Task, 'id'> = {
        ...taskData,
        tags: taskData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.id || 1
      };

      const id = await db.tasks.add(task);
      
      // Reload tasks
      await get().loadTasks();
      
      return id;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const db = databaseService.getDatabase();
      await db.tasks.update(id, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Reload tasks
      await get().loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      const db = databaseService.getDatabase();
      await db.tasks.delete(id);
      
      // Reload tasks
      await get().loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  },

  completeTask: async (id) => {
    try {
      await databaseService.completeTask(id);
      
      // Reload tasks
      await get().loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
      throw error;
    }
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter(task => task.status === status);
  },

  getTasksByAssignee: (assignedTo) => {
    return get().tasks.filter(task => task.assignedTo === assignedTo);
  },

  getOverdueTasks: () => {
    const now = new Date();
    return get().tasks.filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    );
  },

  getTasksByType: (type) => {
    return get().tasks.filter(task => task.type === type);
  },

  getTaskStats: () => {
    const tasks = get().tasks;
    const now = new Date();
    
    const stats: TaskStats = {
      total: tasks.length,
      todo: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      byPriority: {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {
        'follow-up': 0,
        inventory: 0,
        support: 0,
        billing: 0,
        general: 0
      }
    };

    tasks.forEach(task => {
      // Status counts
      if (task.status === 'todo') stats.todo++;
      else if (task.status === 'in-progress') stats.inProgress++;
      else if (task.status === 'completed') stats.completed++;

      // Overdue count
      if (task.dueDate && task.dueDate < now && 
          task.status !== 'completed' && task.status !== 'cancelled') {
        stats.overdue++;
      }

      // Priority counts
      stats.byPriority[task.priority]++;

      // Type counts
      stats.byType[task.type]++;
    });

    return stats;
  },

  createStaff: async (staffData) => {
    try {
      const db = databaseService.getDatabase();
      
      const staff: Omit<Staff, 'id'> = {
        ...staffData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const id = await db.staff.add(staff);
      
      // Reload staff
      await get().loadStaff();
      
      return id;
    } catch (error) {
      console.error('Failed to create staff:', error);
      throw error;
    }
  },

  updateStaff: async (id, updates) => {
    try {
      const db = databaseService.getDatabase();
      await db.staff.update(id, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Reload staff
      await get().loadStaff();
    } catch (error) {
      console.error('Failed to update staff:', error);
      throw error;
    }
  },

  deleteStaff: async (id) => {
    try {
      const db = databaseService.getDatabase();
      await db.staff.update(id, { isActive: false });
      
      // Reload staff
      await get().loadStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
      throw error;
    }
  }
}));
