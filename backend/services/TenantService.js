import { TenantRepository } from '../repositories/TenantRepository.js';
import { v4 as uuidv4 } from 'uuid';

export class TenantService {
  constructor() {
    this.tenantRepo = new TenantRepository();
  }

  async createTenant(name, email) {
    const id = uuidv4();
    await this.tenantRepo.createTenant({ id, name, email });
    return { id, name, email };
  }

  async getTenantById(id) {
    return this.tenantRepo.getTenantById(id);
  }

  async getAllTenants() {
    return this.tenantRepo.getAllTenants();
  }
}
