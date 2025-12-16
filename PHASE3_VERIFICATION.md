# Phase 3: Verification Checklist

## ✅ Setup Complete Checklist

Run these commands to verify your local environment is working:

### 1. Database is Running
```bash
# Docker
docker-compose ps
# Should show: smb-app-postgres Up (healthy)

# OR local PostgreSQL
psql -U postgres -d smb_billing -c "SELECT 1"
# Should return: 1
```

### 2. Database Connection Works
```bash
node backend/test_db.js
```
**Expected output:**
```
Tables: [ 'tenants', 'branches', 'users', 'customers', 'invoices', ... ]
Inventory count: 50
Invoices count: 100
Tenant: { id: 1, name: 'Demo Business', ... }
```

### 3. Schema is Correct
```bash
node backend/check_schema.js
```
**Expected output:**
```
=== INVOICES TABLE STRUCTURE ===
Columns: id, invoice_number, tenant_id, customer_id, total_amount, status, ...

=== ALL TABLES ===
Tables: tenants, branches, users, customers, invoices, invoice_items, inventory, ...

=== CUSTOMERS TABLE STRUCTURE ===
Columns: id, name, email, phone, tenant_id, branch_id, ...
```

### 4. Backend Starts Successfully
```bash
cd backend
npm start
```
**Expected output:**
```
Server running on port 3000
Database connected: smb_billing
✓ Migrations completed successfully
```

### 5. Frontend Starts Successfully
```bash
# In another terminal
npm run dev
```
**Expected output:**
```
VITE v4.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 6. Frontend Loads in Browser
- Open: http://localhost:5173
- Should see login page
- **NOT a connection error**

### 7. Login Works
- Email: `demo@example.com`
- Password: `password123`
- Should redirect to dashboard

### 8. API Endpoints Respond
```bash
# In a new terminal, test API
curl -X GET http://localhost:3000/api/health
# Should return: { "status": "ok" }

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'
# Should return: { "token": "...", "user": {...} }
```

### 9. Smoke Tests Pass (if credentials available)
```bash
# Optional: Full E2E validation
$env:SMOKE_USERNAME = "demo@example.com"
$env:SMOKE_PASSWORD = "password123"
npm run smoke
```

---

## Phase 3 Completion Status

| Task | Status | Command |
|------|--------|---------|
| PostgreSQL running | ✅ | `docker-compose ps` |
| Database connection works | ✅ | `node backend/test_db.js` |
| Schema verified | ✅ | `node backend/check_schema.js` |
| Backend running | ✅ | `cd backend && npm start` |
| Frontend running | ✅ | `npm run dev` |
| Login works | ✅ | http://localhost:5173 |
| API responds | ✅ | `curl http://localhost:3000/api/health` |

---

## Troubleshooting

### ❌ "ECONNREFUSED" on Backend
**Problem:** Database not running
**Solution:**
```bash
docker-compose up -d
# Wait 10 seconds for health check
docker-compose ps
```

### ❌ Frontend blank or error
**Problem:** Backend not accessible
**Solution:**
1. Check backend is running: `curl http://localhost:3000/api/health`
2. Verify .env has: `VITE_API_BASE_URL=http://localhost:3000/api`
3. Restart frontend: `npm run dev`

### ❌ Login fails with 401
**Problem:** Incorrect credentials or seed not run
**Solution:**
```bash
cd backend
node seed.js
npm start
```

### ❌ Migrations error
**Problem:** Schema missing or corrupt
**Solution:**
```bash
# Reset everything (⚠️ deletes data)
docker-compose down -v
docker-compose up -d

cd backend
node migrations/runMigrations.js
node seed.js
```

---

## Next Steps After Phase 3 ✅

1. **Phase 4: Formalize DB-Agnostic Adapter**
   - Design formal adapter interface
   - Document query normalization
   - Plan for multi-DB support

2. **Start Feature Development**
   - All local/production DBs now match
   - Safe to add new features
   - No more SQLite-related issues

3. **Team Onboarding**
   - Send QUICK_START.md to team
   - New developers can set up in 5 minutes
   - Consistent development environment

---

## Environment Overview

```
Frontend (Port 5173)
    ↓
API Gateway (Port 3000)
    ↓
PostgreSQL (Port 5432)
    ↓
Database: smb_billing
```

All connected ✅ and ready for development!
