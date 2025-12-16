import { getDb } from '../models/db.js';

export class BranchRepository {
  async createBranch({ id, tenantId, name, type, address, email, phone }) {
    const db = getDb();
    await db.query(
      'INSERT INTO branches (id, tenant_id, name, type, address, email, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, tenantId, name, type, address, email, phone]
    );
  }

  async getBranchesByTenant(tenantId) {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM branches WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }

  async getBranchById(id) {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM branches WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async updateBranch(id, { name, type, address, email, phone }) {
    const db = getDb();
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const result = await db.query(
      `UPDATE branches SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteBranch(id) {
    const db = getDb();
    const result = await db.query(
      'DELETE FROM branches WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  async checkDuplicateName(tenantId, name, excludeId = null) {
    const db = getDb();
    let query = 'SELECT id FROM branches WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)';
    const params = [tenantId, name];
    
    if (excludeId) {
      query += ' AND id != $3';
      params.push(excludeId);
    }
    
    const result = await db.query(query, params);
    return result.rows.length > 0;
  }
}
