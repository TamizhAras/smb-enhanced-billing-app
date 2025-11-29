# 🚀 SMB CRM - Free Cloud Deployment Plan

## 💰 Total Monthly Cost: **$0** (100% FREE)

This guide will help you deploy your SMB CRM application to the cloud using completely free services - no credit card required!

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Database Setup (Supabase)](#database-setup)
5. [Backend Deployment (Render)](#backend-deployment)
6. [Frontend Deployment (Vercel)](#frontend-deployment)
7. [Configuration & Testing](#configuration)
8. [Troubleshooting](#troubleshooting)
9. [Scaling & Upgrades](#scaling)
10. [Alternative Options](#alternatives)

---

## 🎯 Overview

### What You'll Deploy

- **Frontend**: React + Vite application (Vercel)
- **Backend**: Node.js REST API (Render.com)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT-based auth
- **File Storage**: Cloudinary (optional)

### Free Tier Limits

| Service | Storage | Bandwidth | Compute | Cost |
|---------|---------|-----------|---------|------|
| **Vercel** | Unlimited | 100GB/month | Edge Functions | FREE |
| **Render** | N/A | 100GB/month | 750 hrs/month | FREE |
| **Supabase** | 500MB | Unlimited API | 2 CPU cores | FREE |
| **Cloudinary** | 25GB | 25GB/month | Image optimization | FREE |

### Expected Capacity (Free Tier)

- **Users**: Up to 1,000 concurrent users
- **Invoices**: ~50,000 invoices (with 500MB database)
- **API Requests**: Unlimited
- **Uptime**: 99.9% (with 15-min sleep on inactivity)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└────────────────────┬───────────────────────┬─────────────────┘
                     │                       │
          ┌──────────▼──────────┐  ┌────────▼────────┐
          │  Vercel (Frontend)  │  │ Render (Backend)│
          │  React + Vite       │  │  Node.js API    │
          │  Port: 443 (HTTPS)  │  │  Port: 443      │
          └──────────┬──────────┘  └────────┬────────┘
                     │                      │
                     │        ┌─────────────▼─────────────┐
                     │        │ Supabase (Database)       │
                     └────────► PostgreSQL + Auth         │
                              │ Port: 5432                │
                              └───────────────────────────┘
```

### Data Flow

1. User visits `https://your-app.vercel.app`
2. Frontend loads from Vercel CDN
3. API calls go to `https://your-backend.onrender.com`
4. Backend queries Supabase PostgreSQL database
5. Data returns through the chain back to user

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] GitHub account (free)
- [ ] Email address (for signups)
- [ ] Git installed on your computer
- [ ] Node.js 18+ installed
- [ ] Code pushed to GitHub repository
- [ ] 30-45 minutes of time

### No Credit Card Required! 🎉

All services offer free tiers without requiring payment information.

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Account

1. Visit [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign in with GitHub (recommended) or Google
4. No credit card required!

### Step 2: Create New Project

1. Click **"New Project"**
2. Fill in project details:
   ```
   Project Name: smb-crm
   Database Password: [Generate a strong password]
   Region: Mumbai / Singapore (choose closest)
   ```
3. **IMPORTANT**: Save your database password securely!
4. Click **"Create new project"** (takes ~2 minutes)

### Step 3: Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New query"**
3. Copy the contents of `supabase_migration.sql` (see separate file)
4. Paste into SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. Verify success: You should see 11 tables created

**Migration File**: See [supabase_migration.sql](./supabase_migration.sql)

### Step 4: Get Connection String

1. Go to **Project Settings** → **Database**
2. Find **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Save this - you'll need it for backend deployment

### Step 5: Enable Row Level Security (Recommended for Production)

Row Level Security (RLS) ensures users can only access data from their own tenant, providing an additional security layer.

**Option 1: Quick Enable (Basic Protection)**
```sql
-- Run in SQL Editor
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
```

**Option 2: Full RLS with Policies (Recommended)**

The `supabase_migration.sql` file includes comprehensive RLS policies. They are already included in the migration, so RLS is enabled by default!

**What RLS Does:**
- ✅ Prevents cross-tenant data access
- ✅ Enforces tenant isolation at database level
- ✅ Protects against SQL injection attempts
- ✅ Adds admin-only restrictions for critical operations

**Verify RLS is Enabled:**
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Test RLS:**
```sql
-- Set tenant context
SET app.tenant_id = '7413d201-a37d-4af5-bbde-74bf24cb17f3';

-- Query should only return that tenant's data
SELECT COUNT(*) FROM invoices;

-- Reset
RESET app.tenant_id;
```

**Note:** Your backend JWT must include `tenant_id` in claims for RLS to work properly.

---

## 🖥️ Backend Deployment (Render.com)

### Step 1: Prepare Your Code

1. Ensure your backend code is in GitHub
2. Verify `package.json` has all dependencies:
   ```json
   {
     "dependencies": {
       "express": "^4.18.2",
       "bcryptjs": "^2.4.3",
       "jsonwebtoken": "^9.0.2",
       "uuid": "^9.0.0",
       "cors": "^2.8.5",
       "pg": "^8.11.3",
       "dotenv": "^16.3.1"
     }
   }
   ```

### Step 2: Create Render Account

1. Visit [https://render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub
4. Authorize Render to access your repositories

### Step 3: Push Code to GitHub

```bash
# Navigate to your project
cd d:\CRMINTE\smb-app

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/smb-crm.git

# Push to GitHub
git push -u origin main
```

### Step 4: Create Web Service on Render

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `smb-crm`
3. Configure the service:
   ```
   Name: smb-crm-backend
   Region: Singapore / Oregon (choose closest)
   Branch: main
   Root Directory: backend (or leave blank if backend is at root)
   Runtime: Node
   Build Command: npm install
   Start Command: node index.js
   Instance Type: Free
   ```

### Step 5: Add Environment Variables

Click **"Environment"** tab and add these variables:

```bash
# Database Connection
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# JWT Secret (generate random 32+ characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Node Environment
NODE_ENV=production

# Server Port
PORT=3001

# CORS Origin (update after frontend deployment)
CORS_ORIGIN=*
```

**To generate JWT_SECRET**, run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Deploy Backend

1. Click **"Create Web Service"**
2. Wait 2-5 minutes for deployment
3. Watch the logs for any errors
4. Once deployed, copy your backend URL:
   ```
   https://smb-crm-backend.onrender.com
   ```

### Step 7: Test Backend

Visit: `https://YOUR-BACKEND-URL.onrender.com/health`

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

⚠️ **Free Tier Note**: Service sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

Ensure your `package.json` build script is correct:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Step 2: Create Vercel Account

1. Visit [https://vercel.com](https://vercel.com)
2. Click **"Start Deploying"**
3. Sign up with GitHub
4. Authorize Vercel to access your repositories

### Step 3: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository: `smb-crm`
3. Vercel will auto-detect it's a Vite project

### Step 4: Configure Build Settings

```
Framework Preset: Vite
Root Directory: ./ (or ./smb-app if nested)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 5: Add Environment Variables

Click **"Environment Variables"** and add:

```bash
# Backend API URL (from Step 6 of Backend Deployment)
VITE_API_URL=https://smb-crm-backend.onrender.com

# Optional: Analytics
VITE_GA_TRACKING_ID=
```

### Step 6: Deploy Frontend

1. Click **"Deploy"**
2. Wait 1-3 minutes for build
3. Once deployed, copy your frontend URL:
   ```
   https://smb-crm.vercel.app
   ```

### Step 7: Update Backend CORS

Now that you have your frontend URL, update the backend:

1. Go back to **Render dashboard**
2. Select your backend service
3. Go to **Environment** tab
4. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://smb-crm.vercel.app
   ```
5. Service will auto-redeploy in ~2 minutes

---

## ⚙️ Configuration & Testing

### Step 1: Verify Deployment

**Test Backend:**
```bash
curl https://YOUR-BACKEND-URL.onrender.com/health
```

Expected: `{"status":"ok"}`

**Test Frontend:**
Visit `https://YOUR-FRONTEND-URL.vercel.app`

Expected: Login page loads

### Step 2: Test Login

Use default credentials:
```
Email: admin@example.com
Password: password
```

If login succeeds → **DEPLOYMENT SUCCESSFUL!** 🎉

### Step 3: Test Core Features

- [ ] Create a customer
- [ ] Create an invoice
- [ ] Record a payment
- [ ] View analytics dashboard
- [ ] Data persists after page refresh

### Step 4: Change Admin Password

**IMPORTANT**: Change the default password immediately!

Run in Supabase SQL Editor:
```sql
-- Generate new password hash (use bcrypt online tool)
-- For password "MyNewSecurePassword123!"
UPDATE users 
SET password_hash = '$2b$10$NEW_BCRYPT_HASH_HERE'
WHERE email = 'admin@example.com';
```

Or create new admin user through the app UI after logging in.

### Step 5: Add Custom Domain (Optional)

**Vercel Custom Domain:**
1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `myapp.com`
4. Follow DNS configuration instructions

**Get Free Domain:**
- [Freenom](https://www.freenom.com): Free `.tk`, `.ml`, `.ga` domains
- [InfinityFree](https://infinityfree.net): Free subdomain included
- Or use your own domain

---

## 🔧 Troubleshooting

### Backend Won't Start

**Check Render Logs:**
1. Render Dashboard → Your Service → Logs
2. Look for error messages

**Common Issues:**

```bash
# Error: DATABASE_URL not set
Solution: Verify environment variable in Render

# Error: Connection refused
Solution: Check Supabase connection string format

# Error: bcrypt/bcryptjs not found
Solution: Add to package.json dependencies
```

### Frontend Shows Connection Error

**Check Browser Console:**
```
Error: Failed to fetch
```

**Solutions:**
1. Verify `VITE_API_URL` in Vercel environment variables
2. Check backend is running: visit `/health` endpoint
3. Verify CORS_ORIGIN in backend matches frontend URL
4. Clear browser cache and reload

### Database Connection Fails

**Test Connection:**
```bash
# Install pg client
npm install -g pg

# Test connection
psql "postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

**Common Issues:**
- Wrong password
- Connection string format incorrect
- Supabase project paused (free tier inactivity)
- Firewall blocking port 5432

### Slow First Request (30 seconds)

This is **normal** on Render free tier! The service sleeps after 15 minutes of inactivity.

**Solutions:**
1. **Accept it**: Free tier tradeoff
2. **Upgrade**: Render Starter plan ($7/month) keeps service always-on
3. **Keep alive**: Use cron job to ping every 14 minutes

**Keep-Alive Service (Free):**
```bash
# Use cron-job.org to ping your backend every 14 minutes
URL: https://your-backend.onrender.com/health
Frequency: Every 14 minutes
```

### Database Reaching 500MB Limit

**Check Usage:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solutions:**
1. Archive old invoices to JSON files
2. Delete unnecessary test data
3. Upgrade to Supabase Pro ($25/month = 8GB storage)

---

## 📈 Scaling & Upgrades

### When to Upgrade

**Signs you need paid tier:**
- Backend sleeping causes user complaints
- Database approaching 500MB limit
- Need custom domain with SSL
- Require 24/7 uptime
- More than 1,000 active users

### Upgrade Path

**Option 1: Render Starter ($7/month)**
```
✓ Backend always-on (no sleep)
✓ Faster response times
✓ 1GB RAM, 0.5 CPU
✓ Supports ~5,000 users
```

**Option 2: Supabase Pro ($25/month)**
```
✓ 8GB database storage (~400,000 invoices)
✓ Daily backups
✓ Point-in-time recovery
✓ Priority support
```

**Option 3: Full Stack Upgrade ($32/month total)**
```
Render Starter:  $7/month
Supabase Pro:   $25/month
Vercel stays FREE
```

### Performance Optimization

**For free tier:**
```javascript
// Add caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});

// Enable gzip compression
import compression from 'compression';
app.use(compression());

// Add database indexes (already done in migration)
```

---

## 🔄 Alternative Free Options

### Option 2: Railway (All-in-One)

**Pros:**
- Simplest deployment
- One platform for everything
- Auto-scaling

**Cons:**
- Only $5 credit/month (~500 hours)
- Runs out faster than Render

**Deploy on Railway:**
```bash
1. Visit: https://railway.app
2. Click "Start a New Project"
3. Deploy from GitHub
4. Add PostgreSQL service
5. Set environment variables
6. Deploy! (takes 5 minutes)
```

### Option 3: Cyclic + MongoDB Atlas

**Pros:**
- Cyclic: Unlimited free backend
- MongoDB: 512MB free tier
- No sleep issues

**Cons:**
- Need to convert PostgreSQL to MongoDB
- Less feature-rich than Supabase

**Deploy on Cyclic:**
```bash
1. Visit: https://www.cyclic.sh
2. Connect GitHub repo
3. Auto-deploys backend
4. Use MongoDB Atlas for database
```

### Option 4: Netlify + PlanetScale

**Pros:**
- Netlify: Unlimited frontend hosting
- PlanetScale: 5GB MySQL free tier
- Excellent performance

**Cons:**
- Backend as serverless functions
- Cold start delays
- Need MySQL instead of PostgreSQL

---

## 📚 Additional Resources

### Configuration Files

All deployment configuration files are in:
- `deployment-plan/supabase_migration.sql` - Database schema
- `deployment-plan/render.yaml` - Render configuration
- `deployment-plan/vercel.json` - Vercel configuration
- `deployment-plan/.env.production.example` - Environment variables

### Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Support

If you encounter issues:
1. Check service status pages
2. Review deployment logs
3. Search GitHub Issues
4. Post in community forums

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

### Database (Supabase)
- [ ] Account created
- [ ] Project created
- [ ] Database password saved securely
- [ ] Migration script executed successfully
- [ ] Connection string copied
- [ ] 11 tables created and verified

### Backend (Render)
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service created
- [ ] All environment variables set
- [ ] DATABASE_URL configured
- [ ] JWT_SECRET generated and set
- [ ] Service deployed successfully
- [ ] Health endpoint returns OK
- [ ] Logs show no errors

### Frontend (Vercel)
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Build settings configured
- [ ] VITE_API_URL environment variable set
- [ ] Deployment successful
- [ ] Site loads in browser
- [ ] No console errors

### Configuration
- [ ] Backend CORS_ORIGIN updated with frontend URL
- [ ] Backend redeployed after CORS update
- [ ] Login page loads successfully
- [ ] Can login with admin credentials
- [ ] Can create customer
- [ ] Can create invoice
- [ ] Data persists after refresh
- [ ] Admin password changed from default

### Optional Enhancements
- [ ] Custom domain added
- [ ] SSL certificate active
- [ ] Keep-alive service configured
- [ ] Analytics configured
- [ ] Backup strategy planned

---

## 🎉 Congratulations!

Your SMB CRM application is now live and accessible from anywhere in the world - completely FREE!

**Your Live URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.onrender.com`
- Database: Supabase Dashboard

**Next Steps:**
1. Share the link with your team
2. Start using the application
3. Monitor usage and performance
4. Plan for scaling when needed

**Need Help?**
Create an issue in the GitHub repository or refer to the troubleshooting section above.

---

**Built with ❤️ for small businesses**

Last Updated: November 2025
