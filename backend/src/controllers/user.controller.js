const { query } = require('../models/db');
const { success, badRequest } = require('../utils/response');

exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, avatar_url } = req.body;
    const { rows } = await query(
      `UPDATE users SET
         first_name=COALESCE($1,first_name),
         last_name=COALESCE($2,last_name),
         phone=COALESCE($3,phone),
         avatar_url=COALESCE($4,avatar_url)
       WHERE id=$5
       RETURNING id, email, phone, first_name, last_name, avatar_url, role`,
      [first_name, last_name, phone, avatar_url, req.user.id]
    );
    return success(res, rows[0], 'Profile updated');
  } catch (err) {
    next(err);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    return success(res, { notifications: rows, unread });
  } catch (err) {
    next(err);
  }
};

exports.markNotificationsRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
    return success(res, {}, 'Notifications marked as read');
  } catch (err) {
    next(err);
  }
};
