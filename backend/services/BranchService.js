import { BranchRepository } from '../repositories/BranchRepository.js';
import { v4 as uuidv4 } from 'uuid';

export class BranchService {
  constructor() {
    this.branchRepo = new BranchRepository();
  }

  async createBranch(tenantId, name, type = '', address = '', email = '', phone = '') {
    // Check for duplicate name
    const isDuplicate = await this.branchRepo.checkDuplicateName(tenantId, name);
    if (isDuplicate) {
      throw new Error('A branch with this name already exists');
    }

    const id = uuidv4();
    await this.branchRepo.createBranch({ id, tenantId, name, type, address, email, phone });
    return { id, tenantId, name, type, address, email, phone, created_at: new Date() };
  }

  async getBranchesByTenant(tenantId) {
    return this.branchRepo.getBranchesByTenant(tenantId);
  }

  async getBranchById(id) {
    const branch = await this.branchRepo.getBranchById(id);
    if (!branch) {
      throw new Error('Branch not found');
    }
    return branch;
  }

  async updateBranch(id, tenantId, updates) {
    // Verify branch exists and belongs to tenant
    const existingBranch = await this.branchRepo.getBranchById(id);
    if (!existingBranch) {
      throw new Error('Branch not found');
    }
    if (existingBranch.tenant_id !== tenantId) {
      throw new Error('Unauthorized: Branch does not belong to your organization');
    }

    // Check for duplicate name if name is being updated
    if (updates.name && updates.name !== existingBranch.name) {
      const isDuplicate = await this.branchRepo.checkDuplicateName(tenantId, updates.name, id);
      if (isDuplicate) {
        throw new Error('A branch with this name already exists');
      }
    }

    const updatedBranch = await this.branchRepo.updateBranch(id, updates);
    return updatedBranch;
  }

  async deleteBranch(id, tenantId) {
    // Verify branch exists and belongs to tenant
    const existingBranch = await this.branchRepo.getBranchById(id);
    if (!existingBranch) {
      throw new Error('Branch not found');
    }
    if (existingBranch.tenant_id !== tenantId) {
      throw new Error('Unauthorized: Branch does not belong to your organization');
    }

    const deletedBranch = await this.branchRepo.deleteBranch(id);
    return deletedBranch;
  }

  async checkDuplicateName(tenantId, name, excludeId = null) {
    return this.branchRepo.checkDuplicateName(tenantId, name, excludeId);
  }
}
