const bcrypt = require('bcrypt');
const { query, withTransaction } = require('../models/db');
const { sendMail, templates } = require('../utils/email');
const { success, created, badRequest, notFound, paginated } = require('../utils/response');

// ── DASHBOARD ──────────────────────────────────────────────────

exports.getDashboard = async (req, res, next) => {
  try {
    const [users, sellers, orders, revenue, books] = await Promise.all([
      query(`SELECT COUNT(*) as total,
               COUNT(*) FILTER(WHERE role='buyer') as buyers,
               COUNT(*) FILTER(WHERE role='seller') as sellers,
               COUNT(*) FILTER(WHERE created_at > NOW()-INTERVAL '30 days') as new_this_month
             FROM users WHERE is_active=TRUE`),
      query(`SELECT COUNT(*) as total,
               COUNT(*) FILTER(WHERE status='pending') as pending,
               COUNT(*) FILTER(WHERE status='approved') as approved,
               COUNT(*) FILTER(WHERE status='rejected') as rejected
             FROM seller_profiles`),
      query(`SELECT COUNT(*) as total,
               COUNT(*) FILTER(WHERE status='delivered') as delivered,
               COUNT(*) FILTER(WHERE status='cancelled') as cancelled,
               COUNT(*) FILTER(WHERE created_at > NOW()-INTERVAL '30 days') as this_month
             FROM orders`),
      query(`SELECT COALESCE(SUM(total_amount),0) as total_revenue,
               COALESCE(SUM(total_amount) FILTER(WHERE created_at > NOW()-INTERVAL '30 days'),0) as monthly_revenue,
               COALESCE(SUM(total_amount) FILTER(WHERE created_at > NOW()-INTERVAL '7 days'),0) as weekly_revenue
             FROM orders WHERE payment_status='paid'`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_active) as active FROM books`),
    ]);

    // Revenue trend last 12 months
    const { rows: revenueTrend } = await query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month,
              COALESCE(SUM(total_amount),0) as revenue,
              COUNT(*) as orders
       FROM orders WHERE payment_status='paid' AND created_at > NOW()-INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`
    );

    // Recent orders
    const { rows: recentOrders } = await query(
      `SELECT o.order_number, o.total_amount, o.status, o.created_at,
              u.first_name, u.last_name, u.email
       FROM orders o JOIN users u ON u.id=o.buyer_id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    // Top sellers
    const { rows: topSellers } = await query(
      `SELECT sp.store_name, sp.total_revenue, sp.total_sales, sp.rating,
              u.first_name, u.last_name
       FROM seller_profiles sp JOIN users u ON u.id=sp.user_id
       WHERE sp.status='approved'
       ORDER BY sp.total_revenue DESC LIMIT 5`
    );

    // Top books
    const { rows: topBooks } = await query(
      `SELECT b.title, b.authors, b.total_sold, b.selling_price, sp.store_name
       FROM books b JOIN seller_profiles sp ON sp.id=b.seller_id
       ORDER BY b.total_sold DESC LIMIT 5`
    );

    return success(res, {
      users: users.rows[0],
      sellers: sellers.rows[0],
      orders: orders.rows[0],
      revenue: revenue.rows[0],
      books: books.rows[0],
      revenueTrend,
      recentOrders,
      topSellers,
      topBooks,
    });
  } catch (err) {
    next(err);
  }
};

// ── SELLER MANAGEMENT ─────────────────────────────────────────

exports.getSellers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    const conditions = ['1=1'];
    const params = [];
    if (status) { params.push(status); conditions.push(`sp.status=$${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(sp.store_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const { rows } = await query(
      `SELECT sp.*, u.email, u.first_name, u.last_name, u.phone, u.created_at as user_created
       FROM seller_profiles sp JOIN users u ON u.id=sp.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY sp.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: cnt } = await query(
      `SELECT COUNT(*) FROM seller_profiles sp JOIN users u ON u.id=sp.user_id WHERE ${conditions.join(' AND ')}`,
      params
    );
    return paginated(res, rows, parseInt(cnt[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

exports.getSellerDetail = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT sp.*, u.email, u.first_name, u.last_name, u.phone, u.created_at as user_created
       FROM seller_profiles sp JOIN users u ON u.id=sp.user_id
       WHERE sp.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return notFound(res, 'Seller not found');

    const { rows: books } = await query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_active) as active FROM books WHERE seller_id=$1',
      [req.params.id]
    );
    const { rows: orders } = await query(
      `SELECT COUNT(*) as total, COALESCE(SUM(oi.total_price),0) as revenue
       FROM order_items oi JOIN orders o ON o.id=oi.order_id
       WHERE oi.seller_id=$1 AND o.payment_status='paid'`,
      [req.params.id]
    );

    return success(res, { ...rows[0], bookStats: books[0], orderStats: orders[0] });
  } catch (err) {
    next(err);
  }
};

exports.approveSeller = async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE seller_profiles SET status='approved', approved_by=$1, approved_at=NOW()
       WHERE id=$2 RETURNING *, (SELECT email FROM users WHERE id=user_id) as email,
                               (SELECT first_name FROM users WHERE id=user_id) as first_name`,
      [req.user.id, req.params.id]
    );
    if (!rows.length) return notFound(res, 'Seller not found');
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'SELLER_APPROVED', 'seller_profile', $2, $3)`,
      [req.user.id, req.params.id, JSON.stringify({ status: 'approved' })]
    );
    sendMail({ to: rows[0].email, ...templates.sellerApproved(rows[0].first_name, rows[0].store_name) });
    return success(res, rows[0], 'Seller approved successfully');
  } catch (err) {
    next(err);
  }
};

exports.rejectSeller = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return badRequest(res, 'Rejection reason is required');
    const { rows } = await query(
      `UPDATE seller_profiles SET status='rejected', rejection_reason=$1
       WHERE id=$2 RETURNING *, (SELECT email FROM users WHERE id=user_id) as email,
                               (SELECT first_name FROM users WHERE id=user_id) as first_name`,
      [reason, req.params.id]
    );
    if (!rows.length) return notFound(res, 'Seller not found');
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'SELLER_REJECTED', 'seller_profile', $2, $3)`,
      [req.user.id, req.params.id, JSON.stringify({ status: 'rejected', reason })]
    );
    sendMail({ to: rows[0].email, ...templates.sellerRejected(rows[0].first_name, reason) });
    return success(res, {}, 'Seller rejected');
  } catch (err) {
    next(err);
  }
};

exports.suspendSeller = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await query(
      `UPDATE seller_profiles SET status='suspended', rejection_reason=$1 WHERE id=$2`,
      [reason || 'Suspended by admin', req.params.id]
    );
    return success(res, {}, 'Seller suspended');
  } catch (err) {
    next(err);
  }
};

// ── USER MANAGEMENT ───────────────────────────────────────────

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, is_active } = req.query;
    const offset = (page - 1) * limit;

    const conditions = ['1=1'];
    const params = [];
    if (role) { params.push(role); conditions.push(`role=$${params.length}`); }
    if (is_active !== undefined) { params.push(is_active === 'true'); conditions.push(`is_active=$${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(email ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length})`);
    }

    const { rows } = await query(
      `SELECT id, email, phone, role, first_name, last_name, is_active,
              is_email_verified, last_login, created_at
       FROM users WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: cnt } = await query(
      `SELECT COUNT(*) FROM users WHERE ${conditions.join(' AND ')}`, params
    );
    return paginated(res, rows, parseInt(cnt[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE users SET is_active=NOT is_active WHERE id=$1 RETURNING id, is_active, email',
      [req.params.id]
    );
    if (!rows.length) return notFound(res, 'User not found');
    return success(res, rows[0], `User ${rows[0].is_active ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

// ── ORDER MANAGEMENT ──────────────────────────────────────────

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, payment_status, search } = req.query;
    const offset = (page - 1) * limit;

    const conditions = ['1=1'];
    const params = [];
    if (status) { params.push(status); conditions.push(`o.status=$${params.length}`); }
    if (payment_status) { params.push(payment_status); conditions.push(`o.payment_status=$${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(o.order_number ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const { rows } = await query(
      `SELECT o.*, u.first_name, u.last_name, u.email,
              COUNT(oi.id) as item_count
       FROM orders o
       JOIN users u ON u.id=o.buyer_id
       LEFT JOIN order_items oi ON oi.order_id=o.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY o.id, u.first_name, u.last_name, u.email
       ORDER BY o.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: cnt } = await query(
      `SELECT COUNT(*) FROM orders o JOIN users u ON u.id=o.buyer_id WHERE ${conditions.join(' AND ')}`,
      params
    );
    return paginated(res, rows, parseInt(cnt[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, tracking_number } = req.body;
    const updates = ['status=$1'];
    const params = [status, req.params.id];
    if (tracking_number) { updates.push(`tracking_number='${tracking_number}'`); }
    if (status === 'shipped') updates.push('shipped_at=NOW()');
    if (status === 'delivered') updates.push('delivered_at=NOW()');
    await query(`UPDATE orders SET ${updates.join(',')} WHERE id=$2`, params);
    return success(res, {}, 'Order status updated');
  } catch (err) {
    next(err);
  }
};

// ── BOOKS MANAGEMENT ──────────────────────────────────────────

exports.getAllBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, is_active } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ['1=1'];
    const params = [];
    if (search) { params.push(`%${search}%`); conditions.push(`(b.title ILIKE $${params.length} OR b.isbn ILIKE $${params.length})`); }
    if (category) { params.push(category); conditions.push(`c.slug=$${params.length}`); }
    if (is_active !== undefined) { params.push(is_active === 'true'); conditions.push(`b.is_active=$${params.length}`); }

    const { rows } = await query(
      `SELECT b.id, b.title, b.authors, b.selling_price, b.mrp, b.stock_quantity,
              b.is_active, b.is_featured, b.rating, b.total_sold, b.created_at,
              c.name as category_name, sp.store_name
       FROM books b
       LEFT JOIN categories c ON c.id=b.category_id
       JOIN seller_profiles sp ON sp.id=b.seller_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: cnt } = await query(
      `SELECT COUNT(*) FROM books b LEFT JOIN categories c ON c.id=b.category_id JOIN seller_profiles sp ON sp.id=b.seller_id WHERE ${conditions.join(' AND ')}`,
      params
    );
    return paginated(res, rows, parseInt(cnt[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

exports.toggleBookFeatured = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE books SET is_featured=NOT is_featured WHERE id=$1 RETURNING id, is_featured, title',
      [req.params.id]
    );
    return success(res, rows[0], `Book ${rows[0].is_featured ? 'featured' : 'unfeatured'}`);
  } catch (err) {
    next(err);
  }
};

// ── COUPON MANAGEMENT ─────────────────────────────────────────

exports.getCoupons = async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const { code, description, discount_type, discount_value, min_order_value,
            max_discount, usage_limit, valid_until } = req.body;
    const { rows } = await query(
      `INSERT INTO coupons (code,description,discount_type,discount_value,min_order_value,
                            max_discount,usage_limit,valid_until,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [code.toUpperCase(), description, discount_type, discount_value,
       min_order_value || 0, max_discount || null, usage_limit || null, valid_until || null, req.user.id]
    );
    return created(res, rows[0], 'Coupon created');
  } catch (err) {
    next(err);
  }
};

exports.toggleCoupon = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE coupons SET is_active=NOT is_active WHERE id=$1 RETURNING id, code, is_active',
      [req.params.id]
    );
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

// ── CATEGORIES MANAGEMENT ─────────────────────────────────────

exports.createCategory = async (req, res, next) => {
  try {
    const slugify = require('slugify');
    const { name, description, icon, parent_id, sort_order } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const { rows } = await query(
      `INSERT INTO categories (name, slug, description, icon, parent_id, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, slug, description, icon, parent_id || null, sort_order || 0]
    );
    return created(res, rows[0], 'Category created');
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, is_active, sort_order } = req.body;
    const { rows } = await query(
      `UPDATE categories SET
         name=COALESCE($1,name), description=COALESCE($2,description),
         icon=COALESCE($3,icon), is_active=COALESCE($4,is_active), sort_order=COALESCE($5,sort_order)
       WHERE id=$6 RETURNING *`,
      [name, description, icon, is_active, sort_order, req.params.id]
    );
    if (!rows.length) return notFound(res, 'Category not found');
    return success(res, rows[0], 'Category updated');
  } catch (err) {
    next(err);
  }
};

// ── AUDIT LOGS ────────────────────────────────────────────────

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const { rows } = await query(
      `SELECT al.*, u.email, u.first_name, u.last_name
       FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const { rows: cnt } = await query('SELECT COUNT(*) FROM audit_logs');
    return paginated(res, rows, parseInt(cnt[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// ── NOTIFICATIONS BROADCAST ───────────────────────────────────

exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, target_role } = req.body;
    let q = 'SELECT id FROM users WHERE is_active=TRUE';
    const params = [];
    if (target_role) { params.push(target_role); q += ` AND role=$1`; }
    const { rows: users } = await query(q, params);

    const values = users.map((u, i) =>
      `('${u.id}', '${title.replace(/'/g,"''")}', '${message.replace(/'/g,"''")}', '${type || 'info'}')`
    ).join(',');

    if (values) {
      await query(`INSERT INTO notifications (user_id, title, message, type) VALUES ${values}`);
    }
    return success(res, { sent_to: users.length }, 'Notifications sent');
  } catch (err) {
    next(err);
  }
};
