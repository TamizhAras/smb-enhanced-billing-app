# Multi-Branch Business Management Implementation Plan

## 📋 Overview

This document outlines the implementation plan to enable business owners with multiple branches/locations to effectively manage and monitor their entire business from a single dashboard.

---

## 🎯 Business Requirements

### User Stories

1. **As a business owner**, I want to see all my branches' performance at a glance so I can quickly identify which locations need attention.

2. **As a business owner**, I want to compare revenue, invoices, and customer metrics across all branches to make informed business decisions.

3. **As a business owner**, I want to drill down into a specific branch to see detailed analytics and manage its operations.

4. **As a branch manager**, I want to see only my branch's data and manage its day-to-day operations.

5. **As a staff member**, I want to create invoices and manage customers for my assigned branch only.

---

## 🔒 Security & UX Improvements (User Feedback)

### 1. Secure Token Storage (Priority: High)
**Issue:** JWT token is currently visible in browser DevTools → Application → Local Storage, which poses a security risk.

**Current Implementation:** Token stored in sessionStorage (encoded) - hidden from localStorage but still extractable.

**Solution Options:**
- **Option A (Recommended):** Use `httpOnly` cookies for token storage (requires backend changes)
- **Option B:** Store token in memory (Zustand store) + use refresh tokens
- **Option C:** Encrypt token before storing in localStorage

**Status:** ⚠️ **TECH DEBT** - Current implementation provides basic obfuscation. HttpOnly cookies implementation deferred for future sprint.

**Implementation:** Phase 1, Task 4

### 2. Login Page UI Redesign (Priority: Medium)
**Issue:** Current login page has basic styling and needs visual improvement.

**Improvements:**
- Modern gradient background
- Centered card with shadow and rounded corners
- Company branding/logo placeholder
- Better form styling with icons
- Loading state animations
- Error message styling
- "Remember me" checkbox option
- Responsive design for mobile

**Implementation:** Phase 1, Task 5

---

## 📊 Current Implementation Status

### ✅ Already Implemented (Backend)

| Feature | Description | Location |
|---------|-------------|----------|
| Multi-Tenant Database Schema | `tenants`, `branches`, `users`, `invoices` tables | `backend/migrations/001_init.sql` |
| Tenant Management API | Create/list tenants | `backend/controllers/TenantController.js` |
| Branch Management API | Create/list branches per tenant | `backend/controllers/BranchController.js` |
| User Roles (RBAC) | `owner`, `admin`, `manager`, `staff`, `viewer` | `backend/middleware/auth.js` |
| Branch-Scoped Invoices | Invoices linked to `tenant_id` and `branch_id` | Database schema |
| Revenue by Branch Analytics | `/api/analytics/revenue-by-branch/:tenantId` | `backend/controllers/AnalyticsController.js` |
| JWT Authentication | Token includes `tenantId`, `branchId`, `role` | `backend/controllers/AuthController.js` |

### ⚠️ Partially Implemented

| Feature | Issue |
|---------|-------|
| Login System | Doesn't store `tenantId`/`branchId` in localStorage |
| Analytics Charts | Exist but use local/mock data, not backend APIs |

### ❌ Not Yet Implemented

| Feature | Priority |
|---------|----------|
| Owner Dashboard | High |
| Branch Selector UI | High |
| Branch-Specific Data Filtering | High |
| Cross-Branch Comparison Charts | Medium |
| Branch Manager Restricted View | Medium |

---

## 🏗️ Implementation Plan

> **✅ Testability:** Each task and phase includes verification steps you can test immediately after completion.

### Phase 1: Authentication & Session Management (Priority: Critical)

**Objective:** Store tenant and branch context after login for all subsequent API calls.

#### Tasks:

1. **Update Login Flow**
   - Store `tenantId`, `branchId`, `role` in localStorage after successful login
   - Create auth context/store to manage session state
   - File: `src/pages/LoginPage.tsx`
   
   **🧪 How to Test:**
   - Login with `admin/admin123`
   - Open browser DevTools → Application → Local Storage
   - Verify you see: `token`, `tenantId`, `branchId`, `role`, `username`
   - ✅ **Pass:** All 5 values are stored

2. **Create Auth Store**
   - Zustand store for authentication state
   - Methods: `login()`, `logout()`, `getCurrentUser()`, `getBranches()`
   - File: `src/store/useAuthStore.ts`
   
   **🧪 How to Test:**
   - After login, refresh the page
   - You should still be logged in (not redirected to login)
   - ✅ **Pass:** Session persists after refresh

3. **Update API Service**
   - All API calls should automatically include tenant/branch context
   - Add interceptor to include auth headers
   - File: `src/lib/apiService.ts`
   
   **🧪 How to Test:**
   - Open DevTools → Network tab
   - Navigate to any page (e.g., Analytics)
   - Check API requests have `Authorization: Bearer <token>` header
   - ✅ **Pass:** All API calls include auth header

4. **Secure Token Storage** ⭐ NEW
   - Move JWT token from localStorage to memory-only storage
   - Implement token refresh mechanism or httpOnly cookies
   - Token should NOT be visible in DevTools → Application → Local Storage
   - Files: `src/store/useAuthStore.ts`, `backend/controllers/AuthController.js`
   
   **🧪 How to Test:**
   - Login with `admin/admin123`
   - Open DevTools → Application → Local Storage
   - Token should NOT be visible (only non-sensitive data like username, role)
   - Refresh page → should still be logged in
   - ✅ **Pass:** Token hidden from localStorage, session persists

5. **Login Page UI Redesign** ⭐ NEW
   - Modern gradient background with brand colors
   - Centered card with shadow, rounded corners, and subtle animations
   - Company logo/branding placeholder
   - Form inputs with icons (user, lock)
   - Improved button styling with hover/loading states
   - Better error message display
   - Mobile responsive design
   - File: `src/pages/LoginPage.tsx`
   
   **🧪 How to Test:**
   - Navigate to login page
   - Visual inspection: gradient background, centered card, icons in inputs
   - Try invalid login → error message styled nicely
   - Try valid login → button shows loading spinner
   - Resize browser → layout adapts for mobile
   - ✅ **Pass:** Login page looks professional and modern

#### 📋 Phase 1 Completion Checklist:
- [x] Login stores all user data in localStorage
- [x] Page refresh maintains login state
- [ ] API calls include authorization header
- [ ] Token is NOT visible in localStorage (secure storage)
- [ ] Login page has modern, professional UI
- [ ] Logout clears all stored data

**Estimated Time:** 4-5 hours

---

### Phase 2: Branch Selector Component (Priority: High)

**Objective:** Allow users to switch between branches (owners see all, managers see their branch only).

#### Tasks:

1. **Create Branch Selector Component**
   - Dropdown in the header/sidebar
   - Shows all branches for owners, single branch for managers/staff
   - Stores selected branch in state/localStorage
   - File: `src/components/BranchSelector.tsx`
   
   **🧪 How to Test:**
   - Login as owner
   - Look for branch dropdown in sidebar
   - Click dropdown → should show list of branches
   - ✅ **Pass:** Dropdown appears and shows branches

2. **Update Sidebar**
   - Add branch selector to sidebar header
   - Show current branch name
   - File: `src/components/Sidebar.tsx`
   
   **🧪 How to Test:**
   - Branch selector visible in sidebar
   - Current branch name displayed
   - ✅ **Pass:** Selector integrated into sidebar UI

3. **Create Branch Context**
   - React context for selected branch
   - Auto-select user's branch for non-owner roles
   - File: `src/contexts/BranchContext.tsx`
   
   **🧪 How to Test:**
   - Select a different branch from dropdown
   - Check localStorage for `selectedBranchId`
   - Refresh page → same branch should be selected
   - ✅ **Pass:** Branch selection persists

#### 📋 Phase 2 Completion Checklist:
- [ ] Branch selector dropdown visible in sidebar
- [ ] Dropdown shows all branches (for owner)
- [ ] Selecting a branch updates localStorage
- [ ] Branch selection persists after refresh

**Estimated Time:** 2-3 hours

---

### Phase 3: Owner Dashboard (Priority: High)

**Objective:** Create a unified dashboard for business owners to see all branches' KPIs.

#### Tasks:

1. **Create Owner Dashboard Page**
   - New page: `src/pages/OwnerDashboardPage.tsx`
   - Route: `/owner-dashboard`
   
   **🧪 How to Test:**
   - Navigate to `http://localhost:5174/smb-enhanced-billing-app/owner-dashboard`
   - Page should load without errors
   - ✅ **Pass:** Page renders with title "Owner Dashboard"

2. **Dashboard Components:**

   a. **All Branches Overview Card**
   - Total revenue across all branches
   - Total invoices, customers
   - Best performing branch highlight
   
   **🧪 How to Test:**
   - See "Total Business Revenue" card
   - Shows aggregated numbers from all branches
   - ✅ **Pass:** Overview card displays data
   
   b. **Branch Performance Comparison Chart**
   - Bar chart comparing revenue by branch
   - Uses `/api/analytics/revenue-by-branch/:tenantId`
   
   **🧪 How to Test:**
   - See bar chart with branch names on X-axis
   - Each bar shows revenue for that branch
   - ✅ **Pass:** Chart renders with branch data
   
   c. **Branch KPI Cards Grid**
   - One card per branch showing:
     - Revenue (this month)
     - Invoice count
     - Pending/Overdue amounts
     - Quick action buttons
   
   **🧪 How to Test:**
   - See grid of cards (one per branch)
   - Each card shows branch name and metrics
   - ✅ **Pass:** All branches have a card
   
   d. **Branch Trend Lines**
   - Line chart showing each branch's monthly trend
   - Color-coded by branch
   
   **🧪 How to Test:**
   - See line chart with multiple lines
   - Legend shows branch names with colors
   - ✅ **Pass:** Trend chart renders

3. **Add to Navigation**
   - Add "Owner Dashboard" link in sidebar (visible only to owners)
   - File: `src/components/Sidebar.tsx`
   
   **🧪 How to Test:**
   - Login as owner → "Owner Dashboard" link visible
   - Click link → navigates to dashboard
   - ✅ **Pass:** Navigation works

#### 📋 Phase 3 Completion Checklist:
- [ ] Owner Dashboard page accessible at `/owner-dashboard`
- [ ] Overview card shows total business metrics
- [ ] Branch comparison bar chart renders
- [ ] Each branch has a KPI card
- [ ] Navigation link works from sidebar

**Estimated Time:** 4-5 hours

---

### Phase 4: Branch-Scoped Data Filtering (Priority: High)

**Objective:** All data pages filter by selected branch.

#### Tasks:

1. **Update Invoice Store**
   - Add `branchId` parameter to all fetch methods
   - Filter invoices by branch
   - File: `src/store/useInvoiceStore.ts`
   
   **🧪 How to Test:**
   - Select Branch A from dropdown
   - Go to Billing page
   - Create an invoice
   - Switch to Branch B
   - The invoice created in Branch A should NOT appear
   - ✅ **Pass:** Invoices are branch-specific

2. **Update Customer Store**
   - Add `branchId` parameter
   - Customers can be shared or branch-specific
   - File: `src/store/useCustomerStore.ts`
   
   **🧪 How to Test:**
   - Select Branch A, add a customer
   - Switch to Branch B
   - Customer should still appear (shared) OR not appear (branch-specific)
   - ✅ **Pass:** Customer scoping works as designed

3. **Update Inventory Store**
   - Inventory is typically branch-specific
   - File: `src/store/useInventoryStore.ts`
   
   **🧪 How to Test:**
   - Select Branch A, add inventory item
   - Switch to Branch B
   - Item should NOT appear (inventory is branch-specific)
   - ✅ **Pass:** Inventory is branch-scoped

4. **Update All Pages**
   - BillingPage, CustomersPage, InventoryPage, AnalyticsPage
   - Read selected branch from context
   - Pass to API calls
   
   **🧪 How to Test:**
   - Switch branches using dropdown
   - Data on current page should refresh
   - Different branches show different data
   - ✅ **Pass:** All pages respond to branch change

#### 📋 Phase 4 Completion Checklist:
- [ ] Switching branch updates Billing page data
- [ ] Switching branch updates Customers page data
- [ ] Switching branch updates Inventory page data
- [ ] Switching branch updates Analytics page data
- [ ] Creating data in one branch doesn't appear in another

**Estimated Time:** 3-4 hours

---

### Phase 5: Analytics Integration (Priority: Medium)

**Objective:** Connect frontend charts to backend analytics APIs.

#### Tasks:

1. **Update AnalyticsPage**
   - Fetch from backend APIs instead of calculating locally
   - Show branch-specific or all-branches data based on context
   - File: `src/pages/AnalyticsPage.tsx`
   
   **🧪 How to Test:**
   - Go to Analytics page
   - Open DevTools → Network tab
   - Should see API calls to `/api/analytics/*`
   - Data should match what's in the database
   - ✅ **Pass:** Analytics data comes from backend

2. **Update BillingPage Analytics**
   - Monthly revenue chart from backend
   - Branch performance chart from backend
   - File: `src/pages/BillingPage.tsx`
   
   **🧪 How to Test:**
   - Go to Billing page
   - Charts should show data from backend API
   - Add a new paid invoice
   - Refresh → chart should update
   - ✅ **Pass:** Charts reflect real database data

3. **Add New Backend Endpoints (if needed)**
   - `/api/analytics/branch-comparison/:tenantId`
   - `/api/analytics/monthly-trend/:tenantId/:branchId`
   - File: `backend/controllers/AnalyticsController.js`
   
   **🧪 How to Test:**
   - Use Postman or browser to call endpoint directly
   - Example: `http://localhost:4000/api/analytics/branch-comparison/{tenantId}`
   - Should return JSON data
   - ✅ **Pass:** API returns valid data

#### 📋 Phase 5 Completion Checklist:
- [ ] Analytics page fetches from backend APIs
- [ ] Billing page charts use backend data
- [ ] New API endpoints return correct data
- [ ] Charts update when database changes

**Estimated Time:** 3-4 hours

---

### Phase 6: Role-Based Access Control (Priority: Medium)

**Objective:** Restrict UI and data access based on user role.

#### Tasks:

1. **Create Role Guard Component**
   - Higher-order component to wrap protected routes
   - File: `src/components/RoleGuard.tsx`
   
   **🧪 How to Test:**
   - Create a test route wrapped with `<RoleGuard allowedRoles={['owner']}>`
   - Login as owner → can access
   - Login as staff → redirected or shows "Access Denied"
   - ✅ **Pass:** Role guard blocks unauthorized access

2. **Update Routes**
   - Owner Dashboard: owners only
   - Branch settings: owners and admins
   - File: `src/App.tsx`
   
   **🧪 How to Test:**
   - Login as staff
   - Try to navigate to `/owner-dashboard` directly
   - Should be redirected or shown error
   - ✅ **Pass:** Protected routes work

3. **Conditional UI Elements**
   - Hide/show buttons based on role
   - Disable editing for viewers
   - Throughout all pages
   
   **🧪 How to Test:**
   - Login as viewer
   - Go to Billing page
   - "Create Invoice" button should be hidden or disabled
   - ✅ **Pass:** UI adapts to role

#### 📋 Phase 6 Completion Checklist:
- [ ] RoleGuard component blocks unauthorized access
- [ ] Owner Dashboard only accessible to owners
- [ ] Viewers cannot create/edit data
- [ ] Staff cannot delete data
- [ ] Managers can only see their branch

**Estimated Time:** 2-3 hours

---

## 📁 New Files to Create

```
src/
├── components/
│   ├── BranchSelector.tsx      (NEW)
│   └── RoleGuard.tsx           (NEW)
├── contexts/
│   └── BranchContext.tsx       (NEW)
├── pages/
│   └── OwnerDashboardPage.tsx  (NEW)
├── store/
│   └── useAuthStore.ts         (NEW)
└── lib/
    └── apiService.ts           (UPDATE)

backend/
└── controllers/
    └── AnalyticsController.js  (UPDATE - add new endpoints)
```

---

## 📐 Database Schema (Already Exists)

```sql
-- Tenants (Businesses)
tenants (id, name, created_at)

-- Branches/Outlets
branches (id, tenant_id, name, type, created_at)

-- Users (with role and branch assignment)
users (id, tenant_id, branch_id, username, password_hash, role, created_at)

-- Invoices (branch-scoped)
invoices (id, tenant_id, branch_id, customer_name, amount, status, created_at)
```

---

## 🔐 Role Permissions Matrix

| Feature | Owner | Admin | Manager | Staff | Viewer |
|---------|-------|-------|---------|-------|--------|
| View All Branches | ✅ | ✅ | ❌ | ❌ | ❌ |
| Owner Dashboard | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Branch | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Branch Data | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) |
| Create Invoices | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Invoices | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Invoices | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ❌ | ✅ |
| Export Data | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## ⏱️ Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Auth & Session | 2-3 hours | None |
| Phase 2: Branch Selector | 2-3 hours | Phase 1 |
| Phase 3: Owner Dashboard | 4-5 hours | Phase 1, 2 |
| Phase 4: Data Filtering | 3-4 hours | Phase 2 |
| Phase 5: Analytics Integration | 3-4 hours | Phase 4 |
| Phase 6: RBAC | 2-3 hours | Phase 1 |

**Total Estimated Time:** 16-22 hours

---

## 🧪 Testing Scenarios

### Test Case 1: Owner Login
1. Login as owner (admin/admin123)
2. Should see Owner Dashboard link in sidebar
3. Should see branch selector with all branches
4. Should be able to switch between branches
5. All data should update based on selected branch

### Test Case 2: Branch Manager Login
1. Create a manager user assigned to Branch A
2. Login as manager
3. Should NOT see Owner Dashboard
4. Branch selector should show only Branch A (disabled)
5. Should only see Branch A data

### Test Case 3: Cross-Branch Analytics
1. Login as owner
2. Go to Owner Dashboard
3. Should see comparison chart with all branches
4. Should see KPI cards for each branch
5. Clicking a branch card should navigate to that branch's details

---

## 🚀 Getting Started

To begin implementation, run:

```bash
# Ensure backend is running
cd backend
npm run start

# In another terminal, start frontend
cd ..
npm run dev
```

Then proceed with Phase 1 implementation.

---

## 📝 Notes

- All branch-specific data should be cached locally for offline support
- Consider adding branch-level settings (tax rates, invoice templates, etc.)
- Future enhancement: Inter-branch inventory transfer

---

## 🔧 Tech Debt

### 1. HttpOnly Cookie Authentication (High Priority)
**Issue:** Current token storage in sessionStorage is obfuscated but still accessible via JavaScript. An XSS attack or malicious script could extract the token.

**Current State:** Token is base64 encoded in sessionStorage, hidden from localStorage.

**Ideal Solution:** Implement HttpOnly cookies for token storage:
- Backend sets `Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict`
- Frontend cannot access the token via JavaScript
- Token is automatically sent with every request
- Requires CORS configuration changes

**Effort:** ~4-6 hours (backend + frontend changes)

**Risk if not addressed:** Medium - token extraction possible via browser DevTools or XSS attacks.

### 2. "Remember Me" Functionality (Low Priority)
**Issue:** Login page has a "Remember me" checkbox that is currently non-functional (visual only).

**Current State:** Checkbox exists but does nothing. Session always uses sessionStorage (clears on browser close).

**Ideal Solution:** 
- When checked: Store session in localStorage (persists across browser sessions)
- When unchecked: Use sessionStorage (current behavior - clears on close)
- Consider security implications of persistent sessions

**Effort:** ~1-2 hours

**Risk if not addressed:** Low - confusing UX, users may expect it to work.

### 3. NFR Implementation (Medium-High Priority)
**Issue:** Application needs enterprise-grade Non-Functional Requirements for production readiness.

**Reference Document:** `Documents/NFR_IMPLEMENTATION_PLAN.md`  
**Assessment Document:** `Documents/NFR_ASSESSMENT.md`

**Summary of Required Improvements:**

| Category | Priority | Items | Effort |
|----------|----------|-------|--------|
| **Security** | Critical | Environment variables, Input validation, CORS, Rate limiting, Security headers | 6-8h |
| **Resilience** | High | Error boundaries, Health endpoint, Retry logic, Global error handler | 5-6h |
| **Observability** | High | Structured logging, Sentry error tracking, API metrics, Web vitals | 4-5h |
| **Availability** | High | PM2 process management, Database backups, Uptime monitoring, Graceful shutdown | 4-5h |
| **Performance** | Medium | Code splitting, API caching, Database indexing, Pagination | 5-6h |
| **Scalability** | Medium | PostgreSQL migration, Redis cache, Horizontal scaling prep | 8-10h |

**Quick Wins (Implement First):**
- [ ] Environment variables for secrets (1h)
- [ ] React Error Boundaries (2h)
- [ ] Health endpoint `/api/health` (1h)
- [ ] CORS configuration (1h)
- [ ] Rate limiting (2h)
- [ ] PM2 process management (1h)

**Total Quick Wins Effort:** ~8 hours

**Full NFR Implementation Effort:** ~32-40 hours

**Risk if not addressed:**
- **Security:** High - vulnerable to attacks
- **Resilience:** Medium - app crashes on errors
- **Observability:** Medium - no visibility into production issues
- **Availability:** Medium - manual recovery needed on failures
- **Performance:** Low - slow for large datasets
- **Scalability:** Low - limited growth capacity

**Recommendation:** Implement Quick Wins before production deployment, full NFR implementation in subsequent sprints.

---

**Document Version:** 1.2  
**Created:** November 26, 2025  
**Last Updated:** November 26, 2025  
**Author:** Development Team
