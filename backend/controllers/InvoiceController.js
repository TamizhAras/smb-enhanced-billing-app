import express from 'express';
import { InvoiceRepository } from '../repositories/InvoiceRepository.js';
import { CustomerRepository } from '../repositories/CustomerRepository.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const invoiceRepository = new InvoiceRepository();
const customerRepository = new CustomerRepository();

// ============================================================================
// INVOICE ENDPOINTS
// ============================================================================

// Get all invoices with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { status, customerId, startDate, endDate, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (limit) filters.limit = parseInt(limit);

    const invoices = await invoiceRepository.findAll(tenantId, branchId, filters);
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId, role } = req.user;
    const invoiceData = {
      ...req.body,
      id: uuidv4(),
      tenantId,
      branchId: role === 'owner' ? req.body.branchId || branchId : branchId
    };

    const invoice = await invoiceRepository.createInvoice(invoiceData);
    
    // Update customer metrics if invoice has a customer
    if (invoice.customerId) {
      try {
        await customerRepository.updateSpentMetrics(invoice.customerId);
      } catch (metricError) {
        console.error('Error updating customer metrics:', metricError);
        // Don't fail the invoice creation if metrics update fails
      }
    }
    
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get invoice by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceRepository.findById(id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Check tenant access
    if (invoice.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update invoice
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await invoiceRepository.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Check tenant access
    if (existing.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await invoiceRepository.update(id, req.body);
    
    // Update customer metrics if invoice has a customer
    if (updated.customerId) {
      try {
        await customerRepository.updateSpentMetrics(updated.customerId);
      } catch (metricError) {
        console.error('Error updating customer metrics:', metricError);
        // Don't fail the invoice update if metrics update fails
      }
    }
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await invoiceRepository.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Check tenant access
    if (existing.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const customerId = existing.customerId;
    await invoiceRepository.delete(id);
    
    // Update customer metrics if invoice had a customer
    if (customerId) {
      try {
        await customerRepository.updateSpentMetrics(customerId);
      } catch (metricError) {
        console.error('Error updating customer metrics:', metricError);
        // Don't fail the invoice deletion if metrics update fails
      }
    }
    
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update invoice status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const existing = await invoiceRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Check tenant access
    if (existing.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await invoiceRepository.updateStatus(id, status);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get overdue invoices
router.get('/alerts/overdue', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const invoices = await invoiceRepository.getOverdueInvoices(tenantId, branchId);
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recurring invoices
router.get('/alerts/recurring', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const invoices = await invoiceRepository.getRecurringInvoices(tenantId);
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching recurring invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get invoice statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { startDate, endDate } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await invoiceRepository.getInvoiceStats(tenantId, branchId, filters);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PAYMENT ENDPOINTS
// ============================================================================

// Add payment to invoice
router.post('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { id: invoiceId } = req.params;
    const { tenantId, branchId } = req.user;

    // Verify invoice exists
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Check tenant access
    if (invoice.tenantId !== tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const paymentData = {
      ...req.body,
      id: uuidv4(),
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      tenantId,
      branchId
    };

    const payment = await invoiceRepository.createPayment(paymentData);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payments for an invoice
router.get('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const { id: invoiceId } = req.params;

    // Verify invoice exists and user has access
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (invoice.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const payments = await invoiceRepository.getPaymentsByInvoice(invoiceId);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all payments
router.get('/payments/all', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { startDate, endDate, method, limit } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (method) filters.method = method;
    if (limit) filters.limit = parseInt(limit);

    const payments = await invoiceRepository.getAllPayments(tenantId, branchId, filters);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update payment
router.put('/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await invoiceRepository.findPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check tenant access
    if (payment.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await invoiceRepository.updatePayment(paymentId, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete payment
router.delete('/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await invoiceRepository.findPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Check tenant access
    if (payment.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await invoiceRepository.deletePayment(paymentId);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TAX RATES ENDPOINTS
// ============================================================================

// Get tax rates
router.get('/meta/tax-rates', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { activeOnly } = req.query;

    const taxRates = await invoiceRepository.getTaxRates(
      tenantId, 
      branchId,
      activeOnly !== 'false'
    );
    res.json({ success: true, data: taxRates });
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create tax rate
router.post('/meta/tax-rates', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;

    const taxRateData = {
      ...req.body,
      id: uuidv4(),
      tenantId,
      branchId: req.body.branchId || branchId
    };

    const taxRate = await invoiceRepository.createTaxRate(taxRateData);
    res.status(201).json({ success: true, data: taxRate });
  } catch (error) {
    console.error('Error creating tax rate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update tax rate
router.put('/meta/tax-rates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const taxRate = await invoiceRepository.findTaxRateById(id);

    if (!taxRate) {
      return res.status(404).json({ success: false, error: 'Tax rate not found' });
    }

    // Check tenant access
    if (taxRate.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await invoiceRepository.updateTaxRate(id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating tax rate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TEMPLATE ENDPOINTS
// ============================================================================

// Get invoice templates
router.get('/meta/templates', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const templates = await invoiceRepository.getTemplates(tenantId);
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create template
router.post('/meta/templates', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    const templateData = {
      ...req.body,
      id: uuidv4(),
      tenantId
    };

    const template = await invoiceRepository.createTemplate(templateData);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update template
router.put('/meta/templates/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await invoiceRepository.findTemplateById(id);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Check tenant access
    if (template.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await invoiceRepository.updateTemplate(id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// LEGACY ENDPOINTS (for backward compatibility)
// ============================================================================

// Get invoices by branch
router.get('/branch/:branchId', authenticateToken, async (req, res) => {
  try {
    const { branchId } = req.params;
    const invoices = await invoiceRepository.getInvoicesByBranch(branchId);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices by branch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get invoices by tenant
router.get('/tenant/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const invoices = await invoiceRepository.getInvoicesByTenant(tenantId);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices by tenant:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
