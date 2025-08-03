import { create } from 'zustand';
import { databaseService, type Staff } from '../lib/database';

interface StaffStore {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchStaff: () => Promise<void>;
  addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
  updateStaff: (id: number, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: number) => Promise<void>;
  getStaffById: (id: number) => Staff | undefined;
  getActiveStaff: () => Staff[];
  getStaffByRole: (role: Staff['role']) => Staff[];
}

export const useStaffStore = create<StaffStore>((set, get) => ({
  staff: [],
  loading: false,
  error: null,

  fetchStaff: async () => {
    set({ loading: true, error: null });
    try {
      const staff = await databaseService.getDatabase().staff.toArray();
      set({ staff, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch staff', loading: false });
      console.error('Error fetching staff:', error);
    }
  },

  addStaff: async (staffData) => {
    set({ loading: true, error: null });
    try {
      const id = await databaseService.getDatabase().staff.add(staffData);
      const newStaff = { ...staffData, id };
      set((state) => ({ 
        staff: [...state.staff, newStaff], 
        loading: false 
      }));
    } catch (error) {
      set({ error: 'Failed to add staff', loading: false });
      console.error('Error adding staff:', error);
    }
  },

  updateStaff: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await databaseService.getDatabase().staff.update(id, updates);
      set((state) => ({
        staff: state.staff.map((s) => 
          s.id === id ? { ...s, ...updates } : s
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update staff', loading: false });
      console.error('Error updating staff:', error);
    }
  },

  deleteStaff: async (id) => {
    set({ loading: true, error: null });
    try {
      await databaseService.getDatabase().staff.delete(id);
      set((state) => ({
        staff: state.staff.filter((s) => s.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete staff', loading: false });
      console.error('Error deleting staff:', error);
    }
  },

  getStaffById: (id) => {
    return get().staff.find((s) => s.id === id);
  },

  getActiveStaff: () => {
    return get().staff.filter((s) => s.isActive);
  },

  getStaffByRole: (role) => {
    return get().staff.filter((s) => s.role === role);
  }
}));
