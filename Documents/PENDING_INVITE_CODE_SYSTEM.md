# Invite Code System - Payment-Gated Registration

## Status: PENDING IMPLEMENTATION

## Overview
Implement a subscription/payment gate that requires customers to have a valid invite code before they can register. This ensures only paying customers can create organizations.

---

## Business Flow

```
1. Customer contacts you for subscription
2. Customer makes payment (UPI/Bank/Cash/Online)
3. You (Super Admin) generate an invite code
4. Give code to customer
5. Customer uses code during registration
6. Code becomes invalid after use (single-use)
```

---

## Technical Implementation Plan

### 1. Database Schema

```sql
-- Invite Codes Table
CREATE TABLE IF NOT EXISTS invite_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  plan TEXT DEFAULT 'basic',           -- basic, pro, enterprise
  max_branches INTEGER DEFAULT 3,
  max_users INTEGER DEFAULT 10,
  validity_days INTEGER DEFAULT 365,    -- subscription duration
  created_by TEXT,                      -- super admin who created
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,                  -- code expiry (not subscription)
  used_at DATETIME,
  used_by_tenant_id TEXT,
  status TEXT DEFAULT 'active',         -- active, used, expired, revoked
  notes TEXT,
  FOREIGN KEY (used_by_tenant_id) REFERENCES tenants(id)
);

-- Add subscription fields to tenants
ALTER TABLE tenants ADD COLUMN plan TEXT DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN subscription_start DATETIME;
ALTER TABLE tenants ADD COLUMN subscription_end DATETIME;
ALTER TABLE tenants ADD COLUMN max_branches INTEGER DEFAULT 3;
ALTER TABLE tenants ADD COLUMN max_users INTEGER DEFAULT 10;
ALTER TABLE tenants ADD COLUMN is_active BOOLEAN DEFAULT 1;
```

### 2. Backend APIs

#### Invite Code Management (Super Admin Only)

```
POST   /api/admin/invite-codes          - Generate new invite code
GET    /api/admin/invite-codes          - List all codes
GET    /api/admin/invite-codes/:id      - Get code details
DELETE /api/admin/invite-codes/:id      - Revoke a code
```

#### Public API

```
POST   /api/invite-codes/validate       - Check if code is valid (public)
```

#### Modified Registration

```
POST   /api/tenants/register            - Now requires inviteCode field
```

### 3. API Request/Response Examples

#### Generate Invite Code
```json
// POST /api/admin/invite-codes
// Request
{
  "plan": "pro",
  "maxBranches": 5,
  "maxUsers": 20,
  "validityDays": 365,
  "codeExpiryDays": 7,
  "notes": "Customer: ABC Store, Payment: ₹5000 received"
}

// Response
{
  "id": "uuid",
  "code": "SMB-2025-ABCD-1234",
  "plan": "pro",
  "maxBranches": 5,
  "maxUsers": 20,
  "validityDays": 365,
  "expiresAt": "2025-12-04T00:00:00Z",
  "status": "active"
}
```

#### Validate Code (Public)
```json
// POST /api/invite-codes/validate
// Request
{
  "code": "SMB-2025-ABCD-1234"
}

// Response (Valid)
{
  "valid": true,
  "plan": "pro",
  "maxBranches": 5,
  "maxUsers": 20,
  "subscriptionDays": 365
}

// Response (Invalid)
{
  "valid": false,
  "error": "Code has expired or already been used"
}
```

#### Registration with Code
```json
// POST /api/tenants/register
// Request
{
  "inviteCode": "SMB-2025-ABCD-1234",
  "organizationName": "ABC Store",
  "adminUsername": "abcadmin",
  "adminPassword": "securepass123",
  "adminEmail": "admin@abcstore.com"
}
```

### 4. Frontend Changes

#### Registration Page Updates
- Add invite code field (required)
- Real-time code validation
- Show plan details after valid code entered
- Disable registration if no valid code

#### Super Admin Panel (New)
- Dashboard showing all tenants
- Invite code generator
- Code usage tracking
- Revenue/subscription overview

### 5. Code Generation Format

```
Format: SMB-YYYY-XXXX-XXXX
Example: SMB-2025-A7B3-K9M2

Where:
- SMB = App prefix
- YYYY = Year
- XXXX-XXXX = Random alphanumeric (uppercase)
```

---

## UI Mockups

### Super Admin - Generate Code Panel
```
┌─────────────────────────────────────────────────────────┐
│  Generate Invite Code                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Plan:            [Basic ▼]  [Pro ▼]  [Enterprise ▼]    │
│                                                          │
│  Max Branches:    [  3  ]                               │
│  Max Users:       [ 10  ]                               │
│  Subscription:    [ 365 ] days                          │
│  Code Valid For:  [  7  ] days                          │
│                                                          │
│  Notes:           [_______________________________]     │
│                   [_______________________________]     │
│                                                          │
│                   [ Generate Code ]                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  ✅ Generated Successfully!                              │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │         SMB-2025-A7B3-K9M2                      │   │
│  │                              [Copy] [Share]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Share this code with your customer after payment.      │
│  Code expires in 7 days if not used.                    │
└─────────────────────────────────────────────────────────┘
```

### Customer Registration (Updated)
```
┌─────────────────────────────────────────────────────────┐
│           Register Your Business                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Invite Code *                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ SMB-2025-A7B3-K9M2                          ✓   │   │
│  └─────────────────────────────────────────────────┘   │
│  ✅ Valid code! Pro Plan - 5 branches, 20 users        │
│                                                          │
│  Organization Name *                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ABC Grocery Store                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Admin Username *                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ abcadmin                                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Password *                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ••••••••••                                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│              [ Create Organization ]                     │
│                                                          │
│  Don't have a code? Contact sales@yourcompany.com      │
└─────────────────────────────────────────────────────────┘
```

---

## Subscription Plans (Suggested)

| Plan | Branches | Users | Price/Year | Features |
|------|----------|-------|------------|----------|
| **Basic** | 1 | 5 | ₹2,999 | Core billing features |
| **Pro** | 5 | 20 | ₹7,999 | + Analytics, AI Insights |
| **Enterprise** | Unlimited | Unlimited | ₹19,999 | + Priority support, API access |

---

## Implementation Priority

### Phase 1: Core (High Priority)
- [ ] Invite codes database table
- [ ] Generate code API
- [ ] Validate code API
- [ ] Update registration to require code
- [ ] Update registration UI

### Phase 2: Admin Panel (Medium Priority)
- [ ] Super Admin role & authentication
- [ ] Admin dashboard page
- [ ] Code management UI
- [ ] Tenant list view

### Phase 3: Subscription Management (Lower Priority)
- [ ] Subscription expiry tracking
- [ ] Renewal reminders
- [ ] Usage limits enforcement
- [ ] Auto-disable expired tenants

---

## Security Considerations

1. **Rate Limiting** - Prevent brute-force code guessing
2. **Code Complexity** - 8 alphanumeric chars = 2.8 trillion combinations
3. **Audit Trail** - Log all code generation and usage
4. **Super Admin Auth** - Separate, stronger authentication
5. **Code Expiry** - Unused codes expire automatically

---

## Files to Create/Modify

### New Files
- `backend/migrations/002_invite_codes.sql`
- `backend/repositories/InviteCodeRepository.js`
- `backend/services/InviteCodeService.js`
- `backend/controllers/AdminController.js`
- `src/pages/AdminDashboardPage.tsx`
- `src/pages/AdminInviteCodesPage.tsx`

### Modified Files
- `backend/controllers/TenantController.js` - Add code validation
- `src/pages/RegisterPage.tsx` - Add invite code field
- `src/lib/apiService.ts` - Add admin APIs
- `backend/middleware/auth.js` - Add super admin check

---

## Estimated Effort

| Phase | Time Estimate |
|-------|---------------|
| Phase 1 | 4-6 hours |
| Phase 2 | 6-8 hours |
| Phase 3 | 4-6 hours |
| **Total** | **14-20 hours** |

---

## Related Documents
- [MULTI_BRANCH_IMPLEMENTATION_PLAN.md](./MULTI_BRANCH_IMPLEMENTATION_PLAN.md)
- [CLOUD_DEPLOYMENT_COST_ESTIMATION.md](./CLOUD_DEPLOYMENT_COST_ESTIMATION.md)

---

*Document Created: November 27, 2025*
*Status: Pending Implementation*
