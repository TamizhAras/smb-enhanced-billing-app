import { getDb } from '../models/db.js';

export class BranchRepository {
  async createBranch({ id, tenantId, name, address, email, phone }) {
    const db = getDb();
    await db.query(
      'INSERT INTO branches (id, tenant_id, name, address, email, phone) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, tenantId, name, address, email, phone]
    );
  }

  async getBranchesByTenant(tenantId) {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM branches WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows;
  }
}
