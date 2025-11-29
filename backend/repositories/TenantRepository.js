import { getDb } from '../models/db.js';

export class TenantRepository {
  async createTenant({ id, name, email }) {
    const db = getDb();
    await db.query(
      'INSERT INTO tenants (id, name, email) VALUES ($1, $2, $3)',
      [id, name, email]
    );
  }

  async getTenantById(id) {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM tenants WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0];
  }

  async getAllTenants() {
    const db = getDb();
    const result = await db.query('SELECT * FROM tenants');
    return result.rows;
  }
}
