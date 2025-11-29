# Cloud Deployment Cost Estimation

## 📋 Overview

This document provides cost estimates for deploying the SMB Multi-Branch Billing App to various cloud platforms. **The primary goal is FREE hosting** while maintaining production-quality service.

**Assessment Date:** November 26, 2025  
**Application:** SMB Multi-Branch Billing App

---

## 🆓 FREE Hosting Stack (Recommended)

### **$0/month - Fully Free Production Setup**

| Component | Service | Free Tier Limits | Cost |
|-----------|---------|------------------|------|
| **Frontend** | Vercel / Cloudflare Pages | Unlimited sites, 100GB bandwidth | $0 |
| **Backend** | Render / Railway | 750 hours/month, auto-sleep | $0 |
| **Database** | Supabase / Neon | 500MB storage, 2GB bandwidth | $0 |
| **File Storage** | Cloudflare R2 | 10GB storage, 10M requests | $0 |
| **Redis Cache** | Upstash | 10K commands/day | $0 |
| **Monitoring** | UptimeRobot | 50 monitors | $0 |
| **Error Tracking** | Sentry | 5K errors/month | $0 |
| **Email** | Resend | 3K emails/month | $0 |
| **Domain** | Freenom (.tk/.ml) or GitHub Pages subdomain | - | $0 |

### **Total: $0/month** ✅

---

## 🏆 Best Free Hosting Combinations

### Option A: Vercel + Supabase (Easiest)
```
Frontend: Vercel (Free)
Backend:  Vercel Serverless Functions (Free)
Database: Supabase PostgreSQL (Free)
Storage:  Supabase Storage (Free - 1GB)
```

**Pros:** Single platform for frontend + backend, excellent DX
**Cons:** Serverless cold starts (~500ms), 10s function timeout

**Free Limits:**
- 100GB bandwidth/month
- 100K serverless invocations/month
- 500MB database
- 1GB file storage

---

### Option B: Cloudflare Pages + Railway + Neon (Best Performance)
```
Frontend: Cloudflare Pages (Free)
Backend:  Railway (Free - 500 hours/month)
Database: Neon PostgreSQL (Free - 512MB)
Storage:  Cloudflare R2 (Free - 10GB)
```

**Pros:** Fast global CDN, persistent backend (no cold starts)
**Cons:** Railway sleeps after 30min inactivity

**Free Limits:**
- Unlimited bandwidth (Cloudflare)
- 500 hours compute/month (Railway)
- 512MB database (Neon)
- 10GB storage (R2)

---

### Option C: GitHub Pages + Render + Supabase (Most Reliable)
```
Frontend: GitHub Pages (Free)
Backend:  Render (Free - spins down after 15min)
Database: Supabase PostgreSQL (Free)
Storage:  Supabase Storage (Free)
```

**Pros:** GitHub integration, reliable services
**Cons:** Backend cold starts on Render free tier

**Free Limits:**
- 100GB bandwidth/month (GitHub)
- 750 hours/month (Render)
- 500MB database (Supabase)
- 1GB storage (Supabase)

---

## 📊 Free Tier Comparison

| Service | Database | Bandwidth | Compute | Sleep? |
|---------|----------|-----------|---------|--------|
| **Supabase** | 500MB | 2GB/month | N/A | No |
| **Neon** | 512MB | Unlimited | 191 hours | Yes (5min) |
| **PlanetScale** | 5GB | 1B reads | N/A | No |
| **Railway** | - | - | 500h/month | Yes (30min) |
| **Render** | - | 100GB | 750h/month | Yes (15min) |
| **Vercel** | - | 100GB | 100K invocations | N/A |
| **Cloudflare** | - | Unlimited | 100K/day | N/A |

---

## 🎯 Recommended FREE Stack for Your App

### For Development/MVP:
```
┌─────────────────────────────────────────────────────────┐
│                    COMPLETELY FREE                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────────┐        ┌──────────────┐              │
│   │   Vercel     │        │   Supabase   │              │
│   │   Frontend   │───────▶│   Backend    │              │
│   │   (React)    │        │   Database   │              │
│   │              │        │   Storage    │              │
│   │   $0/month   │        │   Auth       │              │
│   └──────────────┘        │   $0/month   │              │
│                           └──────────────┘              │
│                                                          │
│   Monitoring: UptimeRobot (Free)                        │
│   Errors: Sentry (Free)                                 │
│   Email: Resend (Free - 3K/month)                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### For Production (Still Free):
```
┌─────────────────────────────────────────────────────────┐
│                    COMPLETELY FREE                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────────┐        ┌──────────────┐              │
│   │  Cloudflare  │        │   Railway    │              │
│   │    Pages     │───────▶│   Backend    │──────┐       │
│   │   (React)    │        │  (Node.js)   │      │       │
│   │   $0/month   │        │   $0/month   │      │       │
│   └──────────────┘        └──────────────┘      │       │
│                                                  │       │
│                           ┌──────────────┐      │       │
│                           │    Neon      │◀─────┘       │
│                           │  PostgreSQL  │              │
│                           │   $0/month   │              │
│                           └──────────────┘              │
│                                                          │
│   Cache: Upstash Redis (Free - 10K/day)                 │
│   Storage: Cloudflare R2 (Free - 10GB)                  │
│   Monitoring: BetterStack (Free)                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Free Tier Limitations & Solutions

| Limitation | Impact | Solution |
|------------|--------|----------|
| **Backend sleep** (Render/Railway) | 15-30s cold start | Use cron job to ping every 14min |
| **Database 500MB** | Limited data | Archive old invoices, optimize schema |
| **Bandwidth 2GB** (Supabase) | API limits | Use Cloudflare CDN caching |
| **No custom domain** (some) | Unprofessional URL | Use Cloudflare (free custom domain) |
| **Function timeout** (Vercel 10s) | Long operations fail | Break into smaller operations |

### Keep Backend Awake (Free):
```javascript
// Use cron-job.org (free) to ping your backend every 14 minutes
// URL: https://your-app.onrender.com/api/health
// Interval: Every 14 minutes
```

---

## 📈 When to Upgrade from Free

| Trigger | Upgrade To | Cost |
|---------|-----------|------|
| Database > 500MB | Supabase Pro | $25/month |
| Need faster cold starts | Railway Hobby | $5/month |
| Bandwidth > 100GB | Vercel Pro | $20/month |
| Need SLA/Support | Any paid tier | Varies |
| > 1000 daily users | Consider paid | ~$25-50/month |

---

## 🆓 Complete Free Services List

### Hosting & Compute
| Service | Free Tier |
|---------|-----------|
| Vercel | 100GB bandwidth, 100K functions |
| Netlify | 100GB bandwidth, 125K functions |
| Cloudflare Pages | Unlimited bandwidth, 100K/day |
| Render | 750 hours/month (sleeps) |
| Railway | $5 credit/month (~500 hours) |
| Fly.io | 3 shared VMs, 160GB bandwidth |
| Deno Deploy | 100K requests/day |

### Database
| Service | Free Tier |
|---------|-----------|
| Supabase | 500MB, 2GB bandwidth |
| Neon | 512MB, branching |
| PlanetScale | 5GB, 1B row reads |
| CockroachDB | 5GB |
| MongoDB Atlas | 512MB |
| Turso | 8GB, 1B reads |

### Storage
| Service | Free Tier |
|---------|-----------|
| Cloudflare R2 | 10GB, 10M requests |
| Supabase Storage | 1GB |
| Uploadthing | 2GB |
| ImageKit | 20GB bandwidth |

### Cache
| Service | Free Tier |
|---------|-----------|
| Upstash Redis | 10K commands/day |
| Redis Cloud | 30MB |

### Auth
| Service | Free Tier |
|---------|-----------|
| Supabase Auth | 50K MAU |
| Clerk | 5K MAU |
| Auth0 | 7K MAU |

### Email
| Service | Free Tier |
|---------|-----------|
| Resend | 3K emails/month |
| SendGrid | 100 emails/day |
| Mailgun | 5K emails/month (3 months) |

### Monitoring
| Service | Free Tier |
|---------|-----------|
| UptimeRobot | 50 monitors |
| BetterStack | 5 monitors |
| Sentry | 5K errors/month |
| LogSnag | 1K events/month |

---

## 💡 Tips for Staying Free Forever

1. **Optimize database** - Archive old data, use efficient queries
2. **Use CDN caching** - Cache API responses where possible
3. **Compress images** - Reduce storage usage
4. **Keep backend awake** - Free cron job to prevent sleep
5. **Use serverless** - Pay only for what you use (nothing)
6. **Multiple accounts** - If needed, split services across accounts
7. **Clean up** - Delete old deployments, logs, branches

---

## 🚀 Quick Start: Deploy for Free in 30 Minutes

### Step 1: Frontend (Vercel)
```bash
npm i -g vercel
cd smb-app
vercel --prod
```

### Step 2: Database (Supabase)
1. Create account at supabase.com
2. Create new project
3. Run migrations in SQL editor
4. Copy connection string

### Step 3: Backend (Render)
1. Connect GitHub repo
2. Select `backend` folder
3. Add environment variables
4. Deploy

### Step 4: Connect Everything
```env
# Frontend (.env)
VITE_API_URL=https://your-backend.onrender.com

# Backend (.env)
DATABASE_URL=postgresql://...supabase.co
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-app.vercel.app
```

**Done! Fully deployed for $0** 🎉

---

### Platform: Render + Supabase Pro + Cloudflare

Best for: **Production deployment, moderate traffic, reliability needed**

| Service | Component | Tier | Monthly Cost |
|---------|-----------|------|--------------|
| **Render** | Backend (Node.js) | Starter | $7 |
| **Render** | Background Worker | Starter | $7 |
| **Supabase** | PostgreSQL | Pro | $25 |
| **Cloudflare Pages** | Frontend | Pro | $0 |
| **Cloudflare R2** | Storage (50GB) | Pay-as-go | $2 |
| **Sentry** | Error Tracking | Team | $0 (free tier) |
| **UptimeRobot** | Monitoring | Pro | $7 |

**Total: ~$48/month**

#### Included:
- Auto-scaling backend
- 8GB database storage
- Daily backups (Supabase)
- SSL certificates
- Error tracking
- Uptime monitoring

#### When to Upgrade:
- Need more instances → Render Standard ($25/instance)
- Database > 8GB → Supabase Team ($599/month) or self-managed

---

## 💰 Option 3: AWS (Enterprise-Grade)

### Platform: AWS (Full Stack)

Best for: **Enterprise requirements, compliance needs, high scalability**

| Service | Component | Specification | Monthly Cost |
|---------|-----------|---------------|--------------|
| **EC2** | Backend | t3.small (2GB RAM) | $15 |
| **RDS** | PostgreSQL | db.t3.micro (1GB) | $15 |
| **S3** | File Storage | 50GB | $1 |
| **CloudFront** | CDN | 100GB transfer | $9 |
| **Route 53** | DNS | 1 hosted zone | $1 |
| **ACM** | SSL Certificate | Free | $0 |
| **CloudWatch** | Monitoring | Basic | $5 |
| **Elastic Load Balancer** | Load Balancing | ALB | $16 |
| **ElastiCache** | Redis (optional) | t3.micro | $12 |

**Total: ~$74/month** (without Redis: ~$62/month)

#### AWS Free Tier (First 12 months):
- EC2: 750 hours t2.micro/month
- RDS: 750 hours db.t2.micro/month
- S3: 5GB storage
- CloudFront: 50GB transfer

**With Free Tier: ~$20-30/month for first year**

---

## 💰 Option 4: Azure (Microsoft Ecosystem)

### Platform: Azure (Full Stack)

Best for: **Microsoft shops, enterprise integration, compliance**

| Service | Component | Specification | Monthly Cost |
|---------|-----------|---------------|--------------|
| **App Service** | Backend | B1 (1.75GB RAM) | $13 |
| **Azure SQL** | Database | Basic (2GB) | $5 |
| **Blob Storage** | File Storage | 50GB | $1 |
| **Azure CDN** | CDN | 100GB transfer | $8 |
| **Azure DNS** | DNS | 1 zone | $1 |
| **Application Insights** | Monitoring | 5GB/month | $0 |

**Total: ~$28/month**

#### Azure Free Tier:
- App Service: F1 (limited, 60 min/day)
- Azure SQL: 250GB free for 12 months
- 5GB Blob storage free

---

## 💰 Option 5: Google Cloud Platform

### Platform: GCP (Full Stack)

Best for: **Data analytics focus, ML integration, global scale**

| Service | Component | Specification | Monthly Cost |
|---------|-----------|---------------|--------------|
| **Cloud Run** | Backend | 256MB, 1 vCPU | $5 |
| **Cloud SQL** | PostgreSQL | db-f1-micro | $10 |
| **Cloud Storage** | File Storage | 50GB | $1 |
| **Cloud CDN** | CDN | 100GB | $8 |
| **Cloud DNS** | DNS | 1 zone | $0.20 |
| **Cloud Monitoring** | Monitoring | Basic | $0 |

**Total: ~$24/month**

#### GCP Free Tier:
- Cloud Run: 2M requests/month free
- Cloud Storage: 5GB free
- Cloud SQL: No free tier (smallest is ~$10)

---

## 💰 Option 6: DigitalOcean (Simple & Predictable)

### Platform: DigitalOcean (Full Stack)

Best for: **Developer-friendly, predictable pricing, simple setup**

| Service | Component | Specification | Monthly Cost |
|---------|-----------|---------------|--------------|
| **App Platform** | Backend | Basic ($5) | $5 |
| **App Platform** | Frontend (Static) | Free | $0 |
| **Managed PostgreSQL** | Database | Basic (1GB) | $15 |
| **Spaces** | File Storage | 250GB | $5 |
| **Spaces CDN** | CDN | Included | $0 |
| **Uptime Monitoring** | Monitoring | Included | $0 |

**Total: ~$25/month**

#### DigitalOcean Credits:
- $200 free credit for 60 days (new accounts)
- GitHub Student: $100 credit

---

## 📊 Cost Comparison Summary

| Platform | Monthly | Annual | Best For |
|----------|---------|--------|----------|
| **Railway + Supabase** | $5 | $60 | MVP, Starting out |
| **Render + Supabase** | $48 | $576 | Production, Growing |
| **DigitalOcean** | $25 | $300 | Simple, Predictable |
| **GCP** | $24 | $288 | Analytics, Scale |
| **Azure** | $28 | $336 | Microsoft shops |
| **AWS** | $62-74 | $744-888 | Enterprise |
| **AWS (Free Tier)** | $20-30 | $240-360 | First year |

---

## 🎯 Recommended Path

### Stage 1: MVP/Development ($5/month)
```
Railway (Backend) + Supabase Free (DB) + Cloudflare Pages (Frontend)
```
- Perfect for development and early users
- Upgrade when you hit limits

### Stage 2: Production ($25-50/month)
```
Render/DigitalOcean + Supabase Pro + Cloudflare
```
- Reliable for paying customers
- Daily backups, better support

### Stage 3: Scale ($100+/month)
```
AWS/GCP/Azure with managed services
```
- Auto-scaling, redundancy
- Compliance certifications
- Enterprise support

---

## 💸 Hidden Costs to Consider

| Cost Type | Description | Estimate |
|-----------|-------------|----------|
| **Domain Name** | .com registration | $10-15/year |
| **SSL Certificate** | Usually free (Let's Encrypt) | $0 |
| **Email Service** | Transactional emails (SendGrid) | $0-20/month |
| **SMS/OTP** | If using phone auth (Twilio) | $0.01/SMS |
| **Backup Storage** | Off-site backups | $1-5/month |
| **Error Tracking** | Sentry Pro (if needed) | $0-26/month |
| **Logging** | Log aggregation (if needed) | $0-50/month |

### Typical Hidden Costs: $10-50/month additional

---

## 📈 Cost Scaling Projections

### Based on User Growth

| Users | API Requests | DB Size | Estimated Cost |
|-------|-------------|---------|----------------|
| 50 | 100K/month | 1GB | $5-25/month |
| 200 | 500K/month | 5GB | $25-50/month |
| 500 | 2M/month | 20GB | $50-100/month |
| 1000 | 5M/month | 50GB | $100-200/month |
| 5000 | 25M/month | 200GB | $300-500/month |

---

## 🚀 Deployment Architecture Recommendations

### Minimal (Budget)
```
┌─────────────────┐     ┌─────────────────┐
│  Cloudflare     │     │    Railway      │
│  Pages (Free)   │────▶│   Backend ($5)  │
│  Frontend       │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Supabase      │
                        │  PostgreSQL     │
                        │    (Free)       │
                        └─────────────────┘
```

### Production (Recommended)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │     │     Render      │     │    Upstash      │
│   CDN + Pages   │────▶│    Backend      │────▶│     Redis       │
│                 │     │   (Auto-scale)  │     │   (Optional)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │   Supabase Pro  │
                        │   PostgreSQL    │
                        │  + Daily Backup │
                        └─────────────────┘
```

### Enterprise (AWS)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │     │       ALB       │     │   ElastiCache   │
│      CDN        │────▶│  Load Balancer  │────▶│     Redis       │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │   EC2    │ │   EC2    │ │   EC2    │
              │ Instance │ │ Instance │ │ Instance │
              └────┬─────┘ └────┬─────┘ └────┬─────┘
                   │            │            │
                   └────────────┼────────────┘
                                ▼
                        ┌─────────────────┐
                        │    RDS Multi-AZ │
                        │    PostgreSQL   │
                        └─────────────────┘
```

---

## ✅ Final Recommendation: GitHub-Centric FREE Hosting

### **Primary Stack (100% Free):**

| Component | Service | Free Limit | URL |
|-----------|---------|------------|-----|
| **Code Repository** | GitHub | Unlimited | `github.com/TamizhAras/smb-enhanced-billing-app` |
| **Frontend** | GitHub Pages | Unlimited bandwidth | `tamizhars.github.io/smb-enhanced-billing-app` |
| **CI/CD** | GitHub Actions | 2000 mins/month | Auto-deploy on push |
| **Backend** | Render | 750 hours/month | `your-app.onrender.com` |
| **Database** | Supabase PostgreSQL | 500MB | Managed PostgreSQL |
| **File Storage** | Supabase Storage | 1GB | Images, invoices |
| **Cache** | Upstash Redis | 10K commands/day | Session cache |
| **Monitoring** | UptimeRobot | 50 monitors | Health checks |
| **Error Tracking** | Sentry | 5K errors/month | Bug tracking |
| **Email** | Resend | 3K emails/month | Invoice emails |

### **Total Cost: $0/month** 🎉

---

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB-CENTRIC FREE STACK                     │
│                         $0/month                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │     GitHub      │                                            │
│  │   Repository    │◄──── Push code                             │
│  │                 │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │  GitHub Actions │────────▶│  GitHub Pages   │                │
│  │     (CI/CD)     │  Build  │   (Frontend)    │                │
│  │  2000 mins/mo   │         │   React SPA     │                │
│  └─────────────────┘         └────────┬────────┘                │
│                                       │                          │
│                              API Calls│                          │
│                                       ▼                          │
│                              ┌─────────────────┐                │
│                              │     Render      │                │
│                              │    (Backend)    │                │
│                              │   Node.js API   │                │
│                              │  750 hours/mo   │                │
│                              └────────┬────────┘                │
│                                       │                          │
│                    ┌──────────────────┼──────────────────┐      │
│                    ▼                  ▼                  ▼      │
│           ┌──────────────┐   ┌──────────────┐   ┌────────────┐ │
│           │   Supabase   │   │   Supabase   │   │  Upstash   │ │
│           │   Database   │   │   Storage    │   │   Redis    │ │
│           │    500MB     │   │     1GB      │   │  10K/day   │ │
│           └──────────────┘   └──────────────┘   └────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Supporting Services                    │   │
│  │  • UptimeRobot (Monitoring) - Free                       │   │
│  │  • Sentry (Error Tracking) - Free                        │   │
│  │  • Resend (Email) - 3K/month Free                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Deployment URLs

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| **Production** | `https://tamizhars.github.io/smb-enhanced-billing-app` | `https://smb-billing-api.onrender.com` |
| **Development** | `http://localhost:5173` | `http://localhost:4000` |

---

### Free Tier Capacity

| Resource | Limit | Sufficient For |
|----------|-------|----------------|
| **Users** | Unlimited | 500+ monthly active users |
| **API Requests** | ~100K/month | Normal SMB usage |
| **Database** | 500MB | ~50K invoices |
| **File Storage** | 1GB | ~1000 invoice PDFs |
| **Emails** | 3K/month | Invoice notifications |
| **Builds** | 2000 mins/month | ~200 deployments |

---

### When to Upgrade (Pay)

| Trigger | Current Free | Upgrade To | New Cost |
|---------|--------------|------------|----------|
| Database > 500MB | Supabase Free | Supabase Pro | $25/month |
| Need faster backend | Render Free (sleeps) | Render Starter | $7/month |
| High traffic | GitHub Pages | Cloudflare Pages | $0 (still free) |
| Custom domain email | - | Google Workspace | $6/user/month |

**Estimated upgrade point:** When you have 50+ paying customers or 500MB+ data

---

### Setup Checklist

#### Prerequisites
- [x] GitHub account (`TamizhAras`)
- [ ] Supabase account (free signup)
- [ ] Render account (free signup)
- [ ] Sentry account (free signup)
- [ ] UptimeRobot account (free signup)

#### Deployment Steps
1. [ ] Create Supabase project, run migrations
2. [ ] Create Render web service, connect to GitHub
3. [ ] Configure GitHub Pages for frontend
4. [ ] Set up GitHub Actions workflow
5. [ ] Configure environment variables
6. [ ] Set up monitoring (UptimeRobot)
7. [ ] Set up error tracking (Sentry)
8. [ ] Test end-to-end

---

### Environment Variables

#### GitHub Secrets (for Actions)
```
VITE_API_URL=https://smb-billing-api.onrender.com
```

#### Render Environment Variables
```
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-key-here
FRONTEND_URL=https://tamizhars.github.io/smb-enhanced-billing-app
NODE_ENV=production
PORT=4000
```

#### Supabase (auto-configured)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

---

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy SMB Billing App

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: smb-app/package-lock.json
          
      - name: Install Dependencies
        working-directory: ./smb-app
        run: npm ci
        
      - name: Build
        working-directory: ./smb-app
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./smb-app/dist

  # Backend auto-deploys via Render's GitHub integration
```

---

### Cost Summary

| Period | Cost |
|--------|------|
| **Monthly** | $0 |
| **Yearly** | $0 |
| **First Year Total** | $0* |

*Optional: Custom domain ~$10-15/year

---

### Advantages of This Stack

✅ **Zero Cost** - Completely free for small-medium usage  
✅ **GitHub Integration** - Everything connected to your repo  
✅ **Auto-Deploy** - Push to main = automatic deployment  
✅ **Scalable** - Easy upgrade path when needed  
✅ **Professional** - SSL, CDN, monitoring included  
✅ **Reliable** - Industry-standard services  

---

**Document Version:** 1.2  
**Created:** November 26, 2025  
**Updated:** November 26, 2025  
**Author:** Development Team
