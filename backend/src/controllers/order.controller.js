const { query, withTransaction } = require('../models/db');
const { success, created, badRequest, notFound, paginated, forbidden } = require('../utils/response');
const { sendMail, templates } = require('../utils/email');

const generateOrderNumber = () =>
  `PW${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

// POST /orders  (buyer places order)
exports.placeOrder = async (req, res, next) => {
  try {
    const { address_id, payment_method, coupon_code, notes } = req.body;

    await withTransaction(async (client) => {
      // Get cart items with book details
      const { rows: cartItems } = await client.query(
        `SELECT ci.quantity, b.id as book_id, b.title, b.selling_price,
                b.stock_quantity, b.seller_id, b.cover_image_url,
                b.authors, b.isbn
         FROM cart_items ci
         JOIN books b ON b.id=ci.book_id
         JOIN seller_profiles sp ON sp.id=b.seller_id
         WHERE ci.user_id=$1 AND b.is_active=TRUE AND sp.status='approved'`,
        [req.user.id]
      );

      if (!cartItems.length) throw Object.assign(new Error('Cart is empty'), { statusCode: 400 });

      // Check stock
      for (const item of cartItems) {
        if (item.stock_quantity < item.quantity) {
          throw Object.assign(
            new Error(`Insufficient stock for "${item.title}"`),
            { statusCode: 400 }
          );
        }
      }

      // Get shipping address
      const { rows: addrRows } = await client.query(
        'SELECT * FROM addresses WHERE id=$1 AND user_id=$2', [address_id, req.user.id]
      );
      if (!addrRows.length) throw Object.assign(new Error('Address not found'), { statusCode: 400 });
      const address = addrRows[0];

      // Calculate totals
      const subtotal = cartItems.reduce((s, i) => s + i.selling_price * i.quantity, 0);
      const shipping_charge = subtotal >= 499 ? 0 : 49;
      let discount_amount = 0;
      let coupon_id = null;

      // Apply coupon
      if (coupon_code) {
        const { rows: couponRows } = await client.query(
          `SELECT * FROM coupons WHERE code=$1 AND is_active=TRUE
           AND valid_from<=NOW() AND (valid_until IS NULL OR valid_until>=NOW())
           AND (usage_limit IS NULL OR used_count < usage_limit)`,
          [coupon_code]
        );
        if (couponRows.length) {
          const c = couponRows[0];
          if (subtotal >= c.min_order_value) {
            discount_amount = c.discount_type === 'percentage'
              ? Math.min(subtotal * c.discount_value / 100, c.max_discount || Infinity)
              : c.discount_value;
            coupon_id = c.id;
            await client.query('UPDATE coupons SET used_count=used_count+1 WHERE id=$1', [c.id]);
          }
        }
      }

      const tax_amount = 0; // GST handled at seller level
      const total_amount = subtotal + shipping_charge - discount_amount + tax_amount;
      const order_number = generateOrderNumber();

      // Insert order
      const { rows: orderRows } = await client.query(
        `INSERT INTO orders
           (order_number, buyer_id, shipping_address_id, shipping_address_snapshot,
            payment_method, subtotal, shipping_charge, discount_amount,
            coupon_id, coupon_code, tax_amount, total_amount, notes, status, payment_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'confirmed','paid')
         RETURNING *`,
        [order_number, req.user.id, address_id,
         JSON.stringify(address), payment_method,
         subtotal, shipping_charge, discount_amount,
         coupon_id, coupon_code || null, tax_amount, total_amount, notes || null]
      );
      const order = orderRows[0];

      // Insert order items & decrement stock
      for (const item of cartItems) {
        await client.query(
          `INSERT INTO order_items
             (order_id, book_id, seller_id, quantity, unit_price, total_price, book_snapshot, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed')`,
          [order.id, item.book_id, item.seller_id, item.quantity,
           item.selling_price, item.selling_price * item.quantity,
           JSON.stringify({ title: item.title, cover: item.cover_image_url,
                           authors: item.authors, isbn: item.isbn })]
        );
        await client.query(
          'UPDATE books SET stock_quantity=stock_quantity-$1, total_sold=total_sold+$1 WHERE id=$2',
          [item.quantity, item.book_id]
        );
      }

      // Clear cart
      await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);

      // Update seller stats
      for (const item of cartItems) {
        await client.query(
          'UPDATE seller_profiles SET total_sales=total_sales+$1, total_revenue=total_revenue+$2 WHERE id=$3',
          [item.quantity, item.selling_price * item.quantity, item.seller_id]
        );
      }

      // Send confirmation email
      const { rows: userRows } = await client.query(
        'SELECT first_name, email FROM users WHERE id=$1', [req.user.id]
      );
      sendMail({ to: userRows[0].email, ...templates.orderConfirmed(userRows[0].first_name, order_number, total_amount) });

      return created(res, order, 'Order placed successfully');
    });
  } catch (err) {
    next(err);
  }
};

// GET /orders  (buyer's orders)
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const conditions = ['o.buyer_id=$1'];
    const params = [req.user.id];
    if (status) { params.push(status); conditions.push(`o.status=$${params.length}`); }

    const { rows } = await query(
      `SELECT o.*, array_agg(json_build_object(
         'id', oi.id, 'title', b.title, 'cover', b.cover_image_url,
         'quantity', oi.quantity, 'price', oi.unit_price, 'status', oi.status
       )) as items
       FROM orders o
       JOIN order_items oi ON oi.order_id=o.id
       JOIN books b ON b.id=oi.book_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: cnt } = await query(
      `SELECT COUNT(*) FROM orders o WHERE ${conditions.join(' AND ')}`, params
    );
    return paginated(res, rows, parseInt(cnt[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*,
              json_agg(json_build_object(
                'id', oi.id, 'book_id', oi.book_id, 'title', b.title,
                'cover', b.cover_image_url, 'authors', b.authors,
                'quantity', oi.quantity, 'unit_price', oi.unit_price,
                'total_price', oi.total_price, 'status', oi.status,
                'store_name', sp.store_name
              )) as items
       FROM orders o
       JOIN order_items oi ON oi.order_id=o.id
       JOIN books b ON b.id=oi.book_id
       JOIN seller_profiles sp ON sp.id=oi.seller_id
       WHERE o.id=$1 AND (o.buyer_id=$2 OR $3='admin')
       GROUP BY o.id`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!rows.length) return notFound(res, 'Order not found');
    return success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const { rows } = await query(
      'SELECT * FROM orders WHERE id=$1 AND buyer_id=$2', [req.params.id, req.user.id]
    );
    if (!rows.length) return notFound(res, 'Order not found');
    if (!['pending', 'confirmed'].includes(rows[0].status)) {
      return badRequest(res, 'Order cannot be cancelled at this stage');
    }
    await query(
      `UPDATE orders SET status='cancelled', cancelled_at=NOW(), cancel_reason=$1 WHERE id=$2`,
      [reason || 'Cancelled by buyer', req.params.id]
    );
    // Restore stock
    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id=$1', [req.params.id]);
    for (const item of items) {
      await query('UPDATE books SET stock_quantity=stock_quantity+$1 WHERE id=$2', [item.quantity, item.book_id]);
    }
    return success(res, {}, 'Order cancelled');
  } catch (err) {
    next(err);
  }
};
