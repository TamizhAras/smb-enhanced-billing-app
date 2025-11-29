import express from 'express';
import { UserService } from '../services/UserService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const userService = new UserService();

// Only owner or admin can create users
router.post('/', authenticateToken, (req, res, next) => {
  if (['owner', 'admin'].includes(req.user.role)) return next();
  return res.sendStatus(403);
}, async (req, res) => {
  const { tenantId, branchId, username, password, role } = req.body;
  const user = await userService.createUser({ tenantId, branchId, username, password, role });
  res.status(201).json(user);
});

// Only authenticated users can list users
router.get('/:tenantId', authenticateToken, async (req, res) => {
  const { tenantId } = req.params;
  const users = await userService.getUsersByTenant(tenantId);
  res.json(users);
});

export default router;
