import { getDb } from '../models/db.js';

export class BranchRepository {
  async createBranch({ id, tenantId, name, type }) {
    const db = await getDb();
    await db.run('INSERT INTO branches (id, tenant_id, name, type) VALUES (?, ?, ?, ?)', [id, tenantId, name, type]);
    await db.close();
  }

  async getBranchesByTenant(tenantId) {
    const db = await getDb();
    const branches = await db.all('SELECT * FROM branches WHERE tenant_id = ?', [tenantId]);
    await db.close();
    return branches;
  }
}
