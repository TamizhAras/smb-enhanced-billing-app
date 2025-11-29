import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { InventoryRepository } from '../repositories/InventoryRepository.js';

const router = express.Router();
const inventoryRepo = new InventoryRepository();

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { branch } = req.query; // Optional branch filter for 'all' view
    
    const items = await inventoryRepo.findAll(
      tenantId, 
      branch || branchId
    );
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get single inventory item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    
    const item = await inventoryRepo.findById(id, tenantId);
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create inventory item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId, role } = req.user;
    const { 
      name, 
      sku, 
      category, 
      quantity, 
      min_stock_level, 
      cost_price, 
      selling_price,
      branch_id // Optional: admin can specify branch
    } = req.body;

    // Validation
    if (!name || !sku || !category) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, sku, category' 
      });
    }

    // Check if SKU already exists
    const existingSku = await inventoryRepo.findBySku(sku, tenantId);
    if (existingSku) {
      return res.status(409).json({ 
        error: 'SKU already exists',
        existingItem: existingSku
      });
    }

    // Determine target branch
    let targetBranchId = branchId;
    if (branch_id && (role === 'admin' || role === 'owner')) {
      targetBranchId = branch_id;
    }

    const inventoryData = {
      id: uuidv4(),
      tenant_id: tenantId,
      branch_id: targetBranchId,
      name,
      sku,
      category,
      quantity: quantity || 0,
      min_stock_level: min_stock_level || 0,
      cost_price: cost_price || 0,
      selling_price: selling_price || 0
    };

    const newItem = await inventoryRepo.create(inventoryData);
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const updates = req.body;

    // Check if item exists
    const existingItem = await inventoryRepo.findById(id, tenantId);
    if (!existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // If updating SKU, check for duplicates
    if (updates.sku && updates.sku !== existingItem.sku) {
      const existingSku = await inventoryRepo.findBySku(updates.sku, tenantId, id);
      if (existingSku) {
        return res.status(409).json({ 
          error: 'SKU already exists',
          existingItem: existingSku
        });
      }
    }

    const updatedItem = await inventoryRepo.update(id, tenantId, updates);
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const existingItem = await inventoryRepo.findById(id, tenantId);
    if (!existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await inventoryRepo.delete(id, tenantId);
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Adjust stock (add/remove)
router.post('/:id/adjust-stock', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { quantity_change, reason } = req.body;

    if (quantity_change === undefined || quantity_change === 0) {
      return res.status(400).json({ error: 'quantity_change is required and must be non-zero' });
    }

    const existingItem = await inventoryRepo.findById(id, tenantId);
    if (!existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if adjustment would result in negative stock
    if (existingItem.quantity + quantity_change < 0) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        currentQuantity: existingItem.quantity,
        requestedChange: quantity_change
      });
    }

    const updatedItem = await inventoryRepo.adjustStock(id, tenantId, quantity_change);
    
    res.json({
      ...updatedItem,
      adjustment: {
        change: quantity_change,
        reason: reason || 'Manual adjustment',
        previousQuantity: existingItem.quantity
      }
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Get low stock items
router.get('/alerts/low-stock', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { branch } = req.query;
    
    const items = await inventoryRepo.getLowStockItems(
      tenantId,
      branch || branchId
    );
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Get inventory statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { branch } = req.query;
    
    const stats = await inventoryRepo.getInventoryStats(
      tenantId,
      branch || branchId
    );
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ error: 'Failed to fetch inventory statistics' });
  }
});

// Get categories
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const { tenantId, branchId } = req.user;
    const { branch } = req.query;
    
    const categories = await inventoryRepo.getCategories(
      tenantId,
      branch || branchId
    );
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
