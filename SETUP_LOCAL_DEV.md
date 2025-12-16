# Local Development Setup Guide

This guide helps you set up the SMB Billing App for local development with PostgreSQL.

## Prerequisites

- Node.js 16+ (with npm)
- Docker & Docker Compose (recommended) OR PostgreSQL 12+ installed locally
- Git

## Option 1: Docker Compose (Recommended)

Docker ensures your local database matches production exactly.

### Step 1: Install Docker

**Windows:**
- Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- Install and restart your computer
- Verify: `docker --version`

**macOS:**
- Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- Install and restart
- Verify: `docker --version`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install docker.io docker-compose

# Verify
docker --version
docker-compose --version
```

### Step 2: Start PostgreSQL

From the project root (`smb-app/`):

```bash
# Start the database in the background
docker-compose up -d

# Verify it's running
docker-compose ps
```

You should see:
```
NAME              STATUS              PORTS
smb-app-postgres  Up (healthy)        0.0.0.0:5432->5432/tcp
```

### Step 3: Initialize Database

```bash
# Create .env file from template
cp .env.example .env

# Install backend dependencies
cd backend
npm install

# Run migrations to create schema
node migrations/runMigrations.js

# Seed demo data (optional)
node seed.js

# Return to project root
cd ..
```

### Step 4: Start Backend Server

```bash
cd backend
npm start
```

Expected output:
```
Server running on port 3000
Database connected: smb_billing
```

### Step 5: Start Frontend (in another terminal)

```bash
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 6: Access Application

Open browser: **http://localhost:5173**

Login with demo credentials:
- **Username:** demo@example.com
- **Password:** password123

---

## Option 2: Local PostgreSQL Installation

If you don't want Docker, install PostgreSQL directly.

### Step 1: Install PostgreSQL

**Windows:**
- Download [PostgreSQL 12](https://www.postgresql.org/download/windows/)
- Run installer
- Remember the password you set for `postgres` user
- Default port: 5432

**macOS (Homebrew):**
```bash
brew install postgresql@12
brew services start postgresql@12
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-12
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE smb_billing;

# Exit
\q
```

### Step 3: Configure Environment

Create `.env` file in project root:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smb_billing
PORT=3000
NODE_ENV=development
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

### Step 4: Initialize & Run

```bash
cd backend
npm install
node migrations/runMigrations.js
node seed.js
npm start

# In another terminal:
cd ..
npm run dev
```

---

## Verify Your Setup

### Check Database Connection

```bash
# Test database (from project root)
node backend/test_db.js
```

Expected output:
```
Tables: [
  'tenants',
  'branches',
  'users',
  'customers',
  'invoices',
  'invoice_items',
  'inventory',
  ...
]
Inventory count: 50
Invoices count: 100
Tenant: { id: 1, name: 'Demo Business', ... }
```

### Check Schema

```bash
node backend/check_schema.js
```

Expected output:
```
=== INVOICES TABLE STRUCTURE ===
Columns: id, invoice_number, tenant_id, customer_id, created_at, ...

=== ALL TABLES ===
Tables: tenants, branches, users, customers, invoices, ...

=== CUSTOMERS TABLE STRUCTURE ===
Columns: id, name, email, phone, tenant_id, ...
```

### Run Smoke Tests (if credentials available)

```bash
# Set test credentials
$env:SMOKE_USERNAME = "demo@example.com"
$env:SMOKE_PASSWORD = "password123"

# Run tests
npm run smoke
```

---

## Common Issues & Fixes

### Issue: `ECONNREFUSED` - Connection Refused

**Cause:** PostgreSQL not running

**Fix (Docker):**
```bash
# Check if container is running
docker-compose ps

# If not, start it
docker-compose up -d

# Check logs
docker-compose logs postgres
```

**Fix (Local PostgreSQL):**
```bash
# Windows
net start postgresql-x64-12

# macOS
brew services start postgresql@12

# Linux
sudo systemctl start postgresql
```

### Issue: `FATAL: database does not exist`

**Cause:** Database not created yet

**Fix:**
```bash
# Run migrations to create schema
cd backend
node migrations/runMigrations.js
```

### Issue: `Port 5432 already in use`

**Cause:** Another service using port 5432

**Fix (Docker):**
```bash
# Stop conflicting container
docker-compose down

# Or use different port in docker-compose.yml
# Change: "5432:5432" to "5433:5432"
# Then in .env: localhost:5433
```

**Fix (Local):**
```bash
# Find process using port 5432
netstat -ano | findstr :5432  # Windows
lsof -i :5432                  # macOS/Linux

# Kill the process or use different port
```

### Issue: `ERROR: could not find a "docker-compose" executable`

**Fix:**
- Docker Desktop includes Docker Compose (usually auto-installed)
- If not, install Docker Compose separately: https://docs.docker.com/compose/install/

### Issue: Frontend can't connect to backend

**Cause:** CORS or API URL mismatch

**Fix:** Verify `.env` file:
```
API_BASE_URL=http://localhost:3000/api
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs postgres

# Access database CLI
docker-compose exec postgres psql -U postgres -d smb_billing

# Remove everything (⚠️ deletes data)
docker-compose down -v
```

---

## Production Deployment

When deploying to production:

1. **Render PostgreSQL** (managed database)
   - Use the `DATABASE_URL` provided by Render
   - Set in environment variables

2. **Render Backend**
   - Deploy with `npm start` command
   - Set `NODE_ENV=production`

3. **Vercel Frontend**
   - No database needed on frontend
   - Set `VITE_API_BASE_URL` to production backend URL

---

## Next Steps

✅ Database is set up
✅ Backend is running
✅ Frontend is running

Now:
1. Create a test tenant
2. Add some sample data
3. Check the AI Insights dashboard
4. Run smoke tests to validate everything

---

## Need Help?

- Check logs: `docker-compose logs postgres`
- Database CLI: `docker-compose exec postgres psql -U postgres -d smb_billing`
- Reset everything: `docker-compose down -v && docker-compose up -d`
- Stop services: `docker-compose down` (keeps data)
