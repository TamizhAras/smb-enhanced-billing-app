import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'devsecret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.sendStatus(403);
    }
    next();
  };
}

/**
 * Middleware to ensure users can only access their own tenant's data
 * Checks tenantId in params, query, or body against user's tenantId
 */
export function requireTenantAccess(req, res, next) {
  if (!req.user || !req.user.tenantId) {
    return res.status(403).json({ error: 'No tenant context' });
  }
  
  // Get tenantId from various sources
  const requestedTenantId = 
    req.params.tenantId || 
    req.query.tenantId || 
    req.body?.tenantId;
  
  // If no tenantId in request, inject user's tenantId (for convenience)
  if (!requestedTenantId) {
    req.tenantId = req.user.tenantId;
    return next();
  }
  
  // Validate that user can only access their own tenant's data
  if (requestedTenantId !== req.user.tenantId) {
    return res.status(403).json({ 
      error: 'Access denied: You can only access your own organization\'s data' 
    });
  }
  
  req.tenantId = req.user.tenantId;
  next();
}

/**
 * Middleware to validate branch access
 * Owner can access all branches, managers only their assigned branch
 */
export function requireBranchAccess(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'Not authenticated' });
  }
  
  const requestedBranchId = 
    req.params.branchId || 
    req.query.branchId || 
    req.body?.branchId;
  
  // Owner can access all branches
  if (req.user.role === 'owner') {
    req.branchId = requestedBranchId || req.user.branchId;
    return next();
  }
  
  // If no branch specified, use user's branch
  if (!requestedBranchId) {
    req.branchId = req.user.branchId;
    return next();
  }
  
  // Non-owners can only access their own branch
  if (requestedBranchId !== req.user.branchId) {
    return res.status(403).json({ 
      error: 'Access denied: You can only access your assigned branch' 
    });
  }
  
  req.branchId = req.user.branchId;
  next();
}
