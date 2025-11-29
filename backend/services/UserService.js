import { UserRepository } from '../repositories/UserRepository.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export class UserService {
  constructor() {
    this.userRepo = new UserRepository();
  }

  async createUser({ tenantId, branchId, name, email, password, role }) {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.userRepo.createUser({ id, tenantId, branchId, name, email, passwordHash, role });
    return { id, tenantId, branchId, name, email, role };
  }

  async getUserByUsername(username) {
    return this.userRepo.getUserByUsername(username);
  }

  async getUsersByTenant(tenantId) {
    return this.userRepo.getUsersByTenant(tenantId);
  }
}
