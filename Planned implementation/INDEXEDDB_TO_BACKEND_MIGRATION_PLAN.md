# IndexedDB to Backend API Migration Plan
## 3-Phase Approach for Centralized Data Management

**Date Created:** November 29, 2025  
**Status:** Planning Phase  
**Goal:** Migrate all browser-based IndexedDB storage to centralized backend APIs for multi-tenant, multi-branch, multi-device support

---

## 📊 Current State Assessment

### ✅ Already Migrated (Reference Implementation):
- **Inventory Management** (`useInventoryStore.ts`)
  - Backend API: ✅ Complete (10 endpoints)
  - Repository: `InventoryRepository.js`
  - Controller: `InventoryController.js`
  - Database Table: `inventory` (002_ai_insights_tables.sql)

### ⚠️ Needs Migration:

#### **IndexedDB Tables Currently in Use:**
1. **invoices** - Core billing functionality
2. **payments** - Payment tracking
3. **customers** - Customer management
4. **taxRates** - Tax configuration
5. **invoiceTemplates** - Invoice customization
6. **tasks** - Task management
7. **staff** - Staff/user management
8. **feedback** - Customer feedback
9. **aiInsights** - AI-generated insights (hybrid)
10. **companySettings** - Business configuration

#### **Backend Tables Already Exist:**
- ✅ `invoices` (basic schema in 001_init.sql)
- ✅ `customers` (in 002_ai_insights_tables.sql)
- ✅ `invoice_items` (in 002_ai_insights_tables.sql)
- ✅ `feedback` (in 002_ai_insights_tables.sql)
- ✅ `customer_payments` (in 003_comprehensive_ai_insights.sql)
- ✅ `staff_activities` (in 003_comprehensive_ai_insights.sql)

#### **Backend APIs Already Exist:**
- ✅ `InvoiceController.js` (basic - only 3 endpoints)
- ✅ `InvoiceRepository.js` (basic - only create/read)

---

## 🎯 3-Phase Migration Strategy

---

## 📦 **PHASE 1: Critical Business Data** (HIGH PRIORITY)
**Timeline:** Week 1-2  
**Goal:** Migrate core revenue-generating features

### 1.1 Invoice Management System
**Complexity:** HIGH  
**Impact:** CRITICAL  

#### Current State:
- **Frontend Stores:**
  - `useInvoiceStore.ts` - 6 IndexedDB operations
  - `useEnhancedInvoiceStore.ts` - 20+ IndexedDB operations
- **IndexedDB Tables:** 
  - `invoices` (comprehensive schema with 30+ fields)
  - `payments` (8 fields)
  - `taxRates` (6 fields)
  - `invoiceTemplates` (7 fields)

#### Backend Requirements:

**A. Database Schema Enhancement:**
```sql
-- Expand invoices table (001_init.sql has basic schema)
ALTER TABLE invoices ADD COLUMN:
- invoice_number TEXT UNIQUE
- customer_email TEXT
- customer_address TEXT
- customer_phone TEXT
- issue_date DATETIME
- due_date DATETIME
- subtotal REAL
- discount_type TEXT
- discount_value REAL
- discount_amount REAL
- tax_rate REAL
- tax_amount REAL
- total_amount REAL
- paid_amount REAL
- outstanding_amount REAL
- payment_terms TEXT
- currency TEXT
- is_recurring BOOLEAN
- recurring_frequency TEXT
- notes TEXT
- terms TEXT
- po_number TEXT
- sent_at DATETIME
- updated_at DATETIME

-- New tables needed:
CREATE TABLE tax_rates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  branch_id TEXT,
  name TEXT,
  rate REAL,
  description TEXT,
  is_default BOOLEAN,
  is_active BOOLEAN,
  created_at DATETIME
);

CREATE TABLE invoice_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT,
  description TEXT,
  layout TEXT,
  color_scheme TEXT,
  is_default BOOLEAN,
  custom_fields TEXT, -- JSON
  created_at DATETIME
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  tenant_id TEXT,
  branch_id TEXT,
  amount REAL,
  method TEXT,
  reference TEXT,
  notes TEXT,
  payment_date DATETIME,
  created_at DATETIME,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

**B. Repository Methods Needed:**
```javascript
// InvoiceRepository.js - Expand from current 3 methods to 15+
class InvoiceRepository {
  // Existing (basic):
  - createInvoice()
  - getInvoicesByBranch()
  - getInvoicesByTenant()
  
  // Add:
  - findById(id)
  - findByInvoiceNumber(invoiceNumber)
  - updateInvoice(id, updates)
  - deleteInvoice(id)
  - getInvoiceWithItems(id)
  - getInvoiceStats(tenantId, branchId, filters)
  - getOverdueInvoices(tenantId, branchId)
  - getRecurringInvoices(tenantId)
  - updateInvoiceStatus(id, status)
  
  // Payments:
  - createPayment(paymentData)
  - getPaymentsByInvoice(invoiceId)
  - getPaymentsByBranch(branchId, filters)
  - updatePayment(id, updates)
  - deletePayment(id)
  
  // Tax Rates:
  - getTaxRates(tenantId)
  - createTaxRate(data)
  - updateTaxRate(id, updates)
  
  // Templates:
  - getTemplates(tenantId)
  - createTemplate(data)
  - updateTemplate(id, updates)
}
```

**C. Controller Endpoints Needed:**
```javascript
// InvoiceController.js - Expand from 3 endpoints to 20+
router.post('/', authenticateToken, createInvoice)
router.get('/', authenticateToken, getInvoices) // with filters
router.get('/:id', authenticateToken, getInvoiceById)
router.put('/:id', authenticateToken, updateInvoice)
router.delete('/:id', authenticateToken, deleteInvoice)
router.get('/stats', authenticateToken, getInvoiceStats)
router.get('/overdue', authenticateToken, getOverdueInvoices)
router.get('/recurring', authenticateToken, getRecurringInvoices)
router.patch('/:id/status', authenticateToken, updateStatus)

// Payments
router.post('/:id/payments', authenticateToken, addPayment)
router.get('/:id/payments', authenticateToken, getInvoicePayments)
router.get('/payments', authenticateToken, getAllPayments)
router.put('/payments/:paymentId', authenticateToken, updatePayment)
router.delete('/payments/:paymentId', authenticateToken, deletePayment)

// Tax Rates
router.get('/meta/tax-rates', authenticateToken, getTaxRates)
router.post('/meta/tax-rates', authenticateToken, createTaxRate)

// Templates
router.get('/meta/templates', authenticateToken, getTemplates)
router.post('/meta/templates', authenticateToken, createTemplate)
```

**D. Frontend Store Migration:**
- Update `useInvoiceStore.ts` (replace 6 IndexedDB operations)
- Update `useEnhancedInvoiceStore.ts` (replace 20+ IndexedDB operations)
- Add API integration using `apiService.ts`
- Implement proper error handling and loading states

---

### 1.2 Customer Management
**Complexity:** MEDIUM  
**Impact:** HIGH  

#### Current State:
- **Frontend Store:** `useCustomerStore.ts` - 4 IndexedDB operations
- **IndexedDB Table:** `customers` (25+ fields)
- **Backend Table:** ✅ Exists in `002_ai_insights_tables.sql`

#### Backend Requirements:

**A. Database Schema Review:**
```sql
-- Review existing customers table in 002_ai_insights_tables.sql
-- Ensure it matches IndexedDB schema:
- email, phone, address fields
- gstNumber, panNumber (India-specific)
- type, category, tags
- totalSpent, totalOrders, averageOrderValue
- status, preferredPaymentMethod
- Multi-tenant/branch support
```

**B. Repository Creation:**
```javascript
// NEW FILE: backend/repositories/CustomerRepository.js
class CustomerRepository {
  - findAll(tenantId, branchId, filters)
  - findById(id)
  - findByEmail(email)
  - findByPhone(phone)
  - create(customerData)
  - update(id, updates)
  - delete(id)
  - getCustomerStats(customerId)
  - getTopCustomers(tenantId, limit)
  - searchCustomers(tenantId, branchId, query)
  - updateSpentMetrics(customerId)
}
```

**C. Controller Creation:**
```javascript
// NEW FILE: backend/controllers/CustomerController.js
router.get('/', authenticateToken, getCustomers)
router.post('/', authenticateToken, createCustomer)
router.get('/:id', authenticateToken, getCustomerById)
router.put('/:id', authenticateToken, updateCustomer)
router.delete('/:id', authenticateToken, deleteCustomer)
router.get('/:id/stats', authenticateToken, getCustomerStats)
router.get('/search', authenticateToken, searchCustomers)
router.get('/top', authenticateToken, getTopCustomers)
```

**D. Frontend Store Migration:**
- Update `useCustomerStore.ts` (replace 4 IndexedDB operations)
- Link with invoice creation (foreign key relationship)

---

### 1.3 Company Settings
**Complexity:** LOW  
**Impact:** HIGH  

#### Current State:
- **IndexedDB Table:** `companySettings` (30+ fields including nested objects)
- **Backend:** ❌ No table exists

#### Backend Requirements:

**A. Database Schema Creation:**
```sql
CREATE TABLE company_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT UNIQUE,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  tax_id TEXT,
  gst_number TEXT,
  logo_url TEXT,
  default_currency TEXT,
  default_tax_rate REAL,
  invoice_prefix TEXT,
  invoice_start_number INTEGER,
  payment_terms TEXT,
  bank_details TEXT, -- JSON
  primary_color TEXT,
  secondary_color TEXT,
  communication_settings TEXT, -- JSON
  updated_at DATETIME,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

**B. Full Stack Implementation:**
- Create `CompanySettingsRepository.js`
- Create `CompanySettingsController.js` 
- Create new store or add to `useAuthStore.ts`

---

## 📋 **PHASE 2: Operational Features** (MEDIUM PRIORITY)
**Timeline:** Week 3-4  
**Goal:** Migrate task management, staff management, and operational tools

### 2.1 Task Management System
**Complexity:** MEDIUM  
**Impact:** MEDIUM  

#### Current State:
- **Frontend Store:** `useTaskStore.ts` - 10+ IndexedDB operations
- **IndexedDB Table:** `tasks` (20+ fields)
- **Backend:** ❌ No table exists

#### Backend Requirements:

**A. Database Schema Creation:**
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  branch_id TEXT,
  title TEXT,
  description TEXT,
  assigned_to TEXT, -- user id
  customer_id TEXT,
  invoice_id TEXT,
  type TEXT,
  priority TEXT,
  status TEXT,
  due_date DATETIME,
  completed_date DATETIME,
  estimated_duration INTEGER,
  actual_duration INTEGER,
  attachments TEXT, -- JSON array
  comments TEXT, -- JSON array
  created_at DATETIME,
  updated_at DATETIME,
  created_by TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

**B. Repository Implementation:**
```javascript
// NEW FILE: backend/repositories/TaskRepository.js
class TaskRepository {
  - findAll(tenantId, branchId, filters)
  - findByAssignee(userId)
  - findByCustomer(customerId)
  - findOverdue(tenantId)
  - create(taskData)
  - update(id, updates)
  - delete(id)
  - updateStatus(id, status)
  - addComment(taskId, comment)
  - getTaskStats(userId, branchId)
}
```

**C. Controller Implementation:**
```javascript
// NEW FILE: backend/controllers/TaskController.js
router.get('/', authenticateToken, getTasks)
router.post('/', authenticateToken, createTask)
router.get('/my-tasks', authenticateToken, getMyTasks)
router.get('/overdue', authenticateToken, getOverdueTasks)
router.get('/:id', authenticateToken, getTaskById)
router.put('/:id', authenticateToken, updateTask)
router.delete('/:id', authenticateToken, deleteTask)
router.patch('/:id/status', authenticateToken, updateTaskStatus)
router.post('/:id/comments', authenticateToken, addComment)
router.get('/stats', authenticateToken, getTaskStats)
```

**D. Frontend Store Migration:**
- Update `useTaskStore.ts` (replace 10+ IndexedDB operations)

---

### 2.2 Staff Management
**Complexity:** MEDIUM  
**Impact:** MEDIUM  

#### Current State:
- **Frontend Stores:**
  - `useStaffStore.ts` - 4 operations
  - `useTaskStore.ts` - Also manages staff (duplicate?)
- **IndexedDB Table:** `staff` (15+ fields)
- **Backend Table:** ✅ `users` exists, `staff_activities` exists

#### Backend Requirements:

**A. Database Schema Review:**
```sql
-- Review existing users table (001_init.sql)
-- May need to add fields:
ALTER TABLE users ADD COLUMN:
- name TEXT
- email TEXT
- phone TEXT
- profile_picture TEXT
- permissions TEXT -- JSON
- department TEXT
- hire_date DATETIME
- salary REAL
- is_active BOOLEAN
- last_login DATETIME
```

**B. Repository Enhancement:**
```javascript
// ENHANCE: backend/repositories/UserRepository.js
class UserRepository {
  // Add staff-specific methods:
  - getActiveStaff(tenantId, branchId)
  - getStaffByRole(tenantId, role)
  - updatePermissions(userId, permissions)
  - getStaffActivities(userId, dateRange)
  - recordActivity(userId, activityData)
  - updateLastLogin(userId)
}
```

**C. Controller Enhancement:**
```javascript
// ENHANCE: backend/controllers/UserController.js
router.get('/staff', authenticateToken, getStaff)
router.get('/staff/:id', authenticateToken, getStaffById)
router.put('/staff/:id', authenticateToken, updateStaff)
router.patch('/staff/:id/permissions', authenticateToken, updatePermissions)
router.get('/staff/:id/activities', authenticateToken, getStaffActivities)
```

**D. Frontend Store Migration:**
- Update `useStaffStore.ts` (replace 4 IndexedDB operations)
- Remove staff management from `useTaskStore.ts` (consolidate)

---

## 🔄 **PHASE 3: Supporting Features** (LOW PRIORITY)
**Timeline:** Week 5  
**Goal:** Migrate remaining features for complete centralization

### 3.1 Feedback Management
**Complexity:** LOW  
**Impact:** LOW  

#### Current State:
- **Frontend Store:** `useFeedbackStore.ts` - 4 IndexedDB operations
- **IndexedDB Table:** `feedback` (15+ fields)
- **Backend Table:** ✅ Exists in `002_ai_insights_tables.sql`

#### Backend Requirements:

**A. Repository Creation:**
```javascript
// NEW FILE: backend/repositories/FeedbackRepository.js
class FeedbackRepository {
  - findAll(tenantId, branchId, filters)
  - findByCustomer(customerId)
  - findByRating(rating)
  - findBySentiment(sentiment)
  - create(feedbackData)
  - update(id, updates)
  - delete(id)
  - markAsResponded(id, responseNote)
  - getFeedbackStats(tenantId, branchId)
}
```

**B. Controller Creation:**
```javascript
// NEW FILE: backend/controllers/FeedbackController.js
router.get('/', authenticateToken, getFeedback)
router.post('/', authenticateToken, createFeedback)
router.get('/:id', authenticateToken, getFeedbackById)
router.put('/:id', authenticateToken, updateFeedback)
router.delete('/:id', authenticateToken, deleteFeedback)
router.patch('/:id/respond', authenticateToken, markAsResponded)
router.get('/stats', authenticateToken, getFeedbackStats)
router.get('/by-sentiment/:sentiment', authenticateToken, getBySentiment)
```

**C. Frontend Store Migration:**
- Update `useFeedbackStore.ts` (replace 4 IndexedDB operations)

---

### 3.2 AI Insights Optimization
**Complexity:** LOW  
**Impact:** LOW  

#### Current State:
- **Frontend Store:** `useAIStore.ts` - Hybrid (backend API + IndexedDB cache)
- **Backend API:** ✅ Already using backend for generation
- **IndexedDB Usage:** Local caching + reading other tables

#### Optimization:

**A. Remove IndexedDB Dependencies:**
- Stop reading from `db.inventoryItems` (use Inventory API)
- Stop reading from `db.customers` (use Customer API)
- Stop reading from `db.invoices` (use Invoice API)

**B. Implement Backend Caching:**
```sql
-- Use existing ai_insights_cache table in 003_comprehensive_ai_insights.sql
-- Store insights on backend instead of browser
```

**C. Frontend Store Update:**
- Remove all `db.*` operations from `useAIStore.ts`
- Use only backend API calls
- Implement proper cache invalidation

---

## 📝 Implementation Checklist

### Pre-Migration Steps:
- [ ] Backup current SQLite database
- [ ] Export IndexedDB data for migration script
- [ ] Create database migration scripts for new tables
- [ ] Set up API testing framework

### Phase 1 Tasks:
- [ ] 1.1.A - Enhance invoices table schema
- [ ] 1.1.A - Create tax_rates table
- [ ] 1.1.A - Create invoice_templates table  
- [ ] 1.1.A - Create payments table
- [ ] 1.1.B - Expand InvoiceRepository (15+ methods)
- [ ] 1.1.C - Expand InvoiceController (20+ endpoints)
- [ ] 1.1.D - Migrate useInvoiceStore.ts
- [ ] 1.1.D - Migrate useEnhancedInvoiceStore.ts
- [ ] 1.2.B - Create CustomerRepository
- [ ] 1.2.C - Create CustomerController
- [ ] 1.2.D - Migrate useCustomerStore.ts
- [ ] 1.3.A - Create company_settings table
- [ ] 1.3.B - Create CompanySettingsRepository
- [ ] 1.3.B - Create CompanySettingsController
- [ ] 1.3.B - Create/update frontend store
- [ ] Test Phase 1 - Invoice creation, payment tracking, customer management

### Phase 2 Tasks:
- [ ] 2.1.A - Create tasks table
- [ ] 2.1.B - Create TaskRepository
- [ ] 2.1.C - Create TaskController
- [ ] 2.1.D - Migrate useTaskStore.ts
- [ ] 2.2.A - Enhance users table schema
- [ ] 2.2.B - Enhance UserRepository
- [ ] 2.2.C - Enhance UserController
- [ ] 2.2.D - Migrate useStaffStore.ts
- [ ] 2.2.D - Remove staff management from useTaskStore.ts
- [ ] Test Phase 2 - Task assignment, staff management

### Phase 3 Tasks:
- [ ] 3.1.A - Create FeedbackRepository
- [ ] 3.1.B - Create FeedbackController
- [ ] 3.1.C - Migrate useFeedbackStore.ts
- [ ] 3.2.A - Remove IndexedDB dependencies from useAIStore.ts
- [ ] 3.2.B - Implement backend caching
- [ ] 3.2.C - Update useAIStore.ts to use only APIs
- [ ] Test Phase 3 - Feedback collection, AI insights generation

### Post-Migration Steps:
- [ ] Data migration script (IndexedDB → SQLite)
- [ ] Remove Dexie dependency from package.json
- [ ] Delete src/lib/database.ts
- [ ] Update documentation
- [ ] Performance testing
- [ ] User acceptance testing

---

## 🔧 Technical Implementation Guidelines

### 1. Database Migrations:
```javascript
// backend/migrations/004_invoice_enhancement.sql
// backend/migrations/005_customer_enhancement.sql
// backend/migrations/006_company_settings.sql
// backend/migrations/007_tasks_table.sql
// backend/migrations/008_users_enhancement.sql
```

### 2. Repository Pattern:
- Use `getDb()` helper from `models/db.js`
- Implement multi-tenant/branch filtering in all queries
- Use parameterized queries to prevent SQL injection
- Return camelCase properties (use column aliases)

### 3. Controller Pattern:
- Use `authenticateToken` middleware on all routes
- Extract `tenantId`, `branchId` from JWT token
- Implement role-based access control
- Return consistent response format: `{ success, data, error }`

### 4. Frontend Store Pattern:
- Use `apiService.ts` for all API calls
- Implement `getAuthHeaders()` for JWT token
- Use `getBranchContext()` for filtering
- Add loading states and error handling
- Keep interface types in sync with backend

### 5. API Response Format:
```javascript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message" }

// List with pagination
{ 
  success: true, 
  data: [...],
  pagination: { page, limit, total }
}
```

---

## 🎯 Success Metrics

### Phase 1:
- [ ] All invoice CRUD operations working via API
- [ ] Payment tracking functional
- [ ] Customer management operational
- [ ] Zero IndexedDB usage in invoice/customer stores
- [ ] Data persists across browser sessions/devices

### Phase 2:
- [ ] Task assignment working across team
- [ ] Staff management centralized
- [ ] No IndexedDB usage in task/staff stores
- [ ] Multi-user collaboration functional

### Phase 3:
- [ ] Feedback collection working via API
- [ ] AI insights fully backend-driven
- [ ] Complete removal of Dexie/IndexedDB
- [ ] All data centralized in SQLite

---

## ⚠️ Risk Mitigation

### Data Loss Prevention:
1. Create IndexedDB export tool before migration
2. Keep old stores as fallback during transition
3. Implement data validation at API level
4. Run parallel testing (IndexedDB vs API)

### Performance Considerations:
1. Implement caching strategy for frequently accessed data
2. Use database indexes on foreign keys
3. Paginate large result sets
4. Consider lazy loading for related data

### Rollback Plan:
1. Keep IndexedDB code commented out (not deleted)
2. Feature flags to toggle between IndexedDB/API
3. Database backup before each phase
4. Version control checkpoints after each phase

---

## 📚 Reference Implementation

**Inventory Migration** (Already Complete):
- Backend: `backend/repositories/InventoryRepository.js`
- Controller: `backend/controllers/InventoryController.js`
- Frontend: `src/store/useInventoryStore.ts`
- Migration Pattern: Direct replacement of IndexedDB with API calls
- Result: 10 API endpoints, zero IndexedDB dependencies

**Use this as template for all other migrations!**

---

## 📞 Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize phases** based on business needs
3. **Assign developers** to each phase
4. **Set timeline** for each phase
5. **Begin Phase 1** with Invoice Management

---

## 📅 Estimated Timeline

- **Phase 1:** 2 weeks (Invoice, Customer, Company Settings)
- **Phase 2:** 1.5 weeks (Tasks, Staff)
- **Phase 3:** 0.5 week (Feedback, AI Insights)
- **Testing & Refinement:** 1 week
- **Total:** ~5 weeks

---

**Document Status:** ✅ Complete - Ready for Review  
**Last Updated:** November 29, 2025
