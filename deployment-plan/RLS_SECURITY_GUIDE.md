# Row Level Security (RLS) - Complete Reference

## 🔒 What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL feature that allows you to control which rows users can access in database tables. It provides an additional layer of security beyond application-level authorization.

---

## 🎯 Why Enable RLS?

### Security Benefits
✅ **Tenant Isolation**: Users can only access their own tenant's data  
✅ **Defense in Depth**: Protects even if application logic fails  
✅ **SQL Injection Protection**: Prevents unauthorized data access  
✅ **Compliance**: Helps meet data privacy regulations  
✅ **Admin Controls**: Restricts sensitive operations to admin roles  

### Without RLS
```sql
-- Without RLS, any authenticated user could potentially run:
SELECT * FROM invoices;  -- Returns ALL invoices from ALL tenants ❌
```

### With RLS
```sql
-- With RLS, the same query automatically filters by tenant:
SELECT * FROM invoices;  -- Returns ONLY current tenant's invoices ✅
```

---

## 📋 RLS Policies Included in Migration

The `supabase_migration.sql` file includes comprehensive RLS policies for all tables:

### 1. Tenants Table
```sql
-- Users can only view their own tenant
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = auth.tenant_id());

-- Users can update their own tenant
CREATE POLICY "Users can update their own tenant"
  ON tenants FOR UPDATE
  USING (id = auth.tenant_id());
```

### 2. Customers Table
```sql
-- View customers
CREATE POLICY "Users can view customers in their tenant"
  ON customers FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Insert customers
CREATE POLICY "Users can insert customers in their tenant"
  ON customers FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Update customers
CREATE POLICY "Users can update customers in their tenant"
  ON customers FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Delete customers
CREATE POLICY "Users can delete customers in their tenant"
  ON customers FOR DELETE
  USING (tenant_id = auth.tenant_id());
```

### 3. Invoices Table (with Admin Restrictions)
```sql
-- View invoices
CREATE POLICY "Users can view invoices in their tenant"
  ON invoices FOR SELECT
  USING (tenant_id = auth.tenant_id());

-- Create invoices
CREATE POLICY "Users can insert invoices in their tenant"
  ON invoices FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- Update invoices
CREATE POLICY "Users can update invoices in their tenant"
  ON invoices FOR UPDATE
  USING (tenant_id = auth.tenant_id());

-- Delete invoices (ADMINS ONLY)
CREATE POLICY "Admins can delete invoices in their tenant"
  ON invoices FOR DELETE
  USING (
    tenant_id = auth.tenant_id() 
    AND (
      SELECT role FROM users 
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid
    ) IN ('owner', 'admin')
  );
```

### 4. Payments, Inventory, Tax Rates, Templates
All follow similar patterns with full CRUD policies filtered by `tenant_id`.

---

## 🔧 How RLS Works with Your Backend

### JWT Token Structure

Your backend must include `tenant_id` in the JWT token:

```javascript
// Backend: controllers/AuthController.js
const token = jwt.sign({
  userId: user.id,
  tenantId: user.tenantId,  // ← Required for RLS
  branchId: user.branchId,
  role: user.role,
  email: user.email
}, process.env.JWT_SECRET);
```

### Helper Function

The migration includes a helper function to extract `tenant_id`:

```sql
CREATE OR REPLACE FUNCTION auth.tenant_id() 
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    current_setting('app.tenant_id', true)
  )::uuid;
$$ LANGUAGE SQL STABLE;
```

This function:
1. Tries to get `tenant_id` from JWT claims
2. Falls back to `app.tenant_id` setting (for service role)
3. Returns NULL if neither exists

---

## 🧪 Testing RLS

### 1. Check RLS Status

```sql
-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected output: rls_enabled = true for all tables
```

### 2. View All Policies

```sql
-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Should show 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
```

### 3. Test Tenant Isolation

```sql
-- Set tenant context manually (simulates JWT)
SET app.tenant_id = '7413d201-a37d-4af5-bbde-74bf24cb17f3';

-- Query should only return data for this tenant
SELECT COUNT(*) FROM invoices;
SELECT COUNT(*) FROM customers;

-- Try to access another tenant's data (should return 0)
SELECT * FROM invoices WHERE tenant_id != '7413d201-a37d-4af5-bbde-74bf24cb17f3';

-- Reset context
RESET app.tenant_id;
```

### 4. Test Admin Restrictions

```sql
-- Regular user trying to delete invoice (should fail)
DELETE FROM invoices WHERE id = 'some-invoice-id';
-- ERROR: new row violates row-level security policy

-- Admin user with proper JWT claims (should succeed)
-- This requires proper JWT with role='owner' or role='admin'
```

---

## 🚨 Important Security Notes

### DO's ✅

1. **Always include tenant_id in JWT**
   ```javascript
   const token = jwt.sign({ userId, tenantId, role }, secret);
   ```

2. **Test RLS policies thoroughly**
   ```sql
   -- Create test users in different tenants
   -- Verify they can't access each other's data
   ```

3. **Use service role carefully**
   ```javascript
   // Only use service role key for admin operations
   // Never expose in frontend code
   const { data } = await supabase.auth.admin.createUser({...});
   ```

4. **Monitor policy violations**
   ```sql
   -- Enable logging for RLS violations
   ALTER DATABASE postgres SET log_row_security = on;
   ```

### DON'Ts ❌

1. **Never disable RLS in production**
   ```sql
   -- DANGER: Don't do this in production!
   ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
   ```

2. **Don't use wildcard policies**
   ```sql
   -- BAD: Allows access to all data
   CREATE POLICY "Allow all" ON invoices FOR ALL USING (true);
   ```

3. **Don't hard-code tenant IDs**
   ```javascript
   // BAD: Hard-coded tenant ID
   const query = supabase.from('invoices').eq('tenant_id', 'abc-123');
   
   // GOOD: Let RLS handle filtering automatically
   const query = supabase.from('invoices').select('*');
   ```

4. **Don't expose service role key**
   ```javascript
   // DANGER: Never use in frontend
   const supabase = createClient(url, SERVICE_ROLE_KEY);
   
   // SAFE: Use anon key in frontend
   const supabase = createClient(url, ANON_KEY);
   ```

---

## 🔄 Modifying RLS Policies

### Add a New Policy

```sql
-- Example: Allow users to view only their own created invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  USING (
    tenant_id = auth.tenant_id() 
    AND created_by = (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid
  );
```

### Update Existing Policy

```sql
-- Drop old policy
DROP POLICY "Users can view invoices in their tenant" ON invoices;

-- Create new policy with different logic
CREATE POLICY "Users can view invoices in their tenant"
  ON invoices
  FOR SELECT
  USING (
    tenant_id = auth.tenant_id() 
    AND (status != 'draft' OR created_by = current_user_id())
  );
```

### Temporarily Disable for Debugging

```sql
-- Disable RLS on one table (development only!)
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- Run your debug queries
SELECT * FROM invoices;

-- Re-enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

---

## 🐛 Troubleshooting RLS Issues

### Issue 1: No Data Returned (Empty Results)

**Symptom:**
```javascript
const { data } = await supabase.from('invoices').select('*');
console.log(data); // []  ← Empty even though data exists
```

**Causes:**
1. JWT doesn't include `tenant_id`
2. `tenant_id` in JWT doesn't match data
3. RLS policy is too restrictive

**Solution:**
```sql
-- Check JWT claims
SELECT current_setting('request.jwt.claims', true)::json;

-- Temporarily disable RLS to verify data exists
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
SELECT COUNT(*) FROM invoices;  -- Should return rows
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Check policy logic
SELECT * FROM pg_policies WHERE tablename = 'invoices';
```

### Issue 2: Policy Violation Error

**Symptom:**
```
ERROR: new row violates row-level security policy for table "invoices"
```

**Cause:**
- Trying to INSERT/UPDATE with wrong `tenant_id`
- Missing WITH CHECK clause in policy

**Solution:**
```sql
-- Verify INSERT policy has WITH CHECK
DROP POLICY IF EXISTS "Users can insert invoices in their tenant" ON invoices;

CREATE POLICY "Users can insert invoices in their tenant"
  ON invoices
  FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());  -- ← Must include WITH CHECK
```

### Issue 3: Admin Can't Delete

**Symptom:**
```
ERROR: permission denied for table invoices
```

**Cause:**
- Policy checks role from JWT but user role isn't included
- Role check logic is wrong

**Solution:**
```javascript
// Ensure JWT includes role
const token = jwt.sign({
  userId: user.id,
  tenantId: user.tenantId,
  role: user.role  // ← Must include role
}, secret);
```

```sql
-- Verify policy checks role correctly
SELECT qual, with_check 
FROM pg_policies 
WHERE policyname LIKE '%delete%' AND tablename = 'invoices';
```

---

## 📊 Performance Considerations

### RLS Performance Impact

**Minimal Impact:**
- RLS policies are evaluated at query planning time
- Well-indexed tenant_id columns = fast filtering
- Supabase uses efficient policy evaluation

**Optimization Tips:**

1. **Ensure indexes exist** (already in migration):
   ```sql
   CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
   ```

2. **Use simple policies**:
   ```sql
   -- GOOD: Simple tenant check
   USING (tenant_id = auth.tenant_id())
   
   -- SLOWER: Complex nested queries
   USING (tenant_id IN (SELECT id FROM tenants WHERE ...))
   ```

3. **Monitor query performance**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM invoices;
   -- Look for "Index Scan" not "Seq Scan"
   ```

---

## 🎓 Advanced RLS Patterns

### Pattern 1: Branch-Level Isolation

```sql
-- Users can only see invoices from their branch
CREATE POLICY "Users can view branch invoices"
  ON invoices
  FOR SELECT
  USING (
    tenant_id = auth.tenant_id() 
    AND branch_id = (
      SELECT branch_id FROM users 
      WHERE id = current_user_id()
    )
  );
```

### Pattern 2: Time-Based Access

```sql
-- Users can only edit recent invoices (within 30 days)
CREATE POLICY "Users can edit recent invoices"
  ON invoices
  FOR UPDATE
  USING (
    tenant_id = auth.tenant_id() 
    AND created_at > NOW() - INTERVAL '30 days'
  );
```

### Pattern 3: Status-Based Permissions

```sql
-- Users can delete only draft invoices
CREATE POLICY "Users can delete draft invoices"
  ON invoices
  FOR DELETE
  USING (
    tenant_id = auth.tenant_id() 
    AND status = 'draft'
  );
```

### Pattern 4: Owner-Based Access

```sql
-- Users can only edit invoices they created
CREATE POLICY "Users can edit own invoices"
  ON invoices
  FOR UPDATE
  USING (
    tenant_id = auth.tenant_id() 
    AND created_by = current_user_id()
  );
```

---

## ✅ RLS Checklist

### Initial Setup
- [ ] Run `supabase_migration.sql` (includes RLS)
- [ ] Verify RLS enabled on all tables
- [ ] Check all policies created successfully
- [ ] Test with sample data

### Backend Integration
- [ ] JWT includes `tenant_id` in claims
- [ ] JWT includes `user_id` in claims  
- [ ] JWT includes `role` for admin checks
- [ ] Service role key stored securely (backend only)
- [ ] Anon key used in frontend

### Testing
- [ ] Create test users in different tenants
- [ ] Verify tenant isolation (no cross-tenant access)
- [ ] Test admin-only operations
- [ ] Monitor for policy violations
- [ ] Check query performance with EXPLAIN

### Production
- [ ] RLS enabled on ALL tables
- [ ] No wildcard policies (USING true)
- [ ] Admin operations properly restricted
- [ ] Logging enabled for violations
- [ ] Regular security audits scheduled

---

## 📚 Additional Resources

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS Performance Best Practices](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-ROW-SECURITY)

---

**RLS Status**: ✅ Fully Configured  
**Security Level**: Maximum (Tenant Isolation + Admin Controls)  
**Performance**: Optimized with indexes  
**Last Updated**: November 2025
