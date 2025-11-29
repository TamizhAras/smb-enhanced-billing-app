import { getDb } from '../models/db.js';

export class UserRepository {
  async createUser({ id, tenantId, branchId, name, email, passwordHash, role }) {
    const db = getDb();
    await db.query(
      'INSERT INTO users (id, tenant_id, branch_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, tenantId, branchId, name, email, passwordHash, role]
    );
  }

  async getUserByUsername(username) {
    // Support both email and name as username
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 OR name = $1 LIMIT 1',
      [username]
    );
    return result.rows[0];
  }

  async getUsersByTenant(tenantId) {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows;
  }
}
