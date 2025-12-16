# SQLite Cleanup & Fix Plan

This checklist enumerates every remaining SQLite-specific dependency in the repository and prescribes concrete fixes so the codebase becomes Postgres-only.

| # | File / Area | SQLite Dependence | Fix Plan | Priority |
| --- | --- | --- | --- | --- |
| 1 | `backend/seed.js` | Uses `sqlite3` + `open()` writing to `database.sqlite`. | Replace with a Pool-backed seed runner that uses `getDb()` (or raw `pool.query`) and parameterized INSERTs. Accept `DATABASE_URL` + seed fixtures per tenant. Remove `sqlite`/`sqlite3` deps from package*.json. | High |
| 2 | `backend/migrations/*.sql` (001–009) | Syntax such as `INSERT OR IGNORE`, `TEXT DEFAULT CURRENT_TIMESTAMP`, `AUTOINCREMENT`, `date('now', ...)`, and `WITHOUT ROWID`. | Rewrite statements using pure Postgres syntax (e.g., `ON CONFLICT DO NOTHING`, `DEFAULT NOW()`, `GENERATED ALWAYS AS IDENTITY`, `NOW() - INTERVAL '30 days'`). Validate via `npm run migrate`. | High |
| 3 | `backend/migrations/runMigrations.js` | Assumes `db.exec` can execute multiple statements separated by semicolons (SQLite behavior). | Split files on `;` or feed them through `pg` sequentially. Ensure transactions wrap each migration (`BEGIN; ... COMMIT;`). | Med |
| 4 | `backend/test_db.js`, `show_schema.js`, `check_schema.js` | Call `sqlite_master`, `PRAGMA table_info`, `.close()` patterns. | Replace with Postgres catalog queries (e.g., `information_schema.columns`). Remove `sqlite_master` usage. Use `getDb()` without `await` and drop `.close()` or replace with pool `.end()` helper if needed. | Med |
| 5 | `backend/test_inventory.js`, `test_inventory_api.js`, `recalculate_customer_metrics.js` | Still call `await getDb()` and rely on `.close()`. | Update to synchronous `getDb()` call, stop awaiting `.close()`. Ensure queries use Postgres-friendly SQL (no SQLite-only functions). | Med |
| 6 | `backend/services/AIInsightsService.new.js` & legacy `AIInsightsService.js` | Heavy usage of `strftime`, `date('now','-30 days')`, SQLite `CASE` date tricks. | Introduce Postgres helpers: `DATE_TRUNC`, `TO_CHAR`, `CURRENT_DATE - INTERVAL`. Refactor analytics queries into reusable fragments so we can unit-test them per analyzer. | High |
| 7 | `backend/controllers/AnalyticsController.js` | Uses `strftime('%Y-%m', created_at)` for monthly revenue. | Switch to `TO_CHAR(created_at, 'YYYY-MM')` and `DATE_TRUNC`. Ensure indexes exist for filtering. | High |
| 8 | `Documents/**` (NFR / deployment guides) | Reference SQLite backup/restore commands. | Update docs to describe Postgres backup (`pg_dump`) & restore flows so onboarding instructions stop mentioning SQLite. | Low |
| 9 | `.gitignore`, `package-lock.json` | Still contain `*.sqlite` and sqlite dependencies. | Remove `*.sqlite` entry once no longer produced. Regenerate lockfile without sqlite packages. | Low |

## Execution Order

1. **Migrations & analytics queries (Items 2,6,7)** – unblock production correctness.
2. **Seeder & utility scripts (Items 1,4,5)** – ensure local onboarding/tests work.
3. **Docs & lockfile cleanup (Items 8,9)** – polish.

## Validation Checklist

- `npm run migrate` succeeds against clean Postgres.
- `npm run seed` (new script) finishes without SQLite files.
- Manual smoke tests on `/api/invoices`, `/api/customers`, `/api/inventory`, `/api/analytics/monthly-revenue`, and AI Insights generation show no SQL errors.
- `git grep sqlite` returns zero matches (excluding historical docs, if desired).
