# Deployment Plan - Quick Reference

## 📁 Files in This Directory

| File | Purpose | Where to Use |
|------|---------|--------------|
| `FREE_CLOUD_DEPLOYMENT_GUIDE.md` | Complete step-by-step deployment guide | Read first! |
| `supabase_migration.sql` | Database schema for PostgreSQL with RLS | Supabase SQL Editor |
| `RLS_SECURITY_GUIDE.md` | Row Level Security complete reference | Advanced security setup |
| `.env.backend.production.example` | Backend environment variables template | Render dashboard |
| `.env.frontend.production.example` | Frontend environment variables template | Vercel dashboard |
| `vercel.json` | Vercel deployment configuration | Root of frontend project |
| `render.yaml` | Render deployment configuration | Root of backend project |
| `README.md` | This file | Reference |

---

## 🚀 Quick Start (5 Minutes)

### 1. Database Setup
```bash
1. Go to https://supabase.com
2. Create new project
3. Run supabase_migration.sql in SQL Editor
4. Copy connection string
```

### 2. Backend Deployment
```bash
1. Go to https://render.com
2. Connect GitHub repo
3. Create web service
4. Add environment variables from .env.backend.production.example
5. Deploy!
```

### 3. Frontend Deployment
```bash
1. Go to https://vercel.com
2. Import GitHub repo
3. Add environment variable: VITE_API_URL
4. Deploy!
```

### 4. Update CORS
```bash
1. Go back to Render
2. Update CORS_ORIGIN with your Vercel URL
3. Redeploy
```

---

## ✅ Pre-Deployment Checklist

### Code Preparation
- [ ] Backend code pushed to GitHub
- [ ] Frontend code pushed to GitHub
- [ ] All dependencies in package.json
- [ ] Environment variables documented
- [ ] Database migrations ready

### Service Accounts
- [ ] GitHub account created
- [ ] Supabase account created
- [ ] Render account created
- [ ] Vercel account created

### Configuration Files
- [ ] Copy vercel.json to frontend root
- [ ] Copy render.yaml to backend root (optional)
- [ ] Review .env.backend.production.example
- [ ] Review .env.frontend.production.example

---

## 🔗 Service URLs

After deployment, you'll have these URLs:

```
Frontend:  https://your-app.vercel.app
Backend:   https://your-backend.onrender.com
Database:  Supabase Dashboard
```

---

## 📊 Free Tier Limits

| Service | Limit | What Happens When Exceeded |
|---------|-------|----------------------------|
| **Render** | 750 hrs/month | Service sleeps after 15min idle |
| **Vercel** | 100GB bandwidth | Service pauses |
| **Supabase** | 500MB storage | Read-only mode |

### Expected Capacity
- ~50,000 invoices
- ~1,000 concurrent users
- ~10,000 API requests/day

---

## 🛠️ Configuration Templates

### Backend Environment Variables (Render)
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=your-generated-secret-min-32-chars
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend Environment Variables (Vercel)
```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🔧 Common Issues & Solutions

### Backend Won't Start
```bash
Error: Cannot find module
Solution: Ensure all dependencies in package.json
```

### Database Connection Failed
```bash
Error: ECONNREFUSED
Solution: Check DATABASE_URL format and password
```

### CORS Error on Frontend
```bash
Error: Access-Control-Allow-Origin
Solution: Update CORS_ORIGIN in backend with exact frontend URL
```

### Frontend Shows 404
```bash
Error: Page not found
Solution: Ensure vercel.json is in root and routes configured
```

---

## 📈 Scaling Path

### Current: 100% Free
- Render Free: 750 hrs/month
- Vercel Free: Unlimited
- Supabase Free: 500MB

### Upgrade Option 1: $7/month
- Render Starter: Always-on backend
- Everything else stays free

### Upgrade Option 2: $32/month
- Render Starter: $7
- Supabase Pro: $25 (8GB storage)
- Vercel stays free

---

## 🎯 Post-Deployment Tasks

### Immediately After Deployment
1. Test login with admin@example.com / password
2. Change admin password
3. Create a test customer
4. Create a test invoice
5. Verify data persists

### Within 24 Hours
1. Set up custom domain (optional)
2. Configure SSL certificate (automatic)
3. Set up monitoring/alerts
4. Create backup strategy
5. Document your URLs

### Within 1 Week
1. Add team members
2. Configure email notifications (optional)
3. Set up analytics (optional)
4. Create user documentation
5. Plan for scaling

---

## 📚 Additional Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Support
- GitHub Issues
- Service status pages
- Community forums

---

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ Can login with credentials
- ✅ Can create/view customers
- ✅ Can create/view invoices
- ✅ Data persists after refresh
- ✅ No console errors

---

## 💡 Tips & Best Practices

### Security
1. Change default admin password immediately
2. Use strong JWT_SECRET (32+ characters)
3. Enable Row Level Security in Supabase
4. Use HTTPS only (automatic)
5. Review CORS settings

### Performance
1. Enable caching headers (done in vercel.json)
2. Use CDN for static assets (automatic)
3. Monitor database query performance
4. Set up keep-alive for backend (optional)

### Monitoring
1. Check Render logs regularly
2. Monitor Supabase dashboard
3. Set up error tracking (Sentry)
4. Monitor API response times

### Backup
1. Supabase auto-backups (Pro plan)
2. Manual exports weekly (free tier)
3. Export invoices to CSV/JSON
4. Keep migration scripts in git

---

## 🆘 Need Help?

1. **Read the full guide**: `FREE_CLOUD_DEPLOYMENT_GUIDE.md`
2. **Check logs**: Render Dashboard → Logs
3. **Test endpoints**: Use curl or Postman
4. **Review environment variables**: Double-check all values
5. **Search issues**: GitHub repository
6. **Ask community**: Service-specific forums

---

## 📝 Deployment Log Template

Use this to track your deployment:

```
Date: _______________
Deployed by: _______________

Database (Supabase):
- Project URL: _______________
- Connection String: ✓ Saved securely
- Migration Status: ✓ Complete

Backend (Render):
- Service URL: _______________
- Health Check: ✓ Passing
- Environment Variables: ✓ Set

Frontend (Vercel):
- App URL: _______________
- Build Status: ✓ Success
- Environment Variables: ✓ Set

Testing:
- Login: ✓ Working
- Create Customer: ✓ Working
- Create Invoice: ✓ Working
- Data Persistence: ✓ Working

Notes:
_______________________________
_______________________________
```

---

**Last Updated**: November 2025
**Version**: 1.0
**Status**: Production Ready ✅
