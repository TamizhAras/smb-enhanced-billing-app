import express from 'express';
import { BranchService } from '../services/BranchService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const branchService = new BranchService();

// Only owner or admin can create branches
router.post('/', authenticateToken, (req, res, next) => {
  if (['owner', 'admin'].includes(req.user.role)) return next();
  return res.sendStatus(403);
}, async (req, res) => {
  const { tenantId, name, type } = req.body;
  const branch = await branchService.createBranch(tenantId, name, type);
  res.status(201).json(branch);
});

// Only authenticated users can list branches
router.get('/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const branches = await branchService.getBranchesByTenant(tenantId);
  res.json(branches);
});

export default router;
