import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function seed() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // ============================================
  // TENANT 1: Demo Business (Retail Chain)
  // ============================================
  const tenant1Id = randomUUID();
  await db.run(`INSERT OR IGNORE INTO tenants (id, name) VALUES (?, ?)`, tenant1Id, 'Demo Business');

  // Create multiple demo branches for Tenant 1
  const t1Branch1Id = randomUUID();
  const t1Branch2Id = randomUUID();
  const t1Branch3Id = randomUUID();
  
  await db.run(`INSERT OR IGNORE INTO branches (id, tenant_id, name, type) VALUES (?, ?, ?, ?)`, 
    t1Branch1Id, tenant1Id, 'Main Branch', 'retail');
  await db.run(`INSERT OR IGNORE INTO branches (id, tenant_id, name, type) VALUES (?, ?, ?, ?)`, 
    t1Branch2Id, tenant1Id, 'Downtown Store', 'retail');
  await db.run(`INSERT OR IGNORE INTO branches (id, tenant_id, name, type) VALUES (?, ?, ?, ?)`, 
    t1Branch3Id, tenant1Id, 'Warehouse', 'warehouse');

  // Create users for Tenant 1
  const t1OwnerId = randomUUID();
  const t1OwnerPasswordHash = bcrypt.hashSync('admin123', 10);
  await db.run(`INSERT OR IGNORE INTO users (id, tenant_id, branch_id, username, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`, 
    t1OwnerId, tenant1Id, t1Branch1Id, 'admin', t1OwnerPasswordHash, 'owner');

  const t1Manager1Id = randomUUID();
  const t1Manager1PasswordHash = bcrypt.hashSync('manager123', 10);
  await db.run(`INSERT OR IGNORE INTO users (id, tenant_id, branch_id, username, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`, 
    t1Manager1Id, tenant1Id, t1Branch1Id, 'manager1', t1Manager1PasswordHash, 'manager');

  const t1Manager2Id = randomUUID();
  const t1Manager2PasswordHash = bcrypt.hashSync('manager123', 10);
  await db.run(`INSERT OR IGNORE INTO users (id, tenant_id, branch_id, username, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`, 
    t1Manager2Id, tenant1Id, t1Branch2Id, 'manager2', t1Manager2PasswordHash, 'manager');

  // ============================================
  // TENANT 2: ABC Electronics (Different Business)
  // ============================================
  const tenant2Id = randomUUID();
  await db.run(`INSERT OR IGNORE INTO tenants (id, name) VALUES (?, ?)`, tenant2Id, 'ABC Electronics');

  // Create branches for Tenant 2
  const t2Branch1Id = randomUUID();
  const t2Branch2Id = randomUUID();
  
  await db.run(`INSERT OR IGNORE INTO branches (id, tenant_id, name, type) VALUES (?, ?, ?, ?)`, 
    t2Branch1Id, tenant2Id, 'Central Store', 'retail');
  await db.run(`INSERT OR IGNORE INTO branches (id, tenant_id, name, type) VALUES (?, ?, ?, ?)`, 
    t2Branch2Id, tenant2Id, 'Service Center', 'service');

  // Create users for Tenant 2
  const t2OwnerId = randomUUID();
  const t2OwnerPasswordHash = bcrypt.hashSync('abc123', 10);
  await db.run(`INSERT OR IGNORE INTO users (id, tenant_id, branch_id, username, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`, 
    t2OwnerId, tenant2Id, t2Branch1Id, 'abcadmin', t2OwnerPasswordHash, 'owner');

  const t2StaffId = randomUUID();
  const t2StaffPasswordHash = bcrypt.hashSync('staff123', 10);
  await db.run(`INSERT OR IGNORE INTO users (id, tenant_id, branch_id, username, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`, 
    t2StaffId, tenant2Id, t2Branch2Id, 'abcstaff', t2StaffPasswordHash, 'staff');

  console.log('');
  console.log('==============================================');
  console.log('Multi-Tenant Seed Data Created Successfully!');
  console.log('==============================================');
  console.log('');
  console.log('TENANT 1: Demo Business (Retail Chain)');
  console.log('---------------------------------------');
  console.log('  Branches: Main Branch, Downtown Store, Warehouse');
  console.log('  Owner (all branches): admin / admin123');
  console.log('  Manager (Main Branch): manager1 / manager123');
  console.log('  Manager (Downtown Store): manager2 / manager123');
  console.log('  Tenant ID:', tenant1Id);
  console.log('');
  console.log('TENANT 2: ABC Electronics');
  console.log('-------------------------');
  console.log('  Branches: Central Store, Service Center');
  console.log('  Owner (all branches): abcadmin / abc123');
  console.log('  Staff (Service Center): abcstaff / staff123');
  console.log('  Tenant ID:', tenant2Id);
  console.log('');
  console.log('==============================================');
  console.log('Each tenant\'s data is completely isolated.');
  console.log('Users can only see their own organization\'s data.');
  console.log('==============================================');

  await db.close();
}

seed().catch(console.error);
