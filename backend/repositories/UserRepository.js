import { getDb } from '../models/db.js';

export class UserRepository {
  async createUser({ id, tenantId, branchId, username, passwordHash, role }) {
    const db = await getDb();
    await db.run('INSERT INTO users (id, tenant_id, branch_id, username, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)', [id, tenantId, branchId, username, passwordHash, role]);
    await db.close();
  }

  async getUserByUsername(username) {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    await db.close();
    return user;
  }

  async getUsersByTenant(tenantId) {
    const db = await getDb();
    const users = await db.all('SELECT * FROM users WHERE tenant_id = ?', [tenantId]);
    await db.close();
    return users;
  }
}
