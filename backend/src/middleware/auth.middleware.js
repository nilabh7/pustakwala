const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../models/db');
const { unauthorized, forbidden } = require('../utils/response');

// Verify JWT and attach user to req
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }
    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const { rows } = await query(
      'SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length || !rows[0].is_active) {
      return unauthorized(res, 'Account not found or deactivated');
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};

// Role-based access control
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return forbidden(res, `Access denied. Required role: ${roles.join(' or ')}`);
  }
  next();
};

// Seller must be approved
const requireApprovedSeller = async (req, res, next) => {
  const { rows } = await query(
    'SELECT id, status FROM seller_profiles WHERE user_id = $1',
    [req.user.id]
  );
  if (!rows.length || rows[0].status !== 'approved') {
    return forbidden(res, 'Seller account not approved yet');
  }
  req.seller = rows[0];
  next();
};

module.exports = { authenticate, authorize, requireApprovedSeller };
