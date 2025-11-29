import { getDb } from '../models/db.js';

export class TenantRepository {
  async createTenant({ id, name }) {
    const db = await getDb();
    await db.run('INSERT INTO tenants (id, name) VALUES (?, ?)', [id, name]);
    await db.close();
  }

  async getTenantById(id) {
    const db = await getDb();
    const tenant = await db.get('SELECT * FROM tenants WHERE id = ?', [id]);
    await db.close();
    return tenant;
  }

  async getAllTenants() {
    const db = await getDb();
    const tenants = await db.all('SELECT * FROM tenants');
    await db.close();
    return tenants;
  }
}
