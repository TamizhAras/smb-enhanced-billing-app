# Non-Functional Requirements (NFR) Implementation Plan

## 📋 Overview

This document outlines the implementation plan to ensure the SMB Multi-Branch Billing App meets enterprise-grade Non-Functional Requirements including Performance, Scalability, Security, Resilience, Observability, and Availability.

---

## 🎯 NFR Goals

| NFR | Target | Current State |
|-----|--------|---------------|
| **Performance** | FCP < 1.5s, API < 200ms | ⚠️ Not measured |
| **Scalability** | 1000 concurrent users, 10K invoices/tenant | ❌ SQLite limits |
| **Security** | OWASP Top 10 compliant | ⚠️ Partial |
| **Resilience** | Auto-recovery, offline-first | ⚠️ PWA only |
| **Observability** | 100% error capture, metrics | ❌ Console.log only |
| **Availability** | 99.9% uptime | ❌ No monitoring |

---

## 🏗️ Implementation Plan

> **✅ Testability:** Each task includes verification steps you can test immediately after completion.

---

### Phase 1: Security Hardening (Priority: Critical)

**Objective:** Address critical security vulnerabilities before any production deployment.

**Estimated Time:** 6-8 hours

#### Task 1.1: Environment Variables for Secrets

**Issue:** JWT secret and other sensitive values are hardcoded in source code.

**Implementation:**
- Create `.env` file for backend secrets
- Create `.env.example` template (committed to git)
- Update backend to read from `process.env`
- Add `.env` to `.gitignore`

**Files:**
- `backend/.env` (NEW)
- `backend/.env.example` (NEW)
- `backend/.gitignore` (UPDATE)
- `backend/index.js` (UPDATE)
- `backend/middleware/auth.js` (UPDATE)

**🧪 How to Test:**
1. Delete any hardcoded secrets from code
2. Start backend without `.env` file → should fail with clear error
3. Create `.env` with `JWT_SECRET=mysecret`
4. Start backend → should work
5. Check git status → `.env` should NOT be tracked

**✅ Pass Criteria:**
- No secrets in source code
- App fails gracefully without `.env`
- `.env` is gitignored

---

#### Task 1.2: Input Validation with Zod

**Issue:** No server-side validation, vulnerable to malformed data and injection.

**Implementation:**
- Install Zod validation library
- Create validation schemas for all endpoints
- Add validation middleware
- Return clear error messages

**Files:**
- `backend/package.json` (UPDATE - add zod)
- `backend/validators/schemas.js` (NEW)
- `backend/middleware/validate.js` (NEW)
- `backend/controllers/*.js` (UPDATE - add validation)

**🧪 How to Test:**
1. Send POST `/api/auth/login` with empty body → should return 400 with validation errors
2. Send POST `/api/auth/login` with `{username: 123}` → should reject (not string)
3. Send POST `/api/invoices` with negative amount → should reject
4. Send valid data → should work

**✅ Pass Criteria:**
- All POST/PUT endpoints validate input
- Clear error messages returned
- Invalid data rejected with 400 status

---

#### Task 1.3: CORS Configuration

**Issue:** CORS is wide open, any origin can make requests.

**Implementation:**
- Install `cors` package
- Configure allowed origins (localhost for dev, production domain)
- Restrict methods and headers

**Files:**
- `backend/package.json` (UPDATE - add cors)
- `backend/index.js` (UPDATE - configure cors)
- `backend/config/cors.js` (NEW)

**🧪 How to Test:**
1. Make API request from allowed origin → should work
2. Make API request from `http://evil.com` → should be blocked
3. Check response headers for `Access-Control-Allow-Origin`

**✅ Pass Criteria:**
- Only configured origins allowed
- Preflight requests handled correctly
- Credentials mode configured

---

#### Task 1.4: Rate Limiting

**Issue:** No rate limiting, vulnerable to brute force and DDoS.

**Implementation:**
- Install `express-rate-limit`
- Add global rate limit (100 requests/minute)
- Add stricter limit for auth endpoints (5 attempts/minute)
- Return `429 Too Many Requests` when exceeded

**Files:**
- `backend/package.json` (UPDATE)
- `backend/middleware/rateLimiter.js` (NEW)
- `backend/index.js` (UPDATE)

**🧪 How to Test:**
1. Make 6 login attempts in 1 minute → 6th should return 429
2. Wait 1 minute → should be able to login again
3. Make 101 requests to any endpoint → should get 429

**✅ Pass Criteria:**
- Auth endpoints limited to 5/minute
- General endpoints limited to 100/minute
- Clear error message with retry time

---

#### Task 1.5: Security Headers with Helmet

**Issue:** Missing security headers (CSP, X-Frame-Options, etc.)

**Implementation:**
- Install `helmet` package
- Configure Content-Security-Policy
- Add X-Frame-Options, X-Content-Type-Options
- Enable HSTS for production

**Files:**
- `backend/package.json` (UPDATE)
- `backend/index.js` (UPDATE)

**🧪 How to Test:**
1. Make any API request
2. Check response headers in DevTools → Network tab
3. Should see: `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`

**✅ Pass Criteria:**
- All Helmet default headers present
- CSP configured for app needs
- No clickjacking possible (X-Frame-Options)

---

#### 📋 Phase 1 Completion Checklist:
- [ ] Secrets in environment variables
- [ ] Input validation on all endpoints
- [ ] CORS restricted to allowed origins
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] No vulnerabilities in `npm audit`

---

### Phase 2: Resilience & Error Handling (Priority: High)

**Objective:** Ensure the app gracefully handles errors and recovers from failures.

**Estimated Time:** 5-6 hours

#### Task 2.1: React Error Boundaries

**Issue:** Component errors crash the entire app.

**Implementation:**
- Create ErrorBoundary component
- Wrap App and critical sections
- Show user-friendly error UI
- Log errors for debugging

**Files:**
- `src/components/ErrorBoundary.tsx` (NEW)
- `src/App.tsx` (UPDATE)

**🧪 How to Test:**
1. Temporarily add `throw new Error('test')` in a component
2. Navigate to that component
3. Should see error UI instead of white screen
4. Other parts of app should still work

**✅ Pass Criteria:**
- Errors contained to component
- User-friendly error message shown
- "Try Again" button works
- Error logged to console

---

#### Task 2.2: API Health Endpoint

**Issue:** No way to check if backend is running and healthy.

**Implementation:**
- Add `GET /api/health` endpoint
- Check database connectivity
- Return system status (uptime, memory, db status)
- No authentication required

**Files:**
- `backend/controllers/HealthController.js` (NEW)
- `backend/controllers/index.js` (UPDATE)

**🧪 How to Test:**
1. Call `GET http://localhost:4000/api/health`
2. Should return:
```json
{
  "status": "healthy",
  "uptime": 12345,
  "database": "connected",
  "timestamp": "2025-11-26T10:00:00Z"
}
```
3. Stop database → status should show "database": "disconnected"

**✅ Pass Criteria:**
- Endpoint returns 200 when healthy
- Endpoint returns 503 when unhealthy
- No auth required
- Includes DB status

---

#### Task 2.3: API Retry Logic

**Issue:** Failed API calls don't retry, user sees immediate error.

**Implementation:**
- Add retry wrapper for API calls
- Retry 3 times with exponential backoff
- Only retry on network errors (not 4xx)
- Show retry indicator to user

**Files:**
- `src/lib/apiService.ts` (UPDATE)
- `src/lib/retryFetch.ts` (NEW)

**🧪 How to Test:**
1. Stop backend server
2. Try to load a page with API calls
3. Should see retry attempts in Network tab (3 total)
4. Should show "Retrying..." message
5. Start backend → should recover automatically

**✅ Pass Criteria:**
- 3 retry attempts on failure
- Exponential backoff (1s, 2s, 4s)
- No retry on 4xx errors
- User informed of retry

---

#### Task 2.4: Global Error Handler (Backend)

**Issue:** Unhandled errors crash the server or leak stack traces.

**Implementation:**
- Add global error handling middleware
- Log errors with context
- Return sanitized error to client
- Handle async errors properly

**Files:**
- `backend/middleware/errorHandler.js` (NEW)
- `backend/index.js` (UPDATE)

**🧪 How to Test:**
1. Create endpoint that throws error
2. Call it → should return 500 with generic message
3. Check server logs → should have full stack trace
4. Client should NOT see stack trace

**✅ Pass Criteria:**
- No stack traces sent to client
- All errors logged server-side
- Consistent error response format
- Server doesn't crash on errors

---

#### Task 2.5: Offline Data Queue

**Issue:** Changes made offline are lost when app reconnects.

**Implementation:**
- Create sync queue in IndexedDB
- Queue failed API calls
- Process queue when online
- Show sync status to user

**Files:**
- `src/lib/syncQueue.ts` (NEW)
- `src/components/SyncStatus.tsx` (NEW)
- `src/lib/apiService.ts` (UPDATE)

**🧪 How to Test:**
1. Go offline (DevTools → Network → Offline)
2. Create an invoice
3. Should be saved locally with "pending sync" status
4. Go online
5. Invoice should automatically sync to server

**✅ Pass Criteria:**
- Changes queued when offline
- Auto-sync when online
- User sees sync status
- No data loss

---

#### 📋 Phase 2 Completion Checklist:
- [ ] Error boundaries prevent app crashes
- [ ] Health endpoint available
- [ ] API calls retry on failure
- [ ] Backend errors handled gracefully
- [ ] Offline changes queued and synced

---

### Phase 3: Observability (Priority: High)

**Objective:** Enable visibility into app behavior, errors, and performance.

**Estimated Time:** 4-5 hours

#### Task 3.1: Structured Logging (Backend)

**Issue:** Only console.log, no log levels, no structure.

**Implementation:**
- Install `pino` logger (fast, JSON output)
- Add log levels (error, warn, info, debug)
- Include request context (requestId, userId)
- Log to file in production

**Files:**
- `backend/package.json` (UPDATE)
- `backend/lib/logger.js` (NEW)
- `backend/middleware/requestLogger.js` (NEW)
- `backend/index.js` (UPDATE)

**🧪 How to Test:**
1. Make API request
2. Check server output → should see JSON log with requestId
3. Make request with auth → should include userId in logs
4. Trigger error → should log with "level": "error"

**✅ Pass Criteria:**
- All logs in JSON format
- Request ID in every log
- User ID included when authenticated
- Log levels used appropriately

---

#### Task 3.2: Error Tracking with Sentry

**Issue:** No visibility into production errors.

**Implementation:**
- Create Sentry account (free tier)
- Install Sentry SDK (frontend + backend)
- Configure error capture
- Add user context to errors

**Files:**
- `src/main.tsx` (UPDATE)
- `backend/index.js` (UPDATE)
- `package.json` (UPDATE)
- `backend/package.json` (UPDATE)

**🧪 How to Test:**
1. Trigger an error intentionally
2. Check Sentry dashboard → error should appear
3. Error should include user info, browser, stack trace
4. Test both frontend and backend errors

**✅ Pass Criteria:**
- All unhandled errors captured
- User context included
- Source maps uploaded (readable stack traces)
- Alerts configured for new errors

---

#### Task 3.3: API Metrics Endpoint

**Issue:** No visibility into API performance.

**Implementation:**
- Track request count, latency, error rate
- Create `/api/metrics` endpoint
- Format for Prometheus (optional)
- Track per-endpoint statistics

**Files:**
- `backend/middleware/metrics.js` (NEW)
- `backend/controllers/MetricsController.js` (NEW)
- `backend/controllers/index.js` (UPDATE)

**🧪 How to Test:**
1. Make several API requests
2. Call `GET /api/metrics`
3. Should see:
```
api_requests_total{endpoint="/api/auth/login",method="POST"} 5
api_request_duration_seconds{endpoint="/api/invoices"} 0.045
api_errors_total{endpoint="/api/invoices",status="500"} 1
```

**✅ Pass Criteria:**
- Request count tracked
- Latency (p50, p95, p99) calculated
- Error rate visible
- Per-endpoint breakdown

---

#### Task 3.4: Frontend Performance Monitoring

**Issue:** No visibility into frontend performance (Core Web Vitals).

**Implementation:**
- Add `web-vitals` library
- Track LCP, FID, CLS, FCP, TTFB
- Send to analytics/logging endpoint
- Add performance observer

**Files:**
- `package.json` (UPDATE)
- `src/lib/webVitals.ts` (NEW)
- `src/main.tsx` (UPDATE)

**🧪 How to Test:**
1. Open app in Chrome
2. Open DevTools → Console
3. Should see Web Vitals logged:
```
LCP: 1.2s
FID: 50ms
CLS: 0.05
```
4. Check if metrics sent to backend/Sentry

**✅ Pass Criteria:**
- All Core Web Vitals tracked
- Metrics logged/sent to backend
- Performance issues identifiable

---

#### 📋 Phase 3 Completion Checklist:
- [ ] Structured JSON logging
- [ ] Sentry capturing all errors
- [ ] API metrics available
- [ ] Frontend performance tracked
- [ ] Request tracing possible

---

### Phase 4: Availability & Operations (Priority: High)

**Objective:** Ensure the app stays running and can recover from failures.

**Estimated Time:** 4-5 hours

#### Task 4.1: Process Management with PM2

**Issue:** Server crashes require manual restart.

**Implementation:**
- Install PM2 globally
- Create ecosystem config
- Configure auto-restart on crash
- Enable cluster mode (multiple instances)

**Files:**
- `backend/ecosystem.config.js` (NEW)
- `backend/package.json` (UPDATE - add scripts)

**🧪 How to Test:**
1. Start with `pm2 start ecosystem.config.js`
2. Check status: `pm2 status`
3. Kill process: `pm2 stop 0` → should auto-restart
4. Check logs: `pm2 logs`

**✅ Pass Criteria:**
- Auto-restart on crash
- Logs persisted
- Memory limit configured
- Cluster mode working

---

#### Task 4.2: Database Backups

**Issue:** No backups, data loss possible.

**Implementation:**
- Create backup script
- Schedule daily backups
- Store backups with timestamp
- Keep last 7 days of backups
- Add restore script

**Files:**
- `backend/scripts/backup.js` (NEW)
- `backend/scripts/restore.js` (NEW)
- `backend/package.json` (UPDATE)

**🧪 How to Test:**
1. Run `npm run backup`
2. Check `backups/` folder → should have timestamped file
3. Delete database
4. Run `npm run restore -- --file=backups/backup-xxx.sqlite`
5. Check data is restored

**✅ Pass Criteria:**
- Backups created successfully
- Backups timestamped
- Old backups cleaned up
- Restore works correctly

---

#### Task 4.3: Uptime Monitoring

**Issue:** No alerts when app goes down.

**Implementation:**
- Set up UptimeRobot (free tier)
- Monitor `/api/health` endpoint
- Configure email/SMS alerts
- Add status page

**Files:**
- Documentation only (external service)

**🧪 How to Test:**
1. Configure UptimeRobot to check `http://your-server/api/health`
2. Stop the server
3. Should receive alert within 5 minutes
4. Start server → should receive "up" notification

**✅ Pass Criteria:**
- Health endpoint monitored
- Alerts on downtime
- Alert within 5 minutes
- Recovery notification sent

---

#### Task 4.4: Graceful Shutdown

**Issue:** Server shutdown can interrupt active requests.

**Implementation:**
- Handle SIGTERM/SIGINT signals
- Stop accepting new connections
- Wait for active requests to complete
- Close database connections
- Exit cleanly

**Files:**
- `backend/index.js` (UPDATE)

**🧪 How to Test:**
1. Start a long-running request (add `await sleep(10000)` to test endpoint)
2. Send SIGTERM to server (`Ctrl+C` or `kill -15`)
3. Should wait for request to complete
4. Should log "Shutting down gracefully"
5. Should exit with code 0

**✅ Pass Criteria:**
- Active requests complete before shutdown
- Database connections closed
- Clean exit (code 0)
- Shutdown logged

---

#### 📋 Phase 4 Completion Checklist:
- [ ] PM2 managing process
- [ ] Daily backups running
- [ ] Uptime monitoring active
- [ ] Graceful shutdown implemented
- [ ] Recovery procedures documented

---

### Phase 5: Performance Optimization (Priority: Medium)

**Objective:** Improve load times and responsiveness.

**Estimated Time:** 5-6 hours

#### Task 5.1: Code Splitting with React.lazy

**Issue:** Entire app loaded upfront, slow initial load.

**Implementation:**
- Lazy load route components
- Add Suspense with loading fallback
- Split vendor chunks
- Analyze bundle size

**Files:**
- `src/App.tsx` (UPDATE)
- `vite.config.ts` (UPDATE)

**🧪 How to Test:**
1. Run `npm run build`
2. Check `dist/assets/` → should have multiple JS chunks
3. Open DevTools → Network
4. Navigate to different pages → chunks loaded on demand
5. Run Lighthouse → check performance score

**✅ Pass Criteria:**
- Routes loaded on demand
- Initial bundle < 200KB
- Loading indicator shown
- Lighthouse performance > 80

---

#### Task 5.2: API Response Caching

**Issue:** Same data fetched repeatedly, slow and wasteful.

**Implementation:**
- Install TanStack Query (React Query)
- Configure cache times per query
- Add stale-while-revalidate
- Show cached data instantly

**Files:**
- `package.json` (UPDATE)
- `src/main.tsx` (UPDATE)
- `src/lib/queryClient.ts` (NEW)
- `src/hooks/useApiQuery.ts` (NEW)

**🧪 How to Test:**
1. Navigate to a page with API data
2. Note load time in Network tab
3. Navigate away and back
4. Data should appear instantly (from cache)
5. Check Network → no new request (or background refresh)

**✅ Pass Criteria:**
- Repeated requests use cache
- Background refresh works
- Cache invalidation on mutations
- Loading states handled

---

#### Task 5.3: Database Indexing

**Issue:** Queries slow without proper indexes.

**Implementation:**
- Analyze slow queries
- Add indexes on foreign keys
- Add indexes on frequently queried columns
- Add composite indexes for common queries

**Files:**
- `backend/migrations/002_indexes.sql` (NEW)
- `backend/migrations/runMigrations.js` (UPDATE)

**🧪 How to Test:**
1. Run migration
2. Use SQLite `EXPLAIN QUERY PLAN` to verify index usage
3. Compare query times before/after
4. Check that joins use indexes

**✅ Pass Criteria:**
- All foreign keys indexed
- Common queries use indexes
- No full table scans on large tables
- Query time < 50ms

---

#### Task 5.4: API Pagination

**Issue:** All records returned, slow for large datasets.

**Implementation:**
- Add `limit` and `offset` parameters
- Return total count for pagination UI
- Default to 20 items per page
- Add cursor-based pagination option

**Files:**
- `backend/repositories/*.js` (UPDATE)
- `backend/controllers/*.js` (UPDATE)

**🧪 How to Test:**
1. Create 50 invoices
2. Call `GET /api/invoices?limit=10&offset=0`
3. Should return 10 items + total count
4. Call with `offset=10` → should return next 10

**✅ Pass Criteria:**
- All list endpoints support pagination
- Total count returned
- Default limit applied
- Performance consistent regardless of total records

---

#### 📋 Phase 5 Completion Checklist:
- [ ] Routes lazy loaded
- [ ] API responses cached
- [ ] Database indexes added
- [ ] Pagination implemented
- [ ] Bundle size < 200KB
- [ ] Lighthouse score > 80

---

### Phase 6: Scalability Preparation (Priority: Medium)

**Objective:** Prepare for growth beyond current capacity.

**Estimated Time:** 8-10 hours

#### Task 6.1: PostgreSQL Migration

**Issue:** SQLite not suitable for production scale.

**Implementation:**
- Set up PostgreSQL database
- Update connection configuration
- Migrate schema (adjust SQL syntax)
- Update queries for PostgreSQL
- Add connection pooling

**Files:**
- `backend/models/db.js` (UPDATE)
- `backend/migrations/*.sql` (UPDATE)
- `backend/package.json` (UPDATE - add pg)
- `backend/.env` (UPDATE)

**🧪 How to Test:**
1. Set up PostgreSQL locally or use cloud (Supabase free tier)
2. Update `.env` with connection string
3. Run migrations
4. Test all CRUD operations
5. Check connection pooling in logs

**✅ Pass Criteria:**
- All features work with PostgreSQL
- Connection pooling active
- Migrations run successfully
- No SQLite-specific syntax

---

#### Task 6.2: Redis Session Cache

**Issue:** Session validation hits database every request.

**Implementation:**
- Set up Redis (local or cloud)
- Cache session data
- Set TTL matching JWT expiry
- Invalidate on logout

**Files:**
- `backend/package.json` (UPDATE - add redis)
- `backend/lib/redis.js` (NEW)
- `backend/middleware/auth.js` (UPDATE)

**🧪 How to Test:**
1. Login and get token
2. Check Redis → session should be cached
3. Make authenticated requests → should use cache
4. Logout → session should be removed from Redis

**✅ Pass Criteria:**
- Session cached in Redis
- DB not hit for every request
- Logout invalidates cache
- TTL matches token expiry

---

#### Task 6.3: Horizontal Scaling Preparation

**Issue:** Single server, no load distribution.

**Implementation:**
- Make app stateless (no in-memory state)
- Externalize session storage (Redis)
- Document deployment for multiple instances
- Test with PM2 cluster mode

**Files:**
- Documentation
- `backend/ecosystem.config.js` (UPDATE)

**🧪 How to Test:**
1. Run with `pm2 start ecosystem.config.js -i 4` (4 instances)
2. Login on instance 1
3. Make request → might hit instance 2
4. Should still work (session in Redis)

**✅ Pass Criteria:**
- App works with multiple instances
- No sticky sessions required
- State externalized
- Load balanced correctly

---

#### 📋 Phase 6 Completion Checklist:
- [ ] PostgreSQL working
- [ ] Redis caching sessions
- [ ] App stateless
- [ ] Multi-instance tested
- [ ] Documentation updated

---

## 📁 New Files Summary

```
backend/
├── .env                          (NEW - secrets)
├── .env.example                  (NEW - template)
├── ecosystem.config.js           (NEW - PM2)
├── config/
│   └── cors.js                   (NEW)
├── lib/
│   ├── logger.js                 (NEW)
│   └── redis.js                  (NEW)
├── middleware/
│   ├── errorHandler.js           (NEW)
│   ├── rateLimiter.js            (NEW)
│   ├── requestLogger.js          (NEW)
│   ├── metrics.js                (NEW)
│   └── validate.js               (NEW)
├── validators/
│   └── schemas.js                (NEW)
├── controllers/
│   ├── HealthController.js       (NEW)
│   └── MetricsController.js      (NEW)
├── scripts/
│   ├── backup.js                 (NEW)
│   └── restore.js                (NEW)
└── migrations/
    └── 002_indexes.sql           (NEW)

src/
├── components/
│   ├── ErrorBoundary.tsx         (NEW)
│   └── SyncStatus.tsx            (NEW)
└── lib/
    ├── retryFetch.ts             (NEW)
    ├── syncQueue.ts              (NEW)
    ├── queryClient.ts            (NEW)
    └── webVitals.ts              (NEW)
```

---

## ⏱️ Estimated Timeline

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| Phase 1 | Security | 6-8 hours | None |
| Phase 2 | Resilience | 5-6 hours | None |
| Phase 3 | Observability | 4-5 hours | Phase 2.4 |
| Phase 4 | Availability | 4-5 hours | Phase 1 |
| Phase 5 | Performance | 5-6 hours | None |
| Phase 6 | Scalability | 8-10 hours | Phase 1, 3 |

**Total Estimated Time:** 32-40 hours

---

## 🎯 Quick Wins (Implement First)

These provide maximum value with minimum effort:

| Task | Phase | Effort | Impact |
|------|-------|--------|--------|
| Environment Variables | 1.1 | 1h | Critical |
| CORS Configuration | 1.3 | 1h | High |
| Rate Limiting | 1.4 | 2h | High |
| Security Headers | 1.5 | 1h | High |
| Error Boundaries | 2.1 | 2h | High |
| Health Endpoint | 2.2 | 1h | High |
| PM2 Setup | 4.1 | 1h | High |

**Quick Wins Total: ~10 hours**

---

## 🧪 Testing Checklist

### Security Testing
- [ ] SQL injection attempted → blocked
- [ ] XSS attempted → blocked
- [ ] Brute force login → rate limited
- [ ] Invalid JWT → rejected
- [ ] Expired JWT → rejected
- [ ] Missing auth → 401 returned

### Resilience Testing
- [ ] Component error → contained by boundary
- [ ] API timeout → retry works
- [ ] Server crash → auto-restart
- [ ] Offline mode → data queued
- [ ] Network restore → data synced

### Performance Testing
- [ ] Initial load < 3s
- [ ] API response < 200ms
- [ ] 1000 records → pagination works
- [ ] Lighthouse score > 80

### Availability Testing
- [ ] Server restart → zero downtime (PM2)
- [ ] Health check → returns status
- [ ] Backup → completes successfully
- [ ] Restore → data recovered

---

## 📋 Priority Matrix

```
                    IMPACT
                High        Low
            ┌───────────┬───────────┐
       High │ Phase 1   │ Phase 5   │
            │ Phase 2   │           │
EFFORT      ├───────────┼───────────┤
       Low  │ Quick     │ Phase 3   │
            │ Wins      │           │
            └───────────┴───────────┘
```

---

## 🚀 Recommended Implementation Order

1. **Quick Wins** (10h) - Immediate security & stability
2. **Phase 1** remaining (4h) - Complete security
3. **Phase 2** (5h) - Error handling & resilience
4. **Phase 4** (4h) - Operations & availability
5. **Phase 3** (4h) - Observability
6. **Phase 5** (5h) - Performance
7. **Phase 6** (8h) - Scalability (when needed)

---

**Document Version:** 1.0  
**Created:** November 26, 2025  
**Last Updated:** November 26, 2025  
**Author:** Development Team
