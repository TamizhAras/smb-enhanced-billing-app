# PostgreSQL Migration Plan

This document outlines how to finish the transition from the legacy SQLite stack to the production-ready PostgreSQL deployment that is already running via the new database adapter.

## 1. Objectives

- Remove all remaining SQLite assumptions from code, tooling, and data flows.
- Run a consistent schema across local, staging, and production environments.
- Validate that the critical invoice, customer, and inventory APIs continue working end-to-end after the move.
- Provide a repeatable runbook for future environments.

## 2. Current State Snapshot

| Layer | Status | Notes |
| --- | --- | --- |
| Runtime adapter | ✅ PostgreSQL pool with SQLite-compatible helpers (`backend/models/db.js`) now deployed |
| Production DB | ✅ Managed Postgres on Render (reachable via `DATABASE_URL`) |
| Local tooling | ❌ Seed/migration/test scripts still expect SQLite files |
| SQL assets | ⚠ Multiple migrations/templates contain SQLite-only syntax (`INSERT OR IGNORE`, `strftime`, `date('now')`, `PRAGMA`, etc.) |

## 3. Prerequisites

1. Confirm `DATABASE_URL` for each environment (dev/staging/prod) and store it in `.env` / Render dashboard.
2. Install Postgres CLI (`psql`) locally for ad-hoc checks.
3. Snapshot existing production data before any schema rewrites.

## 4. Migration Phases

### Phase A – Schema Alignment

1. **Port migrations to Postgres syntax**
   - Replace `INSERT OR IGNORE` with `INSERT ... ON CONFLICT DO NOTHING`.
   - Replace `AUTOINCREMENT`, `TEXT DEFAULT CURRENT_TIMESTAMP`, and `PRAGMA` statements with Postgres equivalents.
   - Substitute date helpers such as `date('now','-30 days')`, `strftime`, and `datetime` with `NOW()`/`CURRENT_DATE`, `DATE_TRUNC`, `TO_CHAR`, `EXTRACT`, etc.
2. **Run migrations on an empty Postgres instance** (`npm run migrate` once SQL is ported) and compare schemas to the reference in `supabase_migration.sql`.
3. **Validate constraints** – ensure UUID primary keys use `uuid` type with `DEFAULT gen_random_uuid()` or rely on application-generated IDs.

### Phase B – Data Migration

1. Export the existing SQLite data (if any) using `.dump` or the existing `supabase_migration.sql` converter.
2. Load into Postgres via `psql` or `pg_restore` after adjusting SQL to the new syntax.
3. Verify row counts per table with quick queries:
   ```sql
   SELECT 'invoices' AS table, COUNT(*) FROM invoices UNION ALL
   SELECT 'customers', COUNT(*) FROM customers UNION ALL
   SELECT 'inventory', COUNT(*) FROM inventory;
   ```

### Phase C – Application Update & Verification

1. **Environment variables** – remove any fallbacks to SQLite files; rely solely on `DATABASE_URL`.
2. **Seed/Test utilities** – convert to Postgres (see `SQLITE_CLEANUP_PLAN.md`).
3. **Smoke tests (required)**
   - `GET /api/invoices?tenantId=...` – expect 200 with list.
   - `GET /api/customers?tenantId=...`
   - `GET /api/inventory?tenantId=...`
   - `GET /api/invoices/templates`, `/tax-rates`, `/payments` (covers adapter functions using `.close`).
   - Record responses + timings.
4. **Regression checks**
   - Run frontend build + e2e happy path (login → dashboard → invoices → inventory) against the deployed backend.
   - Execute reporting endpoints (`/analytics/**`, AI Insights generation) to ensure `strftime` replacements behave as expected.

### Phase D – Cutover & Monitoring

1. Deploy the migrated backend to staging, run the smoke tests, then promote to production.
2. Monitor Render logs for SQL errors for at least 24 hours.
3. Enable metric alerts for connection exhaustion or slow queries.

## 5. Deliverables & Owners

| Deliverable | Owner | Due |
| --- | --- | --- |
| Postgres-ready migrations (001–009) | Backend | T+1 day |
| Updated seed + utilities | Backend | T+2 days |
| Endpoint smoke-test report | QA/Dev | T+2 days |
| Deprecated SQLite assets removed | Backend | T+3 days |

## 6. Rollback Plan

- Keep a zipped backup of the SQLite DB plus the Postgres snapshot taken in Phase B.
- If a critical blocker appears, redeploy the previous adapter commit and restore the old Postgres snapshot.

## 7. Open Risks

- AI Insights queries rely heavily on SQLite functions; the Postgres equivalents must be unit-tested to avoid silent logic regressions.
- Seed data currently creates demo tenants via SQLite-only APIs; new developers cannot bootstrap without these fixes.
- Package lock still references `sqlite`/`sqlite3`; forgetting to remove them may cause confusing dependency installs.

Follow this plan in parallel with the file-specific cleanup checklist described in `SQLITE_CLEANUP_PLAN.md`.
