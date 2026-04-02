const slugify = require('slugify');
const { query, withTransaction } = require('../models/db');
const { success, created, badRequest, notFound, paginated, forbidden } = require('../utils/response');

// GET /books  (public - browse with filters, search, pagination)
exports.getBooks = async (req, res, next) => {
  try {
    const { search, category, min_price, max_price, language,
            condition, sort = 'created_at', order = 'desc',
            page = 1, limit = 24, featured } = req.query;
    const offset = (page - 1) * limit;

    const conditions = ['b.is_active=TRUE', 'sp.status=\'approved\''];
    const params = [];

    if (search) {
      params.push(search);
      conditions.push(`b.search_vector @@ plainto_tsquery('english', $${params.length})`);
    }
    if (category) {
      params.push(category);
      conditions.push(`c.slug=$${params.length}`);
    }
    if (min_price) { params.push(min_price); conditions.push(`b.selling_price>=$${params.length}`); }
    if (max_price) { params.push(max_price); conditions.push(`b.selling_price<=$${params.length}`); }
    if (language) { params.push(language); conditions.push(`b.language=$${params.length}`); }
    if (condition) { params.push(condition); conditions.push(`b.condition=$${params.length}`); }
    if (featured === 'true') conditions.push('b.is_featured=TRUE');

    const validSorts = { price: 'b.selling_price', rating: 'b.rating',
                         created_at: 'b.created_at', total_sold: 'b.total_sold' };
    const sortCol = validSorts[sort] || 'b.created_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const where = conditions.join(' AND ');
    const { rows } = await query(
      `SELECT b.id, b.title, b.slug, b.authors, b.cover_image_url,
              b.mrp, b.selling_price, b.rating, b.rating_count,
              b.stock_quantity, b.condition, b.language, b.is_featured,
              c.name as category_name, c.slug as category_slug,
              sp.store_name, sp.store_slug,
              ts_rank(b.search_vector, plainto_tsquery('english', COALESCE($${params.length + 1}, ''))) as rank
       FROM books b
       LEFT JOIN categories c ON c.id=b.category_id
       JOIN seller_profiles sp ON sp.id=b.seller_id
       WHERE ${where}
       ORDER BY ${sortCol} ${sortDir}
       LIMIT $${params.length + 2} OFFSET $${params.length + 3}`,
      [...params, search || '', limit, offset]
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM books b
       LEFT JOIN categories c ON c.id=b.category_id
       JOIN seller_profiles sp ON sp.id=b.seller_id
       WHERE ${where}`,
      params
    );

    return paginated(res, rows, parseInt(countRows[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /books/:slug  (public)
exports.getBook = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT b.*, c.name as category_name, c.slug as category_slug,
              sp.store_name, sp.store_slug, sp.store_logo_url, sp.rating as seller_rating
       FROM books b
       LEFT JOIN categories c ON c.id=b.category_id
       JOIN seller_profiles sp ON sp.id=b.seller_id
       WHERE b.slug=$1 AND b.is_active=TRUE AND sp.status='approved'`,
      [req.params.slug]
    );
    if (!rows.length) return notFound(res, 'Book not found');

    // Get reviews
    const { rows: reviews } = await query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r JOIN users u ON u.id=r.user_id
       WHERE r.book_id=$1 AND r.is_approved=TRUE
       ORDER BY r.created_at DESC LIMIT 10`,
      [rows[0].id]
    );

    return success(res, { ...rows[0], reviews });
  } catch (err) {
    next(err);
  }
};

// POST /seller/books  (seller only)
exports.createBook = async (req, res, next) => {
  try {
    const { title, subtitle, description, isbn, isbn13, authors, publisher,
            publication_year, edition, language, pages, category_id,
            mrp, selling_price, stock_quantity, condition,
            cover_image_url, additional_images, tags, weight_grams, dimensions_cm } = req.body;

    if (selling_price > mrp) return badRequest(res, 'Selling price cannot exceed MRP');

    let slug = slugify(`${title}-${authors[0] || ''}`, { lower: true, strict: true });
    const slugCheck = await query('SELECT id FROM books WHERE slug=$1', [slug]);
    if (slugCheck.rows.length) slug = `${slug}-${Date.now()}`;

    const { rows } = await query(
      `INSERT INTO books
         (seller_id, category_id, title, subtitle, slug, description, isbn, isbn13,
          authors, publisher, publication_year, edition, language, pages,
          cover_image_url, additional_images, condition, mrp, selling_price,
          stock_quantity, tags, weight_grams, dimensions_cm)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING *`,
      [req.seller.id, category_id, title, subtitle, slug, description, isbn, isbn13,
       authors, publisher, publication_year, edition, language, pages,
       cover_image_url, additional_images || [], condition || 'new',
       mrp, selling_price, stock_quantity, tags || [], weight_grams, dimensions_cm || null]
    );

    return created(res, rows[0], 'Book listed successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /seller/books/:id
exports.updateBook = async (req, res, next) => {
  try {
    const { rows: existing } = await query(
      'SELECT id FROM books WHERE id=$1 AND seller_id=$2', [req.params.id, req.seller.id]
    );
    if (!existing.length) return notFound(res, 'Book not found or unauthorized');

    const fields = ['title','subtitle','description','isbn','isbn13','authors','publisher',
                    'publication_year','edition','language','pages','category_id',
                    'mrp','selling_price','stock_quantity','condition','cover_image_url',
                    'additional_images','tags','weight_grams','dimensions_cm','is_active'];
    const updates = [];
    const params = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        params.push(req.body[f]);
        updates.push(`${f}=$${params.length}`);
      }
    });

    if (!updates.length) return badRequest(res, 'No fields to update');
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE books SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`, params
    );
    return success(res, rows[0], 'Book updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /seller/books/:id
exports.deleteBook = async (req, res, next) => {
  try {
    await query(
      'UPDATE books SET is_active=FALSE WHERE id=$1 AND seller_id=$2',
      [req.params.id, req.seller.id]
    );
    return success(res, {}, 'Book delisted');
  } catch (err) {
    next(err);
  }
};

// GET /seller/books  (seller's own books)
exports.getMyBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const conditions = ['seller_id=$1'];
    const params = [req.seller.id];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    const { rows } = await query(
      `SELECT b.*, c.name as category_name
       FROM books b LEFT JOIN categories c ON c.id=b.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: cnt } = await query(
      `SELECT COUNT(*) FROM books WHERE ${conditions.join(' AND ')}`, params
    );
    return paginated(res, rows, parseInt(cnt[0].count), page, limit);
  } catch (err) {
    next(err);
  }
};

// POST /books/:id/reviews
exports.addReview = async (req, res, next) => {
  try {
    const { rating, title, body, order_id } = req.body;
    const { rows } = await query(
      `INSERT INTO reviews (book_id, user_id, order_id, rating, title, body, is_verified_purchase)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, req.user.id, order_id || null, rating, title, body, !!order_id]
    );
    return created(res, rows[0], 'Review submitted');
  } catch (err) {
    next(err);
  }
};

// GET /categories
exports.getCategories = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.*, COUNT(sp.id) as book_count
       FROM categories c
       LEFT JOIN books b ON b.category_id=c.id AND b.is_active=TRUE
       LEFT JOIN seller_profiles sp ON sp.id=b.seller_id AND sp.status='approved'
       WHERE c.is_active=TRUE
       GROUP BY c.id ORDER BY c.sort_order`
    );
    return success(res, rows);
  } catch (err) {
    next(err);
  }
};
