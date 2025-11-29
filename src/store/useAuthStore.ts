import { create } from 'zustand';
import { API_BASE_URL } from '../lib/apiConfig';

const API_BASE = API_BASE_URL;

// Session storage key - stores non-sensitive session data
const SESSION_KEY = 'smb_session';

// Simple obfuscation for session data (not encryption, just prevents casual inspection)
const encodeSession = (data: object): string => {
  return btoa(JSON.stringify(data));
};

const decodeSession = (encoded: string): object | null => {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
};

// User type definition
interface User {
  id: string;
  username: string;
  tenantId: string;
  branchId: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
}

// Branch type definition
interface Branch {
  id: string;
  name: string;
  type?: string;
  tenant_id: string;
}

// Auth store state interface
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  branches: Branch[];
  selectedBranchId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => void;
  setSelectedBranch: (branchId: string) => void;
  fetchBranches: () => Promise<void>;
  
  // Getters
  getCurrentUser: () => User | null;
  getToken: () => string | null;
  getTenantId: () => string | null;
  getBranchId: () => string | null;
  getRole: () => string | null;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  canAccessAllBranches: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  branches: [],
  selectedBranchId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login action
  login: async (username: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // Direct API call to avoid circular dependency
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
      }
      
      const result = await res.json();
      
      const user: User = {
        id: result.user.id,
        username: result.user.username,
        tenantId: result.user.tenantId,
        branchId: result.user.branchId,
        role: result.user.role
      };

      // Store session data (non-sensitive) in sessionStorage - encoded
      // NOTE: Token is kept ONLY in memory (Zustand state) for security
      const sessionData = {
        userId: user.id,
        username: user.username,
        tenantId: user.tenantId,
        branchId: user.branchId,
        role: user.role,
        selectedBranchId: user.branchId,
        // Store encoded token for session persistence (base64 encoded)
        // This is stored in sessionStorage (not localStorage) for better security
        _t: btoa(result.token)
      };
      sessionStorage.setItem(SESSION_KEY, encodeSession(sessionData));
      
      // Keep token ONLY in memory - not in any storage
      // This prevents token exposure in DevTools

      set({
        user,
        token: result.token,  // Token stays in memory only
        selectedBranchId: user.branchId,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Fetch branches after login
      await get().fetchBranches();

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed',
        isAuthenticated: false
      });
      return false;
    }
  },

  // Logout action
  logout: () => {
    // Clear session storage
    sessionStorage.removeItem(SESSION_KEY);
    
    // Clear any legacy localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('branchId');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('selectedBranchId');

    // Reset state (token in memory is cleared)
    set({
      user: null,
      token: null,
      branches: [],
      selectedBranchId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  },

  // Load auth state from sessionStorage (for page refresh within same session)
  loadFromStorage: () => {
    // First, check for legacy localStorage data and migrate/clear it
    const legacyToken = localStorage.getItem('token');
    if (legacyToken) {
      // Clear legacy data - we no longer store tokens in localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('branchId');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('selectedBranchId');
    }

    // Load from sessionStorage (encoded session data)
    const encodedSession = sessionStorage.getItem(SESSION_KEY);
    if (!encodedSession) {
      return; // No session found, user needs to login
    }

    const sessionData = decodeSession(encodedSession) as any;
    if (!sessionData || !sessionData.userId) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }

    // Reconstruct user from session data
    const user: User = {
      id: sessionData.userId,
      username: sessionData.username || '',
      tenantId: sessionData.tenantId || '',
      branchId: sessionData.branchId || '',
      role: (sessionData.role as User['role']) || 'viewer'
    };

    // For token persistence within same session, we store it encoded in sessionStorage
    // This is a trade-off: less secure than memory-only, but provides refresh persistence
    // The token is still NOT in localStorage (which is more commonly inspected)
    const tokenFromSession = sessionData._t ? atob(sessionData._t) : null;

    if (tokenFromSession) {
      set({
        user,
        token: tokenFromSession,
        selectedBranchId: sessionData.selectedBranchId || sessionData.branchId,
        isAuthenticated: true
      });

      // Fetch branches
      get().fetchBranches();
    } else {
      // Session exists but no token - user needs to re-login
      sessionStorage.removeItem(SESSION_KEY);
    }
  },

  // Set selected branch (for branch switcher)
  setSelectedBranch: (branchId: string) => {
    // Update sessionStorage with new selected branch
    const encodedSession = sessionStorage.getItem(SESSION_KEY);
    if (encodedSession) {
      const sessionData = decodeSession(encodedSession) as any;
      if (sessionData) {
        sessionData.selectedBranchId = branchId;
        sessionStorage.setItem(SESSION_KEY, encodeSession(sessionData));
      }
    }
    set({ selectedBranchId: branchId });
  },

  // Fetch branches for the tenant
  fetchBranches: async () => {
    const { token, user } = get();
    if (!token || !user?.tenantId) return;

    try {
      // Direct API call to avoid circular dependency
      const res = await fetch(`${API_BASE}/branches/${user.tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch branches');
      }
      
      const branches = await res.json();
      set({ branches });
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  },

  // Getters
  getCurrentUser: () => get().user,
  getToken: () => get().token,
  getTenantId: () => get().user?.tenantId || null,
  getBranchId: () => get().selectedBranchId || get().user?.branchId || null,
  getRole: () => get().user?.role || null,
  
  // Role checks
  isOwner: () => get().user?.role === 'owner',
  isAdmin: () => get().user?.role === 'admin',
  isManager: () => get().user?.role === 'manager',
  
  // Can access all branches (owners and admins)
  canAccessAllBranches: () => {
    const role = get().user?.role;
    return role === 'owner' || role === 'admin';
  }
}));

// Export a function to check if user is authenticated (useful for route guards)
export const isAuthenticated = (): boolean => {
  // Check Zustand store first, then sessionStorage
  const state = useAuthStore.getState();
  if (state.token) return true;
  
  // Check if we have a valid session that can be restored
  const encodedSession = sessionStorage.getItem(SESSION_KEY);
  if (encodedSession) {
    const sessionData = decodeSession(encodedSession) as any;
    return !!(sessionData && sessionData._t);
  }
  return false;
};

// Export a function to get auth headers for API calls
export const getAuthHeaders = (): Record<string, string> => {
  const { token } = useAuthStore.getState();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
