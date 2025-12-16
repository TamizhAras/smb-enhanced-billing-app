# Quick Start (5 Minutes)

## One-Time Setup

```bash
# 1. Clone and install
git clone https://github.com/TamizhAras/smb-enhanced-billing-app.git
cd smb-app

# 2. Copy environment file
cp .env.example .env

# 3. Start PostgreSQL (Docker)
docker-compose up -d

# 4. Initialize database
cd backend
npm install
node migrations/runMigrations.js
node seed.js
cd ..
```

## Daily Development

```bash
# Terminal 1: Start database (if not running)
docker-compose up -d

# Terminal 2: Start backend
cd backend
npm start

# Terminal 3: Start frontend
npm run dev
```

Open: **http://localhost:5173**

Login:
- Email: `demo@example.com`
- Password: `password123`

## Useful Commands

```bash
# Test database connection
node backend/test_db.js

# Check schema
node backend/check_schema.js

# View database CLI
docker-compose exec postgres psql -U postgres -d smb_billing

# Stop everything
docker-compose down

# View logs
docker-compose logs postgres
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5432 in use | `docker-compose down` or use different port |
| Can't connect to DB | Check DATABASE_URL in .env |
| Frontend won't load | Check backend is running on port 3000 |
| Schema missing | Run `node backend/migrations/runMigrations.js` |

---

For detailed setup: See `SETUP_LOCAL_DEV.md`
