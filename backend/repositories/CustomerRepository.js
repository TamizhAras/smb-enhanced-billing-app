import { getDb } from '../models/db.js';

export class CustomerRepository {
  // ============================================================================
  // CUSTOMER CRUD OPERATIONS
  // ============================================================================

  async findAll(tenantId, branchId = null, filters = {}) {
    const db = await getDb();
    let query = `
        SELECT 
          id, name, email, phone, address, city, state, postal_code as postalCode,
          country, gst_number as gstNumber, pan_number as panNumber,
          type, category, tags, total_spent as totalSpent, total_orders as totalOrders,
          average_order_value as averageOrderValue, last_order_date as lastOrderDate,
          credit_limit as creditLimit, payment_terms as paymentTerms, status,
          preferred_payment_method as preferredPaymentMethod, notes,
          acquisition_source as acquisitionSource, referred_by as referredBy,
          tenant_id as tenantId, branch_id as branchId,
          created_at as createdAt, updated_at as updatedAt
        FROM customers
        WHERE tenant_id = ?
      `;
      const params = [tenantId];

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const customers = await db.all(query, params);
      return customers.map(c => {
        let tags = [];
        if (c.tags) {
          try {
            tags = (typeof c.tags === 'string' && c.tags !== 'null' && c.tags.trim() !== '') 
              ? JSON.parse(c.tags) 
              : [];
          } catch (e) {
            console.warn('Failed to parse customer tags:', c.tags);
            tags = [];
          }
        }
        return {
          ...c,
          tags
        };
      });
  }

  async findById(id) {
    const db = await getDb();
    const customer = await db.get(`
        SELECT 
          id, name, email, phone, address, city, state, postal_code as postalCode,
          country, gst_number as gstNumber, pan_number as panNumber,
          type, category, tags, total_spent as totalSpent, total_orders as totalOrders,
          average_order_value as averageOrderValue, last_order_date as lastOrderDate,
          credit_limit as creditLimit, payment_terms as paymentTerms, status,
          preferred_payment_method as preferredPaymentMethod, notes,
          acquisition_source as acquisitionSource, referred_by as referredBy,
          tenant_id as tenantId, branch_id as branchId,
          created_at as createdAt, updated_at as updatedAt
        FROM customers WHERE id = ?
      `, [id]);

      if (customer && customer.tags) {
        try {
          customer.tags = (typeof customer.tags === 'string' && customer.tags !== 'null' && customer.tags.trim() !== '') 
            ? JSON.parse(customer.tags) 
            : [];
        } catch (e) {
          customer.tags = [];
        }
      }
      return customer;
  }

  async findByEmail(email, tenantId) {
    const db = await getDb();
    const customer = await db.get(`
        SELECT * FROM customers 
        WHERE email = ? AND tenant_id = ?
      `, [email, tenantId]);
      
      if (customer && customer.tags) {
        try {
          customer.tags = (typeof customer.tags === 'string' && customer.tags !== 'null' && customer.tags.trim() !== '') 
            ? JSON.parse(customer.tags) 
            : [];
        } catch (e) {
          customer.tags = [];
        }
      }
      return customer;
  }

  async findByPhone(phone, tenantId) {
    const db = await getDb();
    const customer = await db.get(`
        SELECT * FROM customers 
        WHERE phone = ? AND tenant_id = ?
      `, [phone, tenantId]);
      
      if (customer && customer.tags) {
        try {
          customer.tags = (typeof customer.tags === 'string' && customer.tags !== 'null' && customer.tags.trim() !== '') 
            ? JSON.parse(customer.tags) 
            : [];
        } catch (e) {
          customer.tags = [];
        }
      }
      return customer;
  }

  async create(customerData) {
    const db = await getDb();
    const {
        id, name, email, phone, address, city, state, postalCode, country,
        gstNumber, panNumber, type, category, tags, totalSpent, totalOrders,
        averageOrderValue, lastOrderDate, creditLimit, paymentTerms, status,
        preferredPaymentMethod, notes, acquisitionSource, referredBy,
        tenantId, branchId
      } = customerData;

      await db.run(`
        INSERT INTO customers (
          id, name, email, phone, address, city, state, postal_code, country,
          gst_number, pan_number, type, category, tags, total_spent, total_orders,
          average_order_value, last_order_date, credit_limit, payment_terms,
          status, preferred_payment_method, notes, acquisition_source, referred_by,
          tenant_id, branch_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, email || null, phone || null, address || null, city || null,
        state || null, postalCode || null, country || null, gstNumber || null,
        panNumber || null, type || 'regular', category || null,
        tags ? JSON.stringify(tags) : '[]', totalSpent || 0, totalOrders || 0,
        averageOrderValue || 0, lastOrderDate || null, creditLimit || null,
        paymentTerms || null, status || 'active', preferredPaymentMethod || null,
        notes || null, acquisitionSource || null, referredBy || null,
        tenantId, branchId, new Date().toISOString(), new Date().toISOString()
      ]);

      return await this.findById(id);
  }

  async update(id, updates) {
    const db = await getDb();
    const fields = [];
      const values = [];

      const fieldMap = {
        name: 'name', email: 'email', phone: 'phone', address: 'address',
        city: 'city', state: 'state', postalCode: 'postal_code', country: 'country',
        gstNumber: 'gst_number', panNumber: 'pan_number', type: 'type',
        category: 'category', tags: 'tags', totalSpent: 'total_spent',
        totalOrders: 'total_orders', averageOrderValue: 'average_order_value',
        lastOrderDate: 'last_order_date', creditLimit: 'credit_limit',
        paymentTerms: 'payment_terms', status: 'status',
        preferredPaymentMethod: 'preferred_payment_method', notes: 'notes',
        acquisitionSource: 'acquisition_source', referredBy: 'referred_by'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        fields.push(`${dbField} = ?`);
        values.push(key === 'tags' ? JSON.stringify(value) : value);
      }

      if (fields.length === 0) return;

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await db.run(
        `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findById(id);
  }

  async delete(id) {
    const db = await getDb();
    await db.run('DELETE FROM customers WHERE id = ?', [id]);
  }

  async searchCustomers(tenantId, branchId = null, searchQuery) {
    const db = await getDb();
    let query = `
        SELECT 
          id, name, email, phone, address, city, state, postal_code as postalCode,
          country, gst_number as gstNumber, pan_number as panNumber,
          type, category, tags, total_spent as totalSpent, total_orders as totalOrders,
          average_order_value as averageOrderValue, last_order_date as lastOrderDate,
          credit_limit as creditLimit, payment_terms as paymentTerms, status,
          preferred_payment_method as preferredPaymentMethod, notes,
          acquisition_source as acquisitionSource, referred_by as referredBy,
          tenant_id as tenantId, branch_id as branchId,
          created_at as createdAt, updated_at as updatedAt
        FROM customers
        WHERE tenant_id = ?
        AND (
          name LIKE ? OR 
          email LIKE ? OR 
          phone LIKE ? OR
          gst_number LIKE ? OR
          pan_number LIKE ?
        )
      `;
      const searchPattern = `%${searchQuery}%`;
      const params = [tenantId, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      query += ' ORDER BY name ASC LIMIT 50';

      const customers = await db.all(query, params);
      return customers.map(c => {
        let tags = [];
        if (c.tags) {
          try {
            tags = (typeof c.tags === 'string' && c.tags !== 'null' && c.tags.trim() !== '') 
              ? JSON.parse(c.tags) 
              : [];
          } catch (e) {
            console.warn('Failed to parse customer tags:', c.tags);
            tags = [];
          }
        }
        return {
          ...c,
          tags
        };
      });
  }

  async getTopCustomers(tenantId, branchId = null, limit = 10) {
    const db = await getDb();
    let query = `
        SELECT 
          id, name, email, phone, total_spent as totalSpent, 
          total_orders as totalOrders, last_order_date as lastOrderDate,
          status, tenant_id as tenantId, branch_id as branchId
        FROM customers
        WHERE tenant_id = ?
        AND status = 'active'
      `;
      const params = [tenantId];

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      query += ' ORDER BY total_spent DESC LIMIT ?';
      params.push(limit);

      return await db.all(query, params);
  }

  async getCustomerStats(tenantId, branchId = null) {
    const db = await getDb();
    let query = `
        SELECT 
          COUNT(*) as totalCount,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCount,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactiveCount,
          SUM(CASE WHEN status = 'prospect' THEN 1 ELSE 0 END) as prospectCount,
          SUM(total_spent) as totalRevenue,
          AVG(total_spent) as averageSpending,
          SUM(total_orders) as totalOrders,
          AVG(total_orders) as averageOrders
        FROM customers
        WHERE tenant_id = ?
      `;
      const params = [tenantId];

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      const stats = await db.get(query, params);
      return {
        totalCount: stats.totalCount || 0,
        activeCount: stats.activeCount || 0,
        inactiveCount: stats.inactiveCount || 0,
        prospectCount: stats.prospectCount || 0,
        totalRevenue: stats.totalRevenue || 0,
        averageSpending: stats.averageSpending || 0,
        totalOrders: stats.totalOrders || 0,
        averageOrders: stats.averageOrders || 0
      };
  }

  async updateSpentMetrics(customerId) {
    const db = await getDb();
      // Calculate total spent and orders from invoices
    const stats = await db.get(`
        SELECT 
          COUNT(*) as orderCount,
          SUM(total_amount) as totalSpent,
          AVG(total_amount) as avgOrderValue,
          MAX(issue_date) as lastOrderDate
        FROM invoices
        WHERE customer_id = ?
        AND status IN ('paid', 'partial')
      `, [customerId]);

      if (stats && stats.orderCount > 0) {
        await db.run(`
          UPDATE customers
          SET total_spent = ?,
              total_orders = ?,
              average_order_value = ?,
              last_order_date = ?,
              updated_at = ?
          WHERE id = ?
        `, [
          stats.totalSpent || 0,
          stats.orderCount || 0,
          stats.avgOrderValue || 0,
          stats.lastOrderDate,
          new Date().toISOString(),
          customerId
        ]);
      }

      return await this.findById(customerId);
  }
}
