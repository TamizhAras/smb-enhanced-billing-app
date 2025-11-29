import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../models/db.js';

const router = express.Router();

// Owner Dashboard - Aggregate stats for all branches
router.get('/dashboard/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const db = await getDb();
  
  try {
    // Get branch-level stats
    const branchStats = await db.all(
      `SELECT 
        b.id as branchId,
        b.name as branchName,
        b.type as branchType,
        COALESCE(SUM(i.total_amount), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) as paidRevenue,
        COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.total_amount ELSE 0 END), 0) as pendingRevenue,
        COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.total_amount ELSE 0 END), 0) as overdueRevenue,
        COUNT(DISTINCT i.id) as invoiceCount,
        COUNT(DISTINCT i.customer_name) as customerCount
       FROM branches b
       LEFT JOIN invoices i ON b.id = i.branch_id AND i.tenant_id = ?
       WHERE b.tenant_id = ?
       GROUP BY b.id, b.name, b.type`,
      [tenantId, tenantId]
    );

    // Calculate averages
    const branches = branchStats.map(branch => ({
      ...branch,
      avgInvoiceValue: branch.invoiceCount > 0 
        ? branch.totalRevenue / branch.invoiceCount 
        : 0
    }));

    // Calculate totals
    const totals = branches.reduce((acc, branch) => ({
      totalRevenue: acc.totalRevenue + branch.totalRevenue,
      paidRevenue: acc.paidRevenue + branch.paidRevenue,
      pendingRevenue: acc.pendingRevenue + branch.pendingRevenue,
      overdueRevenue: acc.overdueRevenue + branch.overdueRevenue,
      totalInvoices: acc.totalInvoices + branch.invoiceCount,
      totalCustomers: acc.totalCustomers + branch.customerCount
    }), {
      totalRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      overdueRevenue: 0,
      totalInvoices: 0,
      totalCustomers: 0
    });

    await db.close();
    res.json({ branches, totals });
  } catch (error) {
    await db.close();
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});


// Revenue by branch for a tenant
router.get('/revenue-by-branch/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const db = await getDb();
  const rows = await db.all(
    `SELECT branch_id, SUM(amount) as totalRevenue, COUNT(*) as invoiceCount, b.name as branchName
     FROM invoices i
     LEFT JOIN branches b ON i.branch_id = b.id
     WHERE i.tenant_id = ?
     GROUP BY branch_id`,
    [tenantId]
  );
  await db.close();
  res.json(rows);
});

// Total invoices for a tenant
router.get('/total-invoices/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const db = await getDb();
  const row = await db.get(
    `SELECT COUNT(*) as totalInvoices FROM invoices WHERE tenant_id = ?`,
    [tenantId]
  );
  await db.close();
  res.json(row);
});

// Customer count for a tenant
router.get('/customer-count/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const db = await getDb();
  const row = await db.get(
    `SELECT COUNT(DISTINCT customer_name) as customerCount FROM invoices WHERE tenant_id = ?`,
    [tenantId]
  );
  await db.close();
  res.json(row);
});

// Overdue revenue for a tenant
router.get('/overdue-revenue/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const db = await getDb();
  const row = await db.get(
    `SELECT SUM(amount) as overdueRevenue FROM invoices WHERE tenant_id = ? AND status = 'overdue'`,
    [tenantId]
  );
  await db.close();
  res.json(row);
});

// Pending revenue for a tenant
router.get('/pending-revenue/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const db = await getDb();
  const row = await db.get(
    `SELECT SUM(amount) as pendingRevenue FROM invoices WHERE tenant_id = ? AND status = 'pending'`,
    [tenantId]
  );
  await db.close();
  res.json(row);
});

// Monthly revenue for a tenant (last 6 months)
router.get('/monthly-revenue/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const db = await getDb();
  const rows = await db.all(
    `SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as totalRevenue
     FROM invoices
     WHERE tenant_id = ?
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`,
    [tenantId]
  );
  await db.close();
  res.json(rows.reverse());
});

export default router;
