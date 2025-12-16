import express from 'express';
import { BranchService } from '../services/BranchService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const branchService = new BranchService();

// Middleware to check if user is owner
const requireOwner = (req, res, next) => {
  if (req.user.role === 'owner') return next();
  return res.status(403).json({ error: 'Only owners can perform this action' });
};

// List all branches for tenant (authenticated users)
router.get('/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Verify user belongs to this tenant
    if (req.user.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const branches = await branchService.getBranchesByTenant(tenantId);
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single branch by ID
router.get('/branch/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await branchService.getBranchById(id);
    
    // Verify user belongs to this tenant
    if (req.user.tenantId !== branch.tenant_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(404).json({ error: error.message });
  }
});

// Create branch (owner only)
router.post('/', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { name, type, address, email, phone, location, contact_phone, contact_email } = req.body;
    const tenantId = req.user.tenantId;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Branch name is required' });
    }
    
    if (name.length > 50) {
      return res.status(400).json({ error: 'Branch name must be 50 characters or less' });
    }
    
    const branch = await branchService.createBranch(
      tenantId,
      name.trim(),
      type || '',
      address || location || '',
      email || contact_email || '',
      phone || contact_phone || ''
    );
    
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update branch (owner only)
router.put('/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, address, email, phone } = req.body;
    const tenantId = req.user.tenantId;
    
    // Validation
    if (name !== undefined && name.trim().length === 0) {
      return res.status(400).json({ error: 'Branch name cannot be empty' });
    }
    
    if (name && name.length > 50) {
      return res.status(400).json({ error: 'Branch name must be 50 characters or less' });
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (type !== undefined) updates.type = type;
    if (address !== undefined) updates.address = address;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    
    const updatedBranch = await branchService.updateBranch(id, tenantId, updates);
    res.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete branch (owner only)
router.delete('/:id', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    
    await branchService.deleteBranch(id, tenantId);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Check for duplicate branch name
router.post('/check-duplicate', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { name, excludeId } = req.body;
    const tenantId = req.user.tenantId;
    
    const isDuplicate = await branchService.checkDuplicateName(tenantId, name, excludeId);
    res.json({ isDuplicate });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk import branches from CSV (owner only)
router.post('/import', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { branches } = req.body;
    const tenantId = req.user.tenantId;
    
    if (!Array.isArray(branches) || branches.length === 0) {
      return res.status(400).json({ error: 'Branches array is required' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const branch of branches) {
      try {
        await branchService.createBranch(
          tenantId,
          branch.name,
          branch.type || '',
          branch.address || '',
          branch.email || '',
          branch.phone || ''
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          name: branch.name,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error importing branches:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch operations on branches (owner only)
router.post('/batch', authenticateToken, requireOwner, async (req, res) => {
  try {
    const { action, branchIds } = req.body;
    const tenantId = req.user.tenantId;
    
    if (!Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({ error: 'Branch IDs array is required' });
    }

    if (!['delete', 'activate', 'deactivate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be delete, activate, or deactivate' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const branchId of branchIds) {
      try {
        if (action === 'delete') {
          await branchService.deleteBranch(branchId, tenantId);
        } else {
          const status = action === 'activate' ? 'active' : 'inactive';
          await branchService.updateBranch(branchId, tenantId, { status });
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          branchId,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error performing batch operation:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
