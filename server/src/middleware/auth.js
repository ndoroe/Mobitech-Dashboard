const { verifyJWT } = require('../utils/authHelpers');

/**
 * Middleware to authenticate JWT token from request headers
 * Attaches user object to req.user if valid
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const decoded = verifyJWT(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

/**
 * Middleware to require specific role(s)
 * Must be used after authenticateToken
 * @param {...string} roles - Required roles (e.g., 'admin', 'user')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
}

/**
 * Middleware to require user to have 'active' status
 * Must be used after authenticateToken
 */
function requireActive(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.status !== 'active') {
    let message = 'Account is not active.';
    
    switch (req.user.status) {
      case 'pending_verification':
        message = 'Please verify your email address.';
        break;
      case 'pending_approval':
        message = 'Your account is pending admin approval.';
        break;
      case 'rejected':
        message = 'Your account has been rejected. Please contact an administrator.';
        break;
    }

    return res.status(403).json({
      success: false,
      message,
      status: req.user.status
    });
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Just attaches user if token is valid
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  requireActive,
  optionalAuth
};
