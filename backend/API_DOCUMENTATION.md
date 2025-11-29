# SMB App - Backend API Documentation

**Base URL:** `http://localhost:3001/api`

**Authentication:** All endpoints require JWT Bearer token in Authorization header (except login/register)

**Date:** November 29, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Invoice Management](#invoice-management)
3. [Payment Management](#payment-management)
4. [Tax Rates & Templates](#tax-rates--templates)
5. [Customer Management](#customer-management)
6. [User Management](#user-management)
7. [Tenant Management](#tenant-management)
8. [Branch Management](#branch-management)
9. [Inventory Management](#inventory-management)
10. [Analytics & AI Insights](#analytics--ai-insights)

---

## Authentication

### Register New User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "owner",
  "tenantId": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "tenantId": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "tenantId": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Invoice Management

### Get All Invoices
**GET** `/invoices`

**Query Parameters:**
- `status` (optional): Filter by status (pending, paid, overdue, partial, cancelled)
- `customerId` (optional): Filter by customer ID
- `limit` (optional): Number of records to return
- `offset` (optional): Pagination offset

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "invoiceNumber": "INV-2025-001",
      "customerId": 1,
      "customerName": "ABC Corp",
      "customerEmail": "abc@example.com",
      "customerPhone": "1234567890",
      "issueDate": "2025-11-29T00:00:00.000Z",
      "dueDate": "2025-12-29T00:00:00.000Z",
      "status": "pending",
      "items": [
        {
          "id": 1,
          "description": "Product A",
          "quantity": 2,
          "rate": 100.00,
          "amount": 200.00
        }
      ],
      "subtotal": 200.00,
      "taxAmount": 36.00,
      "discountAmount": 0.00,
      "totalAmount": 236.00,
      "paidAmount": 0.00,
      "outstandingAmount": 236.00,
      "notes": "Payment due in 30 days",
      "tenantId": 1,
      "branchId": 1,
      "createdAt": "2025-11-29T10:00:00.000Z",
      "updatedAt": "2025-11-29T10:00:00.000Z"
    }
  ]
}
```

### Get Single Invoice
**GET** `/invoices/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "invoiceNumber": "INV-2025-001",
    // ... (same structure as above)
  }
}
```

### Create Invoice
**POST** `/invoices`

**Request Body:**
```json
{
  "invoiceNumber": "INV-2025-001",
  "customerId": 1,
  "customerName": "ABC Corp",
  "customerEmail": "abc@example.com",
  "customerPhone": "1234567890",
  "issueDate": "2025-11-29",
  "dueDate": "2025-12-29",
  "items": [
    {
      "description": "Product A",
      "quantity": 2,
      "rate": 100.00,
      "amount": 200.00
    }
  ],
  "subtotal": 200.00,
  "taxAmount": 36.00,
  "discountAmount": 0.00,
  "totalAmount": 236.00,
  "notes": "Payment due in 30 days"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    // ... full invoice object
  }
}
```

### Update Invoice
**PUT** `/invoices/:id`

**Request Body:** (partial update supported)
```json
{
  "status": "paid",
  "notes": "Updated notes"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    // ... updated invoice object
  }
}
```

### Delete Invoice
**DELETE** `/invoices/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

### Update Invoice Status
**PATCH** `/invoices/:id/status`

**Request Body:**
```json
{
  "status": "paid"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... updated invoice
  }
}
```

### Get Overdue Invoices
**GET** `/invoices/alerts/overdue`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    // ... array of overdue invoices
  ]
}
```

### Get Recurring Invoices
**GET** `/invoices/alerts/recurring`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    // ... array of recurring invoices
  ]
}
```

### Get Invoice Statistics
**GET** `/invoices/stats/summary`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalInvoices": 150,
    "totalRevenue": 125000.00,
    "pendingAmount": 35000.00,
    "overdueAmount": 5000.00,
    "paidInvoices": 120,
    "pendingInvoices": 25,
    "overdueInvoices": 5
  }
}
```

---

## Payment Management

### Create Payment
**POST** `/invoices/:id/payments`

**Request Body:**
```json
{
  "amount": 236.00,
  "method": "upi",
  "reference": "UPI-REF-123456",
  "notes": "Payment received",
  "paymentDate": "2025-11-29"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "invoiceId": "invoice-uuid",
    "invoiceNumber": "INV-2025-001",
    "customerId": 1,
    "customerName": "ABC Corp",
    "amount": 236.00,
    "method": "upi",
    "reference": "UPI-REF-123456",
    "notes": "Payment received",
    "paymentDate": "2025-11-29T00:00:00.000Z",
    "createdAt": "2025-11-29T10:00:00.000Z"
  }
}
```

### Get Payments for Invoice
**GET** `/invoices/:id/payments`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-uuid",
      "amount": 236.00,
      "method": "upi",
      // ... payment details
    }
  ]
}
```

### Get All Payments
**GET** `/invoices/payments/all`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    // ... array of all payments
  ]
}
```

### Update Payment
**PUT** `/invoices/payments/:paymentId`

**Request Body:**
```json
{
  "amount": 250.00,
  "notes": "Updated payment amount"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... updated payment
  }
}
```

### Delete Payment
**DELETE** `/invoices/payments/:paymentId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Payment deleted successfully"
}
```

---

## Tax Rates & Templates

### Get Tax Rates
**GET** `/invoices/meta/tax-rates`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "GST 18%",
      "rate": 18.00,
      "description": "Standard GST rate",
      "isActive": true,
      "tenantId": 1,
      "createdAt": "2025-11-29T10:00:00.000Z"
    }
  ]
}
```

### Create Tax Rate
**POST** `/invoices/meta/tax-rates`

**Request Body:**
```json
{
  "name": "GST 5%",
  "rate": 5.00,
  "description": "Reduced GST rate",
  "isActive": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 2,
    // ... tax rate details
  }
}
```

### Update Tax Rate
**PUT** `/invoices/meta/tax-rates/:id`

**Response:** `200 OK`

### Get Invoice Templates
**GET** `/invoices/meta/templates`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Standard Template",
      "description": "Default invoice template",
      "template": {
        "header": "...",
        "footer": "...",
        "styles": {}
      },
      "isDefault": true,
      "tenantId": 1,
      "createdAt": "2025-11-29T10:00:00.000Z"
    }
  ]
}
```

### Create Invoice Template
**POST** `/invoices/meta/templates`

**Request Body:**
```json
{
  "name": "Modern Template",
  "description": "Modern invoice design",
  "template": {
    "header": "...",
    "footer": "...",
    "styles": {}
  },
  "isDefault": false
}
```

**Response:** `201 Created`

### Update Invoice Template
**PUT** `/invoices/meta/templates/:id`

**Response:** `200 OK`

---

## Customer Management

### Get All Customers
**GET** `/customers`

**Query Parameters:**
- `search` (optional): Search by name, email, or phone
- `limit` (optional): Number of records to return
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC Corp",
      "email": "abc@example.com",
      "phone": "1234567890",
      "address": "123 Business St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "gstNumber": "27AAAAA0000A1Z5",
      "totalSpent": 50000.00,
      "outstandingAmount": 5000.00,
      "lastPurchaseDate": "2025-11-29T00:00:00.000Z",
      "tenantId": 1,
      "branchId": 1,
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

### Get Single Customer
**GET** `/customers/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "ABC Corp",
    // ... customer details
  }
}
```

### Create Customer
**POST** `/customers`

**Request Body:**
```json
{
  "name": "ABC Corp",
  "email": "abc@example.com",
  "phone": "1234567890",
  "address": "123 Business St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "gstNumber": "27AAAAA0000A1Z5"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 1,
    // ... full customer object
  }
}
```

### Update Customer
**PUT** `/customers/:id`

**Request Body:** (partial update supported)
```json
{
  "phone": "9876543210",
  "address": "456 New Address"
}
```

**Response:** `200 OK`

### Delete Customer
**DELETE** `/customers/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

### Search Customers
**GET** `/customers/search/query?q=ABC`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    // ... matching customers
  ]
}
```

### Get Top Customers
**GET** `/customers/analytics/top?limit=10`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC Corp",
      "totalSpent": 50000.00,
      "invoiceCount": 25
    }
  ]
}
```

### Get Customer Statistics
**GET** `/customers/stats/summary`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalCustomers": 150,
    "activeCustomers": 120,
    "newCustomersThisMonth": 15,
    "totalRevenue": 500000.00,
    "averageOrderValue": 3333.33
  }
}
```

### Update Customer Metrics
**POST** `/customers/:id/update-metrics`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Customer metrics updated"
}
```

---

## User Management

### Get All Users
**GET** `/users`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "tenantId": 1,
      "branchId": 1,
      "isActive": true,
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

### Get User Profile
**GET** `/users/me`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "owner",
    "tenantId": 1,
    "branchId": 1
  }
}
```

### Update User Profile
**PUT** `/users/:id`

**Request Body:**
```json
{
  "name": "John Updated",
  "role": "manager"
}
```

**Response:** `200 OK`

### Delete User
**DELETE** `/users/:id`

**Response:** `200 OK`

---

## Tenant Management

### Get All Tenants
**GET** `/tenants`

**Response:** `200 OK`

### Create Tenant
**POST** `/tenants`

**Request Body:**
```json
{
  "businessName": "ABC Business",
  "ownerName": "John Doe",
  "email": "john@abc.com",
  "phone": "1234567890",
  "address": "123 Business St",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

**Response:** `201 Created`

### Update Tenant
**PUT** `/tenants/:id`

**Response:** `200 OK`

---

## Branch Management

### Get All Branches
**GET** `/branches`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Main Branch",
      "code": "MAIN",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "tenantId": 1,
      "isActive": true,
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

### Create Branch
**POST** `/branches`

**Request Body:**
```json
{
  "name": "Branch 2",
  "code": "BR2",
  "address": "456 Branch St",
  "city": "Delhi",
  "state": "Delhi"
}
```

**Response:** `201 Created`

### Update Branch
**PUT** `/branches/:id`

**Response:** `200 OK`

### Delete Branch
**DELETE** `/branches/:id`

**Response:** `200 OK`

---

## Inventory Management

### Get All Products
**GET** `/inventory`

**Query Parameters:**
- `category` (optional): Filter by category
- `lowStock` (optional): Show only low stock items
- `search` (optional): Search by name or SKU

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product A",
      "sku": "PRD-001",
      "category": "Electronics",
      "currentStock": 50,
      "minimumStock": 10,
      "price": 100.00,
      "tenantId": 1,
      "branchId": 1,
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

### Create Product
**POST** `/inventory`

**Request Body:**
```json
{
  "name": "Product B",
  "sku": "PRD-002",
  "category": "Electronics",
  "currentStock": 100,
  "minimumStock": 20,
  "price": 150.00
}
```

**Response:** `201 Created`

### Update Product
**PUT** `/inventory/:id`

**Response:** `200 OK`

### Delete Product
**DELETE** `/inventory/:id`

**Response:** `200 OK`

---

## Analytics & AI Insights

### Get Dashboard Analytics
**GET** `/analytics/dashboard`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "revenue": {
      "today": 5000.00,
      "thisWeek": 25000.00,
      "thisMonth": 100000.00
    },
    "invoices": {
      "total": 150,
      "pending": 25,
      "paid": 120,
      "overdue": 5
    },
    "customers": {
      "total": 150,
      "active": 120,
      "new": 15
    },
    "inventory": {
      "totalProducts": 500,
      "lowStock": 15,
      "outOfStock": 3
    }
  }
}
```

### Get AI Insights
**GET** `/ai-insights/comprehensive`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "revenue_trend",
        "priority": "high",
        "title": "Revenue Growth Detected",
        "description": "Revenue increased by 15% this month",
        "recommendation": "Consider expanding inventory",
        "confidence": 0.85
      }
    ],
    "predictions": [
      {
        "metric": "revenue",
        "period": "next_month",
        "value": 120000.00,
        "confidence": 0.78
      }
    ]
  }
}
```

---

## Error Responses

All endpoints follow consistent error response format:

**400 Bad Request**
```json
{
  "success": false,
  "error": "Validation error message"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid or missing token"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Access denied"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Authentication Flow

1. **Register/Login** to get JWT token
2. Include token in all subsequent requests:
   ```
   Authorization: Bearer <your-token>
   ```
3. Token contains user info (id, tenantId, branchId, role)
4. Backend automatically filters data by tenantId and branchId

---

## Multi-Tenancy & Branch Support

- All data is automatically scoped to the authenticated user's tenant
- Branch managers only see data for their assigned branch
- Owners/Admins see data across all branches within their tenant
- TenantId and BranchId are automatically added to all created records

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit`: Number of records per page (default: 50)
- `offset`: Number of records to skip (default: 0)

**Example:**
```
GET /invoices?limit=20&offset=40
```

---

## Date Format

All dates are in ISO 8601 format:
```
2025-11-29T10:30:00.000Z
```

---

## Payment Methods

Supported payment methods:
- `cash`
- `card`
- `bank_transfer`
- `upi`
- `cheque`
- `online`

---

## Invoice Statuses

- `pending`: Invoice created, awaiting payment
- `paid`: Fully paid
- `partial`: Partially paid
- `overdue`: Due date passed, not fully paid
- `cancelled`: Invoice cancelled

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get invoices (replace TOKEN with actual token)
curl -X GET http://localhost:3001/api/invoices \
  -H "Authorization: Bearer TOKEN"

# Create invoice
curl -X POST http://localhost:3001/api/invoices \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-2025-001",
    "customerId": 1,
    "customerName": "ABC Corp",
    "items": [...]
  }'
```

### Using Postman

1. Import collection from `backend/postman_collection.json` (if available)
2. Set environment variable `BASE_URL` to `http://localhost:3001/api`
3. Set environment variable `TOKEN` after login
4. All requests will use Bearer token automatically

---

## Best Practices

1. **Always validate input** on frontend before sending to API
2. **Handle errors gracefully** and show user-friendly messages
3. **Use loading states** while API calls are in progress
4. **Cache frequently accessed data** (tax rates, templates)
5. **Implement retry logic** for failed requests
6. **Log errors** for debugging
7. **Use optimistic updates** for better UX

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production:
- Max 100 requests per minute per user
- Max 1000 requests per hour per tenant

---

## Version History

**v1.0** (November 2025)
- Initial API release
- Invoice, Payment, Customer, User management
- Multi-tenant support
- Branch management
- Authentication & Authorization

---

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/TamizhAras/smb-enhanced-billing-app/issues)
- Email: support@example.com

---

**Last Updated:** November 29, 2025
