const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { query, withTransaction } = require('../models/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendMail, templates } = require('../utils/email');
const { success, created, badRequest, unauthorized, error } = require('../utils/response');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

// POST /auth/register
exports.register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, role = 'buyer' } = req.body;

    if (!['buyer', 'seller'].includes(role)) {
      return badRequest(res, 'Invalid role. Must be buyer or seller');
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return badRequest(res, 'Email already registered');

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const verifyToken = uuidv4();

    const { rows } = await query(
      `INSERT INTO users (email, phone, password_hash, role, first_name, last_name, email_verify_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, email, role, first_name, last_name`,
      [email, phone || null, password_hash, role, first_name, last_name, verifyToken]
    );
    const user = rows[0];

    // Send welcome email
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    await sendMail({ to: email, ...templates.verifyEmail(first_name, verifyLink) });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return created(res, { user, accessToken, refreshToken }, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.first_name, u.last_name,
              u.is_active, u.avatar_url,
              sp.id as seller_id, sp.status as seller_status, sp.store_name
       FROM users u
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (!rows.length) return unauthorized(res, 'Invalid email or password');
    const user = rows[0];

    if (!user.is_active) return unauthorized(res, 'Account has been deactivated');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return unauthorized(res, 'Invalid email or password');

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const payload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const { password_hash, ...safeUser } = user;
    return success(res, { user: safeUser, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'Refresh token required');

    const decoded = verifyRefreshToken(refreshToken);
    const { rows } = await query('SELECT id, role, is_active FROM users WHERE id = $1', [decoded.id]);
    if (!rows.length || !rows[0].is_active) return unauthorized(res, 'User not found');

    const user = rows[0];
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    return success(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    return unauthorized(res, 'Invalid or expired refresh token');
  }
};

// POST /auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await query('SELECT id, first_name FROM users WHERE email = $1', [email]);
    // Always return success (security: don't reveal if email exists)
    if (rows.length) {
      const token = uuidv4();
      const expires = new Date(Date.now() + 3600000); // 1 hour
      await query(
        'UPDATE users SET password_reset_token=$1, password_reset_expires=$2 WHERE id=$3',
        [token, expires, rows[0].id]
      );
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendMail({ to: email, ...templates.passwordReset(rows[0].first_name, resetLink) });
    }
    return success(res, {}, 'If that email exists, a reset link has been sent');
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const { rows } = await query(
      'SELECT id FROM users WHERE password_reset_token=$1 AND password_reset_expires > NOW()',
      [token]
    );
    if (!rows.length) return badRequest(res, 'Invalid or expired reset token');

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await query(
      'UPDATE users SET password_hash=$1, password_reset_token=NULL, password_reset_expires=NULL WHERE id=$2',
      [hash, rows[0].id]
    );
    return success(res, {}, 'Password reset successful');
  } catch (err) {
    next(err);
  }
};

// POST /auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const { rows } = await query(
      'UPDATE users SET is_email_verified=TRUE, email_verify_token=NULL WHERE email_verify_token=$1 RETURNING id',
      [token]
    );
    if (!rows.length) return badRequest(res, 'Invalid verification token');
    return success(res, {}, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
exports.me = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.phone, u.role, u.first_name, u.last_name,
              u.avatar_url, u.is_email_verified, u.created_at,
              sp.id as seller_id, sp.status as seller_status,
              sp.store_name, sp.store_slug, sp.store_logo_url
       FROM users u
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) return badRequest(res, 'Current password is incorrect');
    const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    return success(res, {}, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};
