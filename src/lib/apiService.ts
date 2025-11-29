// API Service with automatic authentication
// All API calls automatically include auth headers from the auth store

import { useAuthStore } from '../store/useAuthStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://smb-enhanced-billing-app.onrender.com/api';

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const { token } = useAuthStore.getState();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper function to get tenant/branch context
function getContext() {
  const { user, selectedBranchId } = useAuthStore.getState();
  return {
    tenantId: user?.tenantId || '',
    branchId: selectedBranchId || user?.branchId || '',
  };
}

// Generic fetch wrapper with auto-auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============ AUTH ============

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }
  return res.json();
}

// ============ TENANT REGISTRATION ============

export interface TenantRegistrationRequest {
  organizationName: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail?: string;
}

export interface TenantRegistrationResponse {
  message: string;
  tenant: { id: string; name: string };
  branch: { id: string; name: string };
  user: { id: string; username: string; role: string };
}

export async function apiRegisterTenant(data: TenantRegistrationRequest): Promise<TenantRegistrationResponse> {
  const res = await fetch(`${API_BASE}/tenants/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(error.error || 'Registration failed');
  }
  return res.json();
}

// ============ TENANTS ============

export async function apiGetTenants() {
  return apiFetch<any[]>('/tenants');
}

// ============ BRANCHES ============

export async function apiGetBranches(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any[]>(`/branches/${id}`);
}

// ============ INVOICES ============

export async function apiGetInvoicesByBranch(branchId?: string) {
  const { branchId: contextBranchId } = getContext();
  const id = branchId || contextBranchId;
  return apiFetch<any[]>(`/invoices/branch/${id}`);
}

export async function apiCreateInvoice(invoiceData: {
  customer_name: string;
  amount: number;
  status?: string;
  branch_id?: string;
}) {
  const { tenantId, branchId } = getContext();
  return apiFetch<any>('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      ...invoiceData,
      tenant_id: tenantId,
      branch_id: invoiceData.branch_id || branchId,
    }),
  });
}

// ============ ANALYTICS ============

export async function apiGetAnalyticsRevenueByBranch(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any>(`/analytics/revenue-by-branch/${id}`);
}

export async function apiGetAnalyticsTotalInvoices(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any>(`/analytics/total-invoices/${id}`);
}

export async function apiGetAnalyticsCustomerCount(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any>(`/analytics/customer-count/${id}`);
}

export async function apiGetAnalyticsOverdueRevenue(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any>(`/analytics/overdue-revenue/${id}`);
}

export async function apiGetAnalyticsPendingRevenue(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any>(`/analytics/pending-revenue/${id}`);
}

export async function apiGetAnalyticsMonthlyRevenue(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any>(`/analytics/monthly-revenue/${id}`);
}

// ============ USERS ============

export async function apiGetUsers(tenantId?: string) {
  const { tenantId: contextTenantId } = getContext();
  const id = tenantId || contextTenantId;
  return apiFetch<any[]>(`/users/${id}`);
}

export async function apiCreateUser(userData: {
  username: string;
  password: string;
  role: string;
  branch_id?: string;
}) {
  const { tenantId, branchId } = getContext();
  return apiFetch<any>('/users', {
    method: 'POST',
    body: JSON.stringify({
      ...userData,
      tenant_id: tenantId,
      branch_id: userData.branch_id || branchId,
    }),
  });
}

// ============ DEPRECATED - Backward compatibility ============
// These functions accept token parameter for backward compatibility
// but the token is ignored - auth is handled automatically

/** @deprecated Use apiGetTenants() instead */
export async function apiGetTenantsLegacy(token: string) {
  return apiGetTenants();
}

/** @deprecated Use apiGetBranches() instead */
export async function apiGetBranchesLegacy(token: string, tenantId: string) {
  return apiGetBranches(tenantId);
}

/** @deprecated Use apiGetInvoicesByBranch() instead */
export async function apiGetInvoicesByBranchLegacy(token: string, branchId: string) {
  return apiGetInvoicesByBranch(branchId);
}

/** @deprecated Use apiGetAnalyticsRevenueByBranch() instead */
export async function apiGetAnalyticsRevenueByBranchLegacy(token: string, tenantId: string) {
  return apiGetAnalyticsRevenueByBranch(tenantId);
}

// ============ AI INSIGHTS ============

export interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  actionTaken: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface InsightsResponse {
  success: boolean;
  data: AIInsight[];
  meta: {
    total: number;
    actionable: number;
    generatedAt: string;
  };
}

export interface InsightStatsResponse {
  success: boolean;
  data: {
    total: number;
    byType: Record<string, number>;
    actionable: number;
    completed: number;
    avgConfidence: number;
  };
}

// Get all AI insights
export async function apiGetInsights(branchId?: string): Promise<InsightsResponse> {
  const params = branchId ? `?branch_id=${branchId}` : '';
  return apiFetch<InsightsResponse>(`/insights${params}`);
}

// Get insight statistics
export async function apiGetInsightStats(branchId?: string): Promise<InsightStatsResponse> {
  const params = branchId ? `?branch_id=${branchId}` : '';
  return apiFetch<InsightStatsResponse>(`/insights/stats${params}`);
}

// Refresh insights (force regeneration)
export async function apiRefreshInsights(branchId?: string): Promise<InsightsResponse> {
  const params = branchId ? `?branch_id=${branchId}` : '';
  return apiFetch<InsightsResponse>(`/insights/refresh${params}`, {
    method: 'POST',
  });
}

// Mark an insight as actioned
export async function apiMarkInsightActioned(insightId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/insights/${insightId}/action`, {
    method: 'POST',
  });
}
