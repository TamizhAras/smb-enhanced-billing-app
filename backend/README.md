# Backend API (Multi-Tenant, Multi-Branch)

This is the Node.js + Express backend for your upgraded SMB Enhanced Billing App.

## Features
- Multi-tenant, multi-branch data model
- SQLite (easy to migrate to Postgres/MySQL)
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
| `OPENAI_API_KEY` | **Required.** Server-side key used to call GPT models for insight summaries. |
| `OPENAI_MODEL` | Optional override for the model id. Defaults to `gpt-5.1-codex-preview`, the currently supported GPT-5.1 tier for this backend. |

When `OPENAI_API_KEY` is absent the backend simply returns the rule-based insights without attempting the GPT enhancement step.

## Structure
- `/models` - DB schema definitions
- `/repositories` - DB access logic
- `/services` - Business logic
- `/controllers` - API endpoints
- `/middleware` - Auth, RBAC, tenant/branch isolation
- `/migrations` - DB migrations
