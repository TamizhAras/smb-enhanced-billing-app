import { InvoiceRepository } from '../repositories/InvoiceRepository.js';
import { v4 as uuidv4 } from 'uuid';

export class InvoiceService {
  constructor() {
    this.invoiceRepo = new InvoiceRepository();
  }

  async createInvoice({ tenantId, branchId, customerName, amount, status }) {
    const id = uuidv4();
    await this.invoiceRepo.createInvoice({ id, tenantId, branchId, customerName, amount, status });
    return { id, tenantId, branchId, customerName, amount, status };
  }

  async getInvoicesByBranch(branchId) {
    return this.invoiceRepo.getInvoicesByBranch(branchId);
  }

  async getInvoicesByTenant(tenantId) {
    return this.invoiceRepo.getInvoicesByTenant(tenantId);
  }
}
