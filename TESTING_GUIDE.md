# Phase 1 Testing Guide

**Frontend URL:** http://localhost:5173
**Backend URL:** http://localhost:3001/api
**Date:** November 29, 2025

---

## ✅ Completed Migration Summary

### Backend APIs Created
- ✅ **22 Invoice endpoints** (CRUD, payments, status, alerts, stats)
- ✅ **9 Customer endpoints** (CRUD, search, analytics)
- ✅ **Authentication** (login, register, JWT tokens)
- ✅ **Multi-tenant & Branch support** (automatic filtering)

### Frontend Stores Migrated
- ✅ **useInvoiceStore.ts** - 6 operations migrated
- ✅ **useEnhancedInvoiceStore.ts** - 28 operations migrated
- ✅ **useCustomerStore.ts** - 4 operations migrated

**Total:** 38 IndexedDB operations replaced with REST API calls! 🚀

---

## 🧪 Testing Checklist

### 1. Authentication (PRIORITY: HIGH)
- [ ] **Login**
  - Navigate to login page
  - Use test credentials: `user@example.com` / `password`
  - Verify token is stored in browser
  - Check that dashboard loads after login
  
- [ ] **Token Persistence**
  - Refresh the page
  - Verify you remain logged in
  - Check Authorization header in Network tab

### 2. Customer Management (PRIORITY: HIGH)
- [ ] **View Customers**
  - Navigate to Customers page
  - Verify customers load from API
  - Check Network tab for `GET /api/customers` call
  
- [ ] **Add Customer**
  - Click "Add Customer" button
  - Fill in customer details:
    - Name: "Test Customer"
    - Email: "test@customer.com"
    - Phone: "9876543210"
  - Submit form
  - Verify `POST /api/customers` call in Network tab
  - Check customer appears in list
  
- [ ] **Edit Customer**
  - Click edit on a customer
  - Update phone number
  - Save changes
  - Verify `PUT /api/customers/:id` call
  
- [ ] **Delete Customer**
  - Click delete on a customer
  - Confirm deletion
  - Verify `DELETE /api/customers/:id` call
  - Check customer removed from list
  
- [ ] **Search Customers**
  - Type in search box
  - Verify real-time filtering works

### 3. Invoice Management (PRIORITY: HIGH)
- [ ] **View Invoices**
  - Navigate to Invoices/Billing page
  - Verify invoices load from API
  - Check Network tab for `GET /api/invoices` call
  
- [ ] **Create Invoice**
  - Click "Create Invoice" button
  - Select customer (should load from API)
  - Add invoice items:
    - Item 1: "Product A", Qty: 2, Rate: 100
    - Item 2: "Product B", Qty: 1, Rate: 150
  - Select tax rate (should load from API)
  - Add notes
  - Submit invoice
  - Verify `POST /api/invoices` call in Network tab
  - Check invoice appears in list
  
- [ ] **View Invoice Details**
  - Click on an invoice to view details
  - Verify all fields display correctly
  - Check invoice number, customer, items, amounts
  
- [ ] **Update Invoice**
  - Edit an invoice
  - Update notes or items
  - Save changes
  - Verify `PUT /api/invoices/:id` call
  
- [ ] **Delete Invoice**
  - Delete an invoice
  - Verify `DELETE /api/invoices/:id` call
  - Check invoice removed from list

### 4. Payment Management (PRIORITY: HIGH)
- [ ] **Add Payment to Invoice**
  - Open an unpaid invoice
  - Click "Add Payment" or "Mark as Paid"
  - Enter payment details:
    - Amount: (full or partial)
    - Method: "UPI"
    - Reference: "UPI-TEST-123"
  - Submit payment
  - Verify `POST /api/invoices/:id/payments` call
  - Check invoice status updates (partial/paid)
  - Verify paidAmount and outstandingAmount update
  
- [ ] **View Payments**
  - Navigate to payments section
  - Verify all payments load from API
  - Check `GET /api/invoices/payments/all` call
  
- [ ] **Update Payment**
  - Edit a payment record
  - Update amount or reference
  - Verify `PUT /api/invoices/payments/:id` call
  
- [ ] **Delete Payment**
  - Delete a payment
  - Verify `DELETE /api/invoices/payments/:id` call
  - Check invoice amounts revert correctly

### 5. Invoice Status Management (PRIORITY: MEDIUM)
- [ ] **Mark as Paid**
  - Select an invoice
  - Click "Mark as Paid"
  - Verify status changes to "paid"
  - Check `PATCH /api/invoices/:id/status` call
  
- [ ] **Mark as Overdue**
  - Change invoice status to overdue
  - Verify status updates
  
- [ ] **Mark as Cancelled**
  - Cancel an invoice
  - Verify status changes

### 6. Tax Rates & Templates (PRIORITY: MEDIUM)
- [ ] **View Tax Rates**
  - Navigate to Settings > Tax Rates
  - Verify tax rates load from API
  - Check `GET /api/invoices/meta/tax-rates` call
  
- [ ] **Add Tax Rate**
  - Click "Add Tax Rate"
  - Enter:
    - Name: "GST 5%"
    - Rate: 5
  - Save
  - Verify `POST /api/invoices/meta/tax-rates` call
  
- [ ] **Edit Tax Rate**
  - Edit a tax rate
  - Verify `PUT /api/invoices/meta/tax-rates/:id` call
  
- [ ] **View Invoice Templates**
  - Navigate to Settings > Invoice Templates
  - Verify templates load from API
  - Check `GET /api/invoices/meta/templates` call

### 7. Analytics & Stats (PRIORITY: MEDIUM)
- [ ] **Invoice Statistics**
  - View dashboard
  - Check invoice stats widget
  - Verify `GET /api/invoices/stats/summary` call
  - Validate displayed numbers
  
- [ ] **Customer Analytics**
  - View customer analytics
  - Check `GET /api/customers/stats/summary` call
  - Verify top customers list
  - Check `GET /api/customers/analytics/top` call

### 8. Alerts & Notifications (PRIORITY: LOW)
- [ ] **Overdue Invoices**
  - Check overdue invoices alert
  - Verify `GET /api/invoices/alerts/overdue` call
  
- [ ] **Recurring Invoices**
  - Check recurring invoices
  - Verify `GET /api/invoices/alerts/recurring` call

### 9. Data Persistence (PRIORITY: HIGH)
- [ ] **Refresh Test**
  - Create an invoice
  - Refresh the browser
  - Verify invoice still appears (loaded from API, not IndexedDB)
  
- [ ] **Logout/Login Test**
  - Create test data (customer + invoice)
  - Logout
  - Login again
  - Verify all data persists
  
- [ ] **Browser DevTools Check**
  - Open DevTools > Application > IndexedDB
  - Verify NO invoice/customer data in IndexedDB
  - All data should come from backend API

### 10. Multi-Branch Support (PRIORITY: LOW)
- [ ] **Branch Filtering**
  - If you have branch selector
  - Switch between branches
  - Verify data filters correctly
  - Check branchId in API requests

### 11. Error Handling (PRIORITY: MEDIUM)
- [ ] **Network Error**
  - Stop backend server
  - Try to create invoice
  - Verify error message displays
  - Start backend server again
  
- [ ] **Validation Errors**
  - Try to submit empty invoice form
  - Verify validation errors display
  
- [ ] **401 Unauthorized**
  - Clear JWT token from localStorage
  - Try to access protected page
  - Verify redirect to login

---

## 🔍 Browser DevTools Checklist

### Network Tab
For each operation, verify:
- ✅ Request URL is correct (`/api/...`)
- ✅ Request method is correct (GET/POST/PUT/DELETE)
- ✅ Authorization header present: `Bearer <token>`
- ✅ Request body (for POST/PUT) is valid JSON
- ✅ Response status is 200/201
- ✅ Response has correct structure: `{ success: true, data: {...} }`

### Console Tab
- ✅ No errors related to `db.invoices`, `db.customers`, `db.payments`
- ✅ Only API-related logs (fetch requests)
- ⚠️ May see TODO warnings for unimplemented features (company settings)

### Application Tab
- ✅ localStorage contains JWT token
- ✅ IndexedDB should NOT contain:
  - `invoices` table/store
  - `customers` table/store
  - `payments` table/store
- ✅ Auth state is preserved

---

## 📊 Expected API Call Patterns

### On Page Load (Dashboard)
```
GET /api/auth/me (verify token)
GET /api/invoices (load invoices)
GET /api/customers (load customers)
GET /api/invoices/stats/summary (load stats)
GET /api/invoices/payments/all (load payments)
```

### Creating Invoice
```
POST /api/invoices
  Body: { invoiceNumber, customerId, items, amounts, ... }
  Response: { success: true, data: { id, ...invoice } }

GET /api/invoices (refresh list)
```

### Adding Payment
```
POST /api/invoices/:id/payments
  Body: { amount, method, reference, ... }
  Response: { success: true, data: { id, ...payment } }

GET /api/invoices (refresh invoices to see updated amounts)
GET /api/invoices/payments/all (refresh payments list)
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find name 'db'"
**Solution:** This should be fixed now. If you see this:
- Check that all stores are migrated
- No direct `db.table.method()` calls should exist
- All should use `apiFetch<T>()` helper

### Issue: "401 Unauthorized"
**Solution:**
- Check JWT token in localStorage
- Token may have expired - try logging in again
- Verify backend is running on port 3001

### Issue: "CORS error"
**Solution:**
- Backend should have CORS enabled
- Check `backend/index.js` has `cors()` middleware
- Verify frontend is on `http://localhost:5173`

### Issue: "Network request failed"
**Solution:**
- Verify backend is running: `npm run start` in `backend/` directory
- Check port 3001 is not blocked
- Verify API base URL in frontend is correct

### Issue: "Empty list after refresh"
**Solution:**
- Check Network tab for API calls
- Verify token is still valid
- Check if data exists in database (use `backend/test_db.js`)

### Issue: "TypeScript errors in store files"
**Solution:**
- All stores should have 0 errors now
- Run `npm run build` to verify
- Check console for specific error details

---

## 🎯 Success Criteria

Phase 1 is considered successful if:

1. ✅ **All CRUD operations work** through API (no IndexedDB)
2. ✅ **Data persists** across browser refreshes
3. ✅ **Authentication works** with JWT tokens
4. ✅ **Multi-tenant filtering** works correctly
5. ✅ **No TypeScript errors** in migrated stores
6. ✅ **Network tab shows** API calls, not IndexedDB operations
7. ✅ **Error handling** displays user-friendly messages
8. ✅ **Loading states** show during API calls

---

## 📝 Test Results Template

Use this to record your test results:

```
## Test Session: [Date/Time]
Tester: [Your Name]
Environment: Dev (localhost)

### Authentication
- [x] Login: PASS
- [x] Token persistence: PASS
- [ ] Logout: FAIL (error message...)

### Customer Management
- [x] View customers: PASS
- [x] Add customer: PASS
- [x] Edit customer: PASS
- [x] Delete customer: PASS

### Invoice Management
- [x] View invoices: PASS
- [x] Create invoice: PASS
- [ ] Update invoice: FAIL (UI not updating...)
- [x] Delete invoice: PASS

### Payment Management
- [x] Add payment: PASS
- [x] Invoice status updates: PASS

### Data Persistence
- [x] Refresh test: PASS
- [x] No IndexedDB data: PASS

### Issues Found
1. [Issue description]
2. [Issue description]
```

---

## 🚀 Next Steps After Testing

1. **Fix any bugs found** during testing
2. **Optimize API calls** (reduce redundant fetches)
3. **Add loading indicators** where missing
4. **Implement error boundaries** for better UX
5. **Add offline support** (Phase 2)
6. **Implement caching strategy** (React Query/SWR)
7. **Add pagination** for large datasets
8. **Implement search/filter** on server-side

---

## 📚 References

- **API Documentation:** `backend/API_DOCUMENTATION.md`
- **Migration Plan:** `Planned implementation/INDEXEDDB_TO_BACKEND_MIGRATION_PLAN.md`
- **Repository Pattern:** See `backend/repositories/` for data access layer
- **Controller Pattern:** See `backend/controllers/` for API endpoints

---

**Happy Testing! 🎉**

Report any issues in the GitHub repository or share test results with the team.
