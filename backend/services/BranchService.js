import { BranchRepository } from '../repositories/BranchRepository.js';
import { v4 as uuidv4 } from 'uuid';

export class BranchService {
  constructor() {
    this.branchRepo = new BranchRepository();
  }

  async createBranch(tenantId, name, address = '', email = '', phone = '') {
    const id = uuidv4();
    await this.branchRepo.createBranch({ id, tenantId, name, address, email, phone });
    return { id, tenantId, name, address, email, phone };
  }

  async getBranchesByTenant(tenantId) {
    return this.branchRepo.getBranchesByTenant(tenantId);
  }
}
