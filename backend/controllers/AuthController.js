import express from 'express';
import { UserService } from '../services/UserService.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();
const userService = new UserService();

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await userService.getUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      tenantId: user.tenant_id,
      branchId: user.branch_id,
      role: user.role
    },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '8h' }
  );
  res.json({ token, user: {
    id: user.id,
    username: user.username,
    tenantId: user.tenant_id,
    branchId: user.branch_id,
    role: user.role
  }});
});

export default router;
