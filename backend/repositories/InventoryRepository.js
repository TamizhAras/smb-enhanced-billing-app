import { getDb } from '../models/db.js';

export class InventoryRepository {
  async findAll(tenantId, branchId = null) {
    const db = await getDb();
    let query = 'SELECT * FROM inventory WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (branchId && branchId !== 'all') {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }
    
    query += ' ORDER BY created_at DESC';
    return db.all(query, params);
  }

  async findById(id, tenantId) {
    const db = await getDb();
    return db.get(
      'SELECT * FROM inventory WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
  }

  async findBySku(sku, tenantId, excludeId = null) {
    const db = await getDb();
    let query = 'SELECT * FROM inventory WHERE sku = ? AND tenant_id = ?';
    const params = [sku, tenantId];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    return db.get(query, params);
  }

  async create(inventoryData) {
    const db = await getDb();
    const {
      id,
      tenant_id,
      branch_id,
      name,
      sku,
      category,
      quantity,
      min_stock_level,
      cost_price,
      selling_price
    } = inventoryData;

    const result = await db.run(
      `INSERT INTO inventory (
        id, tenant_id, branch_id, name, sku, category, 
        quantity, min_stock_level, cost_price, selling_price,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, tenant_id, branch_id, name, sku, category, quantity, min_stock_level, cost_price, selling_price]
    );

    return this.findById(id, tenant_id);
  }

  async update(id, tenantId, updates) {
    const db = await getDb();
    const allowedFields = ['name', 'sku', 'category', 'quantity', 'min_stock_level', 'cost_price', 'selling_price'];
    
    const updateFields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    updateFields.push('updated_at = datetime(\'now\')');
    values.push(id, tenantId);
    
    await db.run(
      `UPDATE inventory SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
    
    return this.findById(id, tenantId);
  }

  async delete(id, tenantId) {
    const db = await getDb();
    await db.run(
      'DELETE FROM inventory WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
  }

  async adjustStock(id, tenantId, quantityChange) {
    const db = await getDb();
    await db.run(
      `UPDATE inventory 
       SET quantity = quantity + ?, 
           updated_at = datetime('now')
       WHERE id = ? AND tenant_id = ?`,
      [quantityChange, id, tenantId]
    );
    
    return this.findById(id, tenantId);
  }

  async getLowStockItems(tenantId, branchId = null) {
    const db = await getDb();
    let query = `
      SELECT * FROM inventory 
      WHERE tenant_id = ? 
      AND quantity <= min_stock_level
    `;
    const params = [tenantId];
    
    if (branchId && branchId !== 'all') {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }
    
    query += ' ORDER BY quantity ASC';
    return db.all(query, params);
  }

  async getInventoryStats(tenantId, branchId = null) {
    const db = await getDb();
    let whereClause = 'WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (branchId && branchId !== 'all') {
      whereClause += ' AND branch_id = ?';
      params.push(branchId);
    }
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity * cost_price) as total_value,
        SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM inventory
      ${whereClause}
    `, params);
    
    return stats;
  }

  async getCategories(tenantId, branchId = null) {
    const db = await getDb();
    let query = 'SELECT DISTINCT category FROM inventory WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (branchId && branchId !== 'all') {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }
    
    query += ' ORDER BY category';
    const rows = await db.all(query, params);
    return rows.map(r => r.category);
  }
}
