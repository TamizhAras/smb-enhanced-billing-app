import { getDb } from '../models/db.js';

export class InvoiceRepository {
  // ============================================================================
  // INVOICE CRUD OPERATIONS
  // ============================================================================
  
  async createInvoice(invoiceData) {
    const db = await getDb();
    const {
        id, tenantId, branchId, invoiceNumber, customerId, customerName, customerEmail,
        customerAddress, customerPhone, issueDate, dueDate, status, items, subtotal,
        discountType, discountValue, discountAmount, taxRate, taxAmount, totalAmount,
        paidAmount, outstandingAmount, paymentTerms, currency, exchangeRate,
        isRecurring, recurringFrequency, recurringEndDate, parentInvoiceId,
        notes, terms, footerText, templateId, poNumber, projectId, tags
      } = invoiceData;

      await db.run(`
        INSERT INTO invoices (
          id, tenant_id, branch_id, invoice_number, customer_id, customer_name,
          customer_email, customer_address, customer_phone, issue_date, due_date,
          status, items, subtotal, discount_type, discount_value, discount_amount,
          tax_rate, tax_amount, total_amount, paid_amount, outstanding_amount,
          payment_terms, currency, exchange_rate, is_recurring, recurring_frequency,
          recurring_end_date, parent_invoice_id, notes, terms, footer_text,
          template_id, po_number, project_id, tags, amount, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, tenantId, branchId, invoiceNumber, customerId || null, customerName,
        customerEmail || null, customerAddress || null, customerPhone || null,
        issueDate, dueDate, status || 'draft',
        items ? JSON.stringify(items) : '[]',  // FIXED: Add items as JSON string with default empty array
        subtotal || 0,
        discountType || null, discountValue || 0, discountAmount || 0,
        taxRate || 0, taxAmount || 0, totalAmount || 0, paidAmount || 0,
        outstandingAmount || totalAmount || 0, paymentTerms || null,
        currency || 'INR', exchangeRate || 1, isRecurring,
        recurringFrequency || null, recurringEndDate || null, parentInvoiceId || null,
        notes || null, terms || null, footerText || null, templateId || null,
        poNumber || null, projectId || null, tags ? JSON.stringify(tags) : null,
        totalAmount || 0, new Date().toISOString(), new Date().toISOString()
      ]);

      return await this.findById(id);
  }

  async findAll(tenantId, branchId, filters = {}) {
    const db = await getDb();
    let query = `
        SELECT 
          id, tenant_id as tenantId, branch_id as branchId, invoice_number as invoiceNumber,
          customer_id as customerId, customer_name as customerName, customer_email as customerEmail,
          customer_address as customerAddress, customer_phone as customerPhone,
          issue_date as issueDate, due_date as dueDate, status, items, subtotal,
          discount_type as discountType, discount_value as discountValue,
          discount_amount as discountAmount, tax_rate as taxRate, tax_amount as taxAmount,
          total_amount as totalAmount, paid_amount as paidAmount,
          outstanding_amount as outstandingAmount, payment_terms as paymentTerms,
          currency, exchange_rate as exchangeRate, is_recurring as isRecurring,
          recurring_frequency as recurringFrequency, recurring_end_date as recurringEndDate,
          parent_invoice_id as parentInvoiceId, notes, terms, footer_text as footerText,
          template_id as templateId, sent_at as sentAt, reminders_sent as remindersSent,
          last_reminder_date as lastReminderDate, po_number as poNumber,
          project_id as projectId, tags, created_at as createdAt, updated_at as updatedAt
        FROM invoices
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

      if (filters.customerId) {
        query += ' AND customer_id = ?';
        params.push(filters.customerId);
      }

      if (filters.startDate) {
        query += ' AND issue_date >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND issue_date <= ?';
        params.push(filters.endDate);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const invoices = await db.all(query, params);
      return invoices.map(inv => ({
        ...inv,
        items: inv.items ? JSON.parse(inv.items) : [],
        tags: inv.tags ? JSON.parse(inv.tags) : [],
        isRecurring: Boolean(inv.isRecurring)
      }));
  }

  async findById(id) {
    const db = await getDb();
    const invoice = await db.get(`
        SELECT 
          id, tenant_id as tenantId, branch_id as branchId, invoice_number as invoiceNumber,
          customer_id as customerId, customer_name as customerName, customer_email as customerEmail,
          customer_address as customerAddress, customer_phone as customerPhone,
          issue_date as issueDate, due_date as dueDate, status, items, subtotal,
          discount_type as discountType, discount_value as discountValue,
          discount_amount as discountAmount, tax_rate as taxRate, tax_amount as taxAmount,
          total_amount as totalAmount, paid_amount as paidAmount,
          outstanding_amount as outstandingAmount, payment_terms as paymentTerms,
          currency, exchange_rate as exchangeRate, is_recurring as isRecurring,
          recurring_frequency as recurringFrequency, recurring_end_date as recurringEndDate,
          parent_invoice_id as parentInvoiceId, notes, terms, footer_text as footerText,
          template_id as templateId, sent_at as sentAt, reminders_sent as remindersSent,
          last_reminder_date as lastReminderDate, po_number as poNumber,
          project_id as projectId, tags, created_at as createdAt, updated_at as updatedAt
        FROM invoices WHERE id = ?
      `, [id]);

      if (invoice) {
        invoice.items = invoice.items ? JSON.parse(invoice.items) : [];
        invoice.tags = invoice.tags ? JSON.parse(invoice.tags) : [];
        invoice.isRecurring = Boolean(invoice.isRecurring);
      }
      return invoice;
  }

  async findByInvoiceNumber(invoiceNumber, tenantId) {
    const db = await getDb();
    const invoice = await db.get(`
        SELECT * FROM invoices 
        WHERE invoice_number = ? AND tenant_id = ?
      `, [invoiceNumber, tenantId]);
      
      if (invoice && invoice.tags) {
        invoice.tags = JSON.parse(invoice.tags);
      }
      return invoice;
  }

  async update(id, updates) {
    const db = await getDb();
    const fields = [];
      const values = [];

      const fieldMap = {
        invoiceNumber: 'invoice_number', customerId: 'customer_id', customerName: 'customer_name',
        customerEmail: 'customer_email', customerAddress: 'customer_address',
        customerPhone: 'customer_phone', issueDate: 'issue_date', dueDate: 'due_date',
        status: 'status', items: 'items', subtotal: 'subtotal', discountType: 'discount_type',
        discountValue: 'discount_value', discountAmount: 'discount_amount',
        taxRate: 'tax_rate', taxAmount: 'tax_amount', totalAmount: 'total_amount',
        paidAmount: 'paid_amount', outstandingAmount: 'outstanding_amount',
        paymentTerms: 'payment_terms', currency: 'currency', exchangeRate: 'exchange_rate',
        isRecurring: 'is_recurring', recurringFrequency: 'recurring_frequency',
        recurringEndDate: 'recurring_end_date', parentInvoiceId: 'parent_invoice_id',
        notes: 'notes', terms: 'terms', footerText: 'footer_text', templateId: 'template_id',
        sentAt: 'sent_at', remindersSent: 'reminders_sent', lastReminderDate: 'last_reminder_date',
        poNumber: 'po_number', projectId: 'project_id', tags: 'tags'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        fields.push(`${dbField} = ?`);
        values.push(key === 'tags' || key === 'items' ? JSON.stringify(value) : 
                   key === 'isRecurring' ? Boolean(value) : value);
      }

      if (fields.length === 0) return;

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await db.run(
        `UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findById(id);
  }

  async delete(id) {
    const db = await getDb();
    await db.run('DELETE FROM invoices WHERE id = ?', [id]);
  }

  async updateStatus(id, status) {
    const db = await getDb();
    await db.run(`
        UPDATE invoices 
        SET status = ?, updated_at = ? 
        WHERE id = ?
      `, [status, new Date().toISOString(), id]);

      return await this.findById(id);
  }

  async getOverdueInvoices(tenantId, branchId = null) {
    const db = await getDb();
    let query = `
        SELECT * FROM invoices 
        WHERE tenant_id = ? 
        AND status IN ('pending', 'partial')
        AND due_date < ?
      `;
      const params = [tenantId, new Date().toISOString()];

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      query += ' ORDER BY due_date ASC';

      return await db.all(query, params);
  }

  async getRecurringInvoices(tenantId) {
    const db = await getDb();
    return await db.all(`
        SELECT * FROM invoices 
        WHERE tenant_id = ? AND is_recurring = true
        AND (recurring_end_date IS NULL OR recurring_end_date > ?)
        ORDER BY created_at DESC
      `, [tenantId, new Date().toISOString()]);
  }

  async getInvoiceStats(tenantId, branchId = null, filters = {}) {
    const db = await getDb();
    let query = `
        SELECT 
          COUNT(*) as totalCount,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paidCount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdueCount,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftCount,
          SUM(total_amount) as totalAmount,
          SUM(paid_amount) as totalPaid,
          SUM(outstanding_amount) as totalOutstanding,
          AVG(total_amount) as averageInvoiceAmount
        FROM invoices
        WHERE tenant_id = ?
      `;
      const params = [tenantId];

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      if (filters.startDate) {
        query += ' AND issue_date >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND issue_date <= ?';
        params.push(filters.endDate);
      }

      const stats = await db.get(query, params);
      return {
        totalCount: stats.totalCount || 0,
        paidCount: stats.paidCount || 0,
        pendingCount: stats.pendingCount || 0,
        overdueCount: stats.overdueCount || 0,
        draftCount: stats.draftCount || 0,
        totalAmount: stats.totalAmount || 0,
        totalPaid: stats.totalPaid || 0,
        totalOutstanding: stats.totalOutstanding || 0,
        averageInvoiceAmount: stats.averageInvoiceAmount || 0
      };
  }

  // Legacy methods for backward compatibility
  async getInvoicesByBranch(branchId) {
    const db = await getDb();
    const invoices = await db.all('SELECT * FROM invoices WHERE branch_id = ?', [branchId]);
    return invoices;
  }

  async getInvoicesByTenant(tenantId) {
    const db = await getDb();
    const invoices = await db.all('SELECT * FROM invoices WHERE tenant_id = ?', [tenantId]);
    return invoices;
  }

  // ============================================================================
  // PAYMENT OPERATIONS
  // ============================================================================

  async createPayment(paymentData) {
    const db = await getDb();
    const {
        id, invoiceId, invoiceNumber, customerId, customerName, tenantId, branchId,
        amount, method, reference, notes, paymentDate
      } = paymentData;

      await db.run(`
        INSERT INTO payments (
          id, invoice_id, invoice_number, customer_id, customer_name,
          tenant_id, branch_id, amount, method, reference, notes,
          payment_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, invoiceId, invoiceNumber || null, customerId || null, customerName || null,
        tenantId, branchId, amount, method, reference || null, notes || null,
        paymentDate, new Date().toISOString()
      ]);

      // Update invoice paid amount and outstanding amount
      await db.run(`
        UPDATE invoices 
        SET paid_amount = paid_amount + ?,
            outstanding_amount = total_amount - (paid_amount + ?),
            status = CASE 
              WHEN (paid_amount + ?) >= total_amount THEN 'paid'
              WHEN (paid_amount + ?) > 0 THEN 'partial'
              ELSE status
            END,
            updated_at = ?
        WHERE id = ?
      `, [amount, amount, amount, amount, new Date().toISOString(), invoiceId]);

      return await this.findPaymentById(id);
  }

  async findPaymentById(id) {
    const db = await getDb();
    const payment = await db.get(`
        SELECT 
          id, invoice_id as invoiceId, invoice_number as invoiceNumber,
          customer_id as customerId, customer_name as customerName,
          tenant_id as tenantId, branch_id as branchId, amount, method,
          reference, notes, payment_date as paymentDate, created_at as createdAt
        FROM payments WHERE id = ?
      `, [id]);
      return payment;
  }

  async getPaymentsByInvoice(invoiceId) {
    const db = await getDb();
    const payments = await db.all(`
        SELECT 
          id, invoice_id as invoiceId, invoice_number as invoiceNumber,
          customer_id as customerId, customer_name as customerName,
          tenant_id as tenantId, branch_id as branchId, amount, method,
          reference, notes, payment_date as paymentDate, created_at as createdAt
        FROM payments 
        WHERE invoice_id = ?
        ORDER BY payment_date DESC
      `, [invoiceId]);
      return payments;
  }

  async getAllPayments(tenantId, branchId = null, filters = {}) {
    const db = await getDb();
    let query = `
        SELECT 
          id, invoice_id as invoiceId, invoice_number as invoiceNumber,
          customer_id as customerId, customer_name as customerName,
          tenant_id as tenantId, branch_id as branchId, amount, method,
          reference, notes, payment_date as paymentDate, created_at as createdAt
        FROM payments
        WHERE tenant_id = ?
      `;
      const params = [tenantId];

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      if (filters.startDate) {
        query += ' AND payment_date >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND payment_date <= ?';
        params.push(filters.endDate);
      }

      if (filters.method) {
        query += ' AND method = ?';
        params.push(filters.method);
      }

      query += ' ORDER BY payment_date DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      return await db.all(query, params);
  }

  async updatePayment(id, updates) {
    const db = await getDb();
    const fields = [];
      const values = [];

      const fieldMap = {
        amount: 'amount', method: 'method', reference: 'reference',
        notes: 'notes', paymentDate: 'payment_date'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key] || key;
        fields.push(`${dbField} = ?`);
        values.push(value);
      }

      if (fields.length === 0) return;

      values.push(id);

      await db.run(
        `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findPaymentById(id);
  }

  async deletePayment(id) {
    const db = await getDb();
      // Get payment info before deleting
    const payment = await this.findPaymentById(id);
      if (!payment) return;

      // Delete payment
      await db.run('DELETE FROM payments WHERE id = ?', [id]);

      // Update invoice amounts
      await db.run(`
        UPDATE invoices 
        SET paid_amount = paid_amount - ?,
            outstanding_amount = total_amount - (paid_amount - ?),
            status = CASE 
              WHEN (paid_amount - ?) <= 0 THEN 'pending'
              WHEN (paid_amount - ?) < total_amount THEN 'partial'
              ELSE status
            END,
            updated_at = ?
        WHERE id = ?
      `, [payment.amount, payment.amount, payment.amount, payment.amount, 
          new Date().toISOString(), payment.invoiceId]);
  }

  // ============================================================================
  // TAX RATES OPERATIONS
  // ============================================================================

  async getTaxRates(tenantId, branchId = null, activeOnly = true) {
    const db = await getDb();
    let query = `
        SELECT 
          id, tenant_id as tenantId, branch_id as branchId, name, rate,
          description, is_default as isDefault, is_active as isActive,
          created_at as createdAt
        FROM tax_rates
        WHERE tenant_id = ?
      `;
      const params = [tenantId];

      if (activeOnly) {
        query += ' AND is_active = true';
      }

      if (branchId) {
        query += ' AND (branch_id = ? OR branch_id IS NULL)';
        params.push(branchId);
      }

      query += ' ORDER BY rate DESC';

      const rates = await db.all(query, params);
      return rates.map(rate => ({
        ...rate,
        isDefault: Boolean(rate.isDefault),
        isActive: Boolean(rate.isActive)
      }));
  }

  async createTaxRate(taxRateData) {
    const db = await getDb();
    const { id, tenantId, branchId, name, rate, description, isDefault, isActive } = taxRateData;

      await db.run(`
        INSERT INTO tax_rates (
          id, tenant_id, branch_id, name, rate, description,
          is_default, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, tenantId, branchId || null, name, rate, description || null,
        isDefault ? 1 : 0, isActive !== false ? 1 : 0, new Date().toISOString()
      ]);

      return await this.findTaxRateById(id);
  }

  async findTaxRateById(id) {
    const db = await getDb();
    const rate = await db.get(`
        SELECT 
          id, tenant_id as tenantId, branch_id as branchId, name, rate,
          description, is_default as isDefault, is_active as isActive,
          created_at as createdAt
        FROM tax_rates WHERE id = ?
      `, [id]);

      if (rate) {
        rate.isDefault = Boolean(rate.isDefault);
        rate.isActive = Boolean(rate.isActive);
      }
      return rate;
  }

  async updateTaxRate(id, updates) {
    const db = await getDb();
    const fields = [];
    const values = [];

    const fieldMap = {
      name: 'name', rate: 'rate', description: 'description',
      isDefault: 'is_default', isActive: 'is_active'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key;
      fields.push(`${dbField} = ?`);
      values.push(key === 'isDefault' || key === 'isActive' ? (value ? 1 : 0) : value);
    }

    if (fields.length === 0) return;

    values.push(id);

    await db.run(
      `UPDATE tax_rates SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findTaxRateById(id);
  }

  // ============================================================================
  // INVOICE TEMPLATES OPERATIONS
  // ============================================================================

  async getTemplates(tenantId) {
    const db = await getDb();
    const templates = await db.all(`
        SELECT 
          id, tenant_id as tenantId, name, description, layout,
          color_scheme as colorScheme, is_default as isDefault,
          custom_fields as customFields, created_at as createdAt
        FROM invoice_templates
        WHERE tenant_id = ?
        ORDER BY is_default DESC, name ASC
      `, [tenantId]);

      return templates.map(t => ({
        ...t,
        isDefault: Boolean(t.isDefault),
        customFields: t.customFields ? JSON.parse(t.customFields) : []
      }));
  }

  async createTemplate(templateData) {
    const db = await getDb();
    const {
        id, tenantId, name, description, layout, colorScheme, isDefault, customFields
      } = templateData;

      await db.run(`
        INSERT INTO invoice_templates (
          id, tenant_id, name, description, layout, color_scheme,
          is_default, custom_fields, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, tenantId, name, description || null, layout,
        colorScheme || null, isDefault ? 1 : 0,
        customFields ? JSON.stringify(customFields) : null,
        new Date().toISOString()
      ]);

      return await this.findTemplateById(id);
  }

  async findTemplateById(id) {
    const db = await getDb();
    const template = await db.get(`
        SELECT 
          id, tenant_id as tenantId, name, description, layout,
          color_scheme as colorScheme, is_default as isDefault,
          custom_fields as customFields, created_at as createdAt
        FROM invoice_templates WHERE id = ?
      `, [id]);

      if (template) {
        template.isDefault = Boolean(template.isDefault);
        template.customFields = template.customFields ? JSON.parse(template.customFields) : [];
      }
      return template;
  }

  async updateTemplate(id, updates) {
    const db = await getDb();
    const fields = [];
    const values = [];

    const fieldMap = {
      name: 'name', description: 'description', layout: 'layout',
      colorScheme: 'color_scheme', isDefault: 'is_default', customFields: 'custom_fields'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key;
      fields.push(`${dbField} = ?`);
      values.push(
        key === 'customFields' ? JSON.stringify(value) :
        key === 'isDefault' ? (value ? 1 : 0) : value
      );
    }

    if (fields.length === 0) return;

    values.push(id);

    await db.run(
      `UPDATE invoice_templates SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findTemplateById(id);
  }
}
