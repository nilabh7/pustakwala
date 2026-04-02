const { query } = require('../models/db');
const { success, created, badRequest, notFound } = require('../utils/response');

// ── CART ──────────────────────────────────────────────────────

exports.getCart = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ci.id, ci.quantity, ci.updated_at,
              b.id as book_id, b.title, b.slug, b.authors,
              b.cover_image_url, b.selling_price, b.mrp, b.stock_quantity,
              b.is_active, sp.store_name
       FROM cart_items ci
       JOIN books b ON b.id=ci.book_id
       JOIN seller_profiles sp ON sp.id=b.seller_id
       WHERE ci.user_id=$1
       ORDER BY ci.updated_at DESC`,
      [req.user.id]
    );
    const subtotal = rows.reduce((s, i) => s + i.selling_price * i.quantity, 0);
    const shipping = subtotal >= 499 ? 0 : 49;
    return success(res, { items: rows, subtotal, shipping, total: subtotal + shipping });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { book_id, quantity = 1 } = req.body;
    const { rows: bookRows } = await query(
      `SELECT b.id, b.stock_quantity, b.is_active
       FROM books b
       JOIN seller_profiles sp ON sp.id = b.seller_id
       WHERE b.id=$1 AND sp.status='approved'`,
      [book_id]
    );
    if (!bookRows.length || !bookRows[0].is_active) return notFound(res, 'Book not found');
    if (bookRows[0].stock_quantity < quantity) return badRequest(res, 'Insufficient stock');

    const { rows } = await query(
      `INSERT INTO cart_items (user_id, book_id, quantity)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, book_id)
       DO UPDATE SET quantity=cart_items.quantity+$3, updated_at=NOW()
       RETURNING *`,
      [req.user.id, book_id, quantity]
    );
    return success(res, rows[0], 'Added to cart');
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      await query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
      return success(res, {}, 'Item removed from cart');
    }
    const { rows } = await query(
      'UPDATE cart_items SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
      [quantity, req.params.id, req.user.id]
    );
    if (!rows.length) return notFound(res, 'Cart item not found');
    return success(res, rows[0], 'Cart updated');
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    await query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    return success(res, {}, 'Item removed from cart');
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    return success(res, {}, 'Cart cleared');
  } catch (err) {
    next(err);
  }
};

// ── WISHLIST ──────────────────────────────────────────────────

exports.getWishlist = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT w.id, w.created_at,
              b.id as book_id, b.title, b.slug, b.authors,
              b.cover_image_url, b.selling_price, b.mrp, b.rating, b.stock_quantity
       FROM wishlists w
       JOIN books b ON b.id=w.book_id
       JOIN seller_profiles sp ON sp.id=b.seller_id
       WHERE w.user_id=$1 AND b.is_active=TRUE
         AND sp.status='approved'
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { book_id } = req.body;
    const existing = await query(
      'SELECT id FROM wishlists WHERE user_id=$1 AND book_id=$2', [req.user.id, book_id]
    );
    if (existing.rows.length) {
      await query('DELETE FROM wishlists WHERE user_id=$1 AND book_id=$2', [req.user.id, book_id]);
      return success(res, { wishlisted: false }, 'Removed from wishlist');
    }
    await query('INSERT INTO wishlists (user_id, book_id) VALUES ($1,$2)', [req.user.id, book_id]);
    return success(res, { wishlisted: true }, 'Added to wishlist');
  } catch (err) {
    next(err);
  }
};

// ── ADDRESSES ─────────────────────────────────────────────────

exports.getAddresses = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const { type, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;
    if (is_default) {
      await query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    const { rows } = await query(
      `INSERT INTO addresses (user_id,type,full_name,phone,address_line1,address_line2,city,state,pincode,is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, type||'home', full_name, phone, address_line1, address_line2||null, city, state, pincode, !!is_default]
    );
    return created(res, rows[0], 'Address added');
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const fields = ['type','full_name','phone','address_line1','address_line2','city','state','pincode','is_default'];
    const updates = [], params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { params.push(req.body[f]); updates.push(`${f}=$${params.length}`); }
    });
    if (req.body.is_default) {
      await query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    params.push(req.params.id, req.user.id);
    const { rows } = await query(
      `UPDATE addresses SET ${updates.join(',')} WHERE id=$${params.length-1} AND user_id=$${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return notFound(res, 'Address not found');
    return success(res, rows[0], 'Address updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    await query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    return success(res, {}, 'Address deleted');
  } catch (err) {
    next(err);
  }
};

// ── COUPONS ───────────────────────────────────────────────────

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, order_value } = req.body;
    const { rows } = await query(
      `SELECT * FROM coupons WHERE code=$1 AND is_active=TRUE
       AND valid_from<=NOW() AND (valid_until IS NULL OR valid_until>=NOW())
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [code]
    );
    if (!rows.length) return badRequest(res, 'Invalid or expired coupon');
    const c = rows[0];
    if (order_value < c.min_order_value)
      return badRequest(res, `Minimum order value ₹${c.min_order_value} required`);

    const discount = c.discount_type === 'percentage'
      ? Math.min(order_value * c.discount_value / 100, c.max_discount || Infinity)
      : c.discount_value;

    return success(res, { coupon: c, discount_amount: discount }, 'Coupon applied');
  } catch (err) {
    next(err);
  }
};
