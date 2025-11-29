
import express from 'express';
import tenantRoutes from './TenantController.js';
import branchRoutes from './BranchController.js';
import userRoutes from './UserController.js';
import authRoutes from './AuthController.js';
import invoiceRoutes from './InvoiceController.js';
import analyticsRoutes from './AnalyticsController.js';
import insightsRoutes from './AIInsightsController.js';
import inventoryRoutes from './InventoryController.js';
import customerRoutes from './CustomerController.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/branches', branchRoutes);
router.use('/users', userRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/insights', insightsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);

export default router;
