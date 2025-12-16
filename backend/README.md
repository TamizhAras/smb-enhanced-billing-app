# Backend API (Multi-Tenant, Multi-Branch)

This is the Node.js + Express backend for your upgraded SMB Enhanced Billing App.

## Features
- Multi-tenant, multi-branch data model
- PostgreSQL-ready data layer with backward-compatible adapter
- Repository, Service, Controller, Middleware patterns
- JWT authentication and RBAC

## Setup
```sh
cd backend
npm install
npm run dev
```

### Environment variables

Create a `.env` file in the `backend` directory (or export the variables in your shell) with the following values:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | **Required.** PostgreSQL connection string used by the pooled adapter. |
| `OPENAI_API_KEY` | Optional. Enables GPT-based enhancement of AI insights. |
| `OPENAI_MODEL` | Optional override for the model id. |
| `API_BASE_URL` | Optional override for the smoke test target (defaults to `http://localhost:4000/api`). |
| `SMOKE_USERNAME` | Username/email used for smoke-test authentication. |
| `SMOKE_PASSWORD` | Password used for smoke-test authentication. |

When `OPENAI_API_KEY` is absent the backend simply returns the rule-based insights without attempting the GPT enhancement step.

### Smoke tests

After deploying (or pointing to a running backend) you can hit the critical endpoints with:

```sh
cd backend
SMOKE_USERNAME=<user> SMOKE_PASSWORD=<pass> API_BASE_URL=<https://api>/api npm run smoke
```

The script logs login timing plus the status/duration of invoices, customers, and inventory fetches. A non-zero exit code indicates a regression in one of the endpoints.

## Structure
- `/models` - DB schema definitions
- `/repositories` - DB access logic
- `/services` - Business logic
- `/controllers` - API endpoints
- `/middleware` - Auth, RBAC, tenant/branch isolation
- `/migrations` - DB migrations
