import express from 'express';
import { TenantService } from '../services/TenantService.js';
import { UserService } from '../services/UserService.js';
import { BranchService } from '../services/BranchService.js';
import { authenticateToken, requireRole, requireTenantAccess } from '../middleware/auth.js';

const router = express.Router();
const tenantService = new TenantService();
const userService = new UserService();
const branchService = new BranchService();

/**
 * PUBLIC: Register a new tenant/organization
 * Creates tenant, default branch, and admin user
 * POST /api/tenants/register
 */
router.post('/register', async (req, res) => {
  try {
    const { organizationName, adminUsername, adminPassword, adminEmail } = req.body;
    
    // Validate input
    if (!organizationName || !adminUsername || !adminPassword) {
      return res.status(400).json({ 
        error: 'Organization name, admin username, and password are required' 
      });
    }
    
    if (adminPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if username already exists
    const existingUser = await userService.getUserByUsername(adminUsername);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists. Please choose a different username.' 
      });
    }
    
    // Create tenant
    const tenant = await tenantService.createTenant(organizationName);
    
    // Create default branch
    const branch = await branchService.createBranch(tenant.id, 'Main Branch', 'retail');
    
    // Create admin user for this tenant
    const adminUser = await userService.createUser({
      tenantId: tenant.id,
      branchId: branch.id,
      username: adminUsername,
      password: adminPassword,
      role: 'owner',
      email: adminEmail
    });
    
    res.status(201).json({
      message: 'Organization registered successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name
      },
      branch: {
        id: branch.id,
        name: branch.name
      },
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Tenant registration error:', error);
    res.status(500).json({ error: 'Failed to register organization' });
  }
});

// Only owner can create additional tenants (for super-admin scenarios)
router.post('/', authenticateToken, requireRole('owner'), async (req, res) => {
  const { name } = req.body;
  const tenant = await tenantService.createTenant(name);
  res.status(201).json(tenant);
});

// Get current tenant info
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const tenant = await tenantService.getTenantById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tenant info' });
  }
});

// Only authenticated users can list tenants (admin feature)
router.get('/', authenticateToken, async (req, res) => {
  const tenants = await tenantService.getAllTenants();
  res.json(tenants);
});

export default router;
