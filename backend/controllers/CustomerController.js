import express from 'express';
import { CustomerRepository } from '../repositories/CustomerRepository.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const customerRepository = new CustomerRepository();

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

// Get all customers with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { status, type, category, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (limit) filters.limit = parseInt(limit);

    const customers = await customerRepository.findAll(tenantId, branchId, filters);
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId, role } = req.user;

    // Check for duplicate email or phone
    if (req.body.email) {
      const existing = await customerRepository.findByEmail(req.body.email, tenantId);
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          error: 'Customer with this email already exists' 
        });
      }
    }

    const customerData = {
      ...req.body,
      id: uuidv4(),
      tenantId,
      branchId: role === 'owner' ? req.body.branchId || branchId : branchId
    };

    const customer = await customerRepository.create(customerData);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerRepository.findById(id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Check tenant access
    if (customer.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await customerRepository.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Check tenant access
    if (existing.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Check for duplicate email if updating
    if (req.body.email && req.body.email !== existing.email) {
      const duplicate = await customerRepository.findByEmail(req.body.email, req.user.tenantId);
      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          error: 'Another customer with this email already exists' 
        });
      }
    }

    const updated = await customerRepository.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await customerRepository.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Check tenant access
    if (existing.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await customerRepository.delete(id);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search customers
router.get('/search/query', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const customers = await customerRepository.searchCustomers(tenantId, branchId, q);
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top customers
router.get('/analytics/top', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { limit } = req.query;

    const customers = await customerRepository.getTopCustomers(
      tenantId, 
      branchId, 
      limit ? parseInt(limit) : 10
    );
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get customer statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const stats = await customerRepository.getCustomerStats(tenantId, branchId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update customer spending metrics
router.post('/:id/update-metrics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await customerRepository.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Check tenant access
    if (existing.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await customerRepository.updateSpentMetrics(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating customer metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
