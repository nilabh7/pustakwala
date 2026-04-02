const slugify = require('slugify');
const { query, withTransaction } = require('../models/db');
const { sendMail, templates } = require('../utils/email');
const { success, created, badRequest, notFound, paginated } = require('../utils/response');

// POST /sellers/register
exports.registerSeller = async (req, res, next) => {
  try {
    const { store_name, store_description, gst_number, pan_number,
            bank_account_number, bank_ifsc, bank_holder_name } = req.body;

    const existing = await query('SELECT id FROM seller_profiles WHERE user_id=$1', [req.user.id]);
    if (existing.rows.length) return badRequest(res, 'Seller profile already exists');

    let slug = slugify(store_name, { lower: true, strict: true });
    // Ensure unique slug
    const slugCheck = await query('SELECT id FROM seller_profiles WHERE store_slug=$1', [slug]);
    if (slugCheck.rows.length) slug = `${slug}-${Date.now()}`;

    const { rows } = await query(
      `INSERT INTO seller_profiles
         (user_id, store_name, store_slug, store_description, gst_number, pan_number,
          bank_account_number, bank_ifsc, bank_holder_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [req.user.id, store_name, slug, store_description, gst_number,
       pan_number, bank_account_number, bank_ifsc, bank_holder_name]
    );

    // Update user role to seller
    await query('UPDATE users SET role=$1 WHERE id=$2', ['seller', req.user.id]);

    return created(res, rows[0], 'Seller registration submitted. Awaiting admin approval.');
  } catch (err) {
    next(err);
  }
};

// GET /sellers/me
exports.getMyProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT sp.*, u.email, u.first_name, u.last_name, u.phone
       FROM seller_profiles sp JOIN users u ON u.id = sp.user_id
       WHERE sp.user_id = $1`,
      [req.user.id]
    );
    if (!rows.length) return notFound(res, 'Seller profile not found');
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /sellers/me
exports.updateProfile = async (req, res, next) => {
  try {
    const { store_name, store_description, gst_number, pan_number,
            bank_account_number, bank_ifsc, bank_holder_name } = req.body;
    const { rows } = await query(
      `UPDATE seller_profiles SET
         store_name=COALESCE($1,store_name),
         store_description=COALESCE($2,store_description),
         gst_number=COALESCE($3,gst_number),
         pan_number=COALESCE($4,pan_number),
         bank_account_number=COALESCE($5,bank_account_number),
         bank_ifsc=COALESCE($6,bank_ifsc),
         bank_holder_name=COALESCE($7,bank_holder_name)
       WHERE user_id=$8 RETURNING *`,
      [store_name, store_description, gst_number, pan_number,
       bank_account_number, bank_ifsc, bank_holder_name, req.user.id]
    );
    return success(res, rows[0], 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// GET /sellers/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const { rows: sellerRows } = await query(
      'SELECT id FROM seller_profiles WHERE user_id=$1', [req.user.id]
    );
    if (!sellerRows.length) return notFound(res, 'Seller not found');
    const sellerId = sellerRows[0].id;

    const [revenue, orders, books, pending] = await Promise.all([
      query(`SELECT COALESCE(SUM(oi.total_price),0) as total_revenue,
                    COUNT(DISTINCT oi.order_id) as total_orders
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.seller_id=$1 AND o.payment_status='paid'`, [sellerId]),
      query(`SELECT status, COUNT(*) as count FROM order_items
             WHERE seller_id=$1 GROUP BY status`, [sellerId]),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_active) as active,
                    COUNT(*) FILTER(WHERE stock_quantity=0) as out_of_stock
             FROM books WHERE seller_id=$1`, [sellerId]),
      query(`SELECT COUNT(*) as pending_orders FROM order_items oi
             JOIN orders o ON o.id=oi.order_id
             WHERE oi.seller_id=$1 AND oi.status='confirmed'`, [sellerId]),
    ]);

    // Recent orders
    const { rows: recentOrders } = await query(
      `SELECT o.order_number, o.created_at, o.total_amount, o.status,
              u.first_name, u.last_name,
              array_agg(b.title) as book_titles
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN books b ON b.id = oi.book_id
       JOIN users u ON u.id = o.buyer_id
       WHERE oi.seller_id=$1
       GROUP BY o.id, u.first_name, u.last_name
       ORDER BY o.created_at DESC LIMIT 5`,
      [sellerId]
    );

    return success(res, {
      revenue: revenue.rows[0],
      orderStats: orders.rows,
      bookStats: books.rows[0],
      pendingOrders: pending.rows[0].pending_orders,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};

// GET /sellers/:sellerId/public
exports.getPublicProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT sp.store_name, sp.store_slug, sp.store_description,
              sp.store_logo_url, sp.store_banner_url, sp.rating,
              sp.rating_count, sp.total_sales, sp.created_at,
              u.first_name, u.last_name
       FROM seller_profiles sp JOIN users u ON u.id=sp.user_id
       WHERE sp.store_slug=$1 AND sp.status='approved'`,
      [req.params.slug]
    );
    if (!rows.length) return notFound(res, 'Store not found');
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /sellers/orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const { rows: sellerRows } = await query(
      'SELECT id FROM seller_profiles WHERE user_id=$1', [req.user.id]
    );
    if (!sellerRows.length) return notFound(res, 'Seller not found');
    const sellerId = sellerRows[0].id;

    const conditions = ['oi.seller_id=$1'];
    const params = [sellerId];
    if (status) { conditions.push(`oi.status=$${params.length + 1}`); params.push(status); }

    const where = conditions.join(' AND ');
    const { rows } = await query(
      `SELECT oi.*, o.order_number, o.created_at, o.payment_status,
              b.title, b.cover_image_url,
              u.first_name, u.last_name, u.email,
              a.city, a.state, a.pincode
       FROM order_items oi
       JOIN orders o ON o.id=oi.order_id
       JOIN books b ON b.id=oi.book_id
       JOIN users u ON u.id=o.buyer_id
       LEFT JOIN addresses a ON a.id=o.shipping_address_id
       WHERE ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM order_items oi WHERE ${where}`, params
    );
    return paginated(res, rows, parseInt(countRows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// PUT /sellers/orders/:orderId/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, tracking_number } = req.body;
    const { rows: sellerRows } = await query(
      'SELECT id FROM seller_profiles WHERE user_id=$1', [req.user.id]
    );
    const sellerId = sellerRows[0].id;

    await query(
      'UPDATE order_items SET status=$1 WHERE id=$2 AND seller_id=$3',
      [status, req.params.orderId, sellerId]
    );

    if (tracking_number) {
      await query('UPDATE orders SET tracking_number=$1, shipped_at=NOW() WHERE id=(SELECT order_id FROM order_items WHERE id=$2)',
        [tracking_number, req.params.orderId]
      );
    }
    return success(res, {}, 'Order status updated');
  } catch (err) {
    next(err);
  }
};
