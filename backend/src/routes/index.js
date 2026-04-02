const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, authorize, requireApprovedSeller } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/error.middleware');

const authCtrl    = require('../controllers/auth.controller');
const bookCtrl    = require('../controllers/book.controller');
const cartCtrl    = require('../controllers/cart.controller');
const orderCtrl   = require('../controllers/order.controller');
const sellerCtrl  = require('../controllers/seller.controller');
const adminCtrl   = require('../controllers/admin.controller');
const userCtrl    = require('../controllers/user.controller');

const router = express.Router();

// ── AUTH ──────────────────────────────────────────────────────
router.post('/auth/register',
  [body('email').isEmail(), body('password').isLength({ min: 8 }),
   body('first_name').notEmpty(), body('last_name').notEmpty()],
  validate, authCtrl.register);

router.post('/auth/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate, authCtrl.login);

router.post('/auth/refresh',   authCtrl.refresh);
router.post('/auth/forgot-password', [body('email').isEmail()], validate, authCtrl.forgotPassword);
router.post('/auth/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate, authCtrl.resetPassword);
router.post('/auth/verify-email', [body('token').notEmpty()], validate, authCtrl.verifyEmail);
router.get('/auth/me', authenticate, authCtrl.me);
router.put('/auth/change-password', authenticate,
  [body('current_password').notEmpty(), body('new_password').isLength({ min: 8 })],
  validate, authCtrl.changePassword);

// ── PUBLIC BOOKS ──────────────────────────────────────────────
router.get('/books',             bookCtrl.getBooks);
router.get('/books/:slug',       bookCtrl.getBook);
router.get('/categories',        bookCtrl.getCategories);
router.post('/books/:id/reviews', authenticate, authorize('buyer'),
  [body('rating').isInt({ min:1, max:5 }), body('body').notEmpty()],
  validate, bookCtrl.addReview);

// ── USER PROFILE ──────────────────────────────────────────────
router.put('/users/me',           authenticate, userCtrl.updateProfile);
router.get('/users/notifications',authenticate, userCtrl.getNotifications);
router.put('/users/notifications/read', authenticate, userCtrl.markNotificationsRead);

// ── CART ──────────────────────────────────────────────────────
router.get('/cart',              authenticate, cartCtrl.getCart);
router.post('/cart',             authenticate, [body('book_id').isUUID()], validate, cartCtrl.addToCart);
router.put('/cart/:id',          authenticate, [body('quantity').isInt({ min:0 })], validate, cartCtrl.updateCartItem);
router.delete('/cart/:id',       authenticate, cartCtrl.removeFromCart);
router.delete('/cart',           authenticate, cartCtrl.clearCart);

// ── WISHLIST ──────────────────────────────────────────────────
router.get('/wishlist',          authenticate, cartCtrl.getWishlist);
router.post('/wishlist/toggle',  authenticate, [body('book_id').isUUID()], validate, cartCtrl.toggleWishlist);

// ── ADDRESSES ─────────────────────────────────────────────────
router.get('/addresses',         authenticate, cartCtrl.getAddresses);
router.post('/addresses',        authenticate,
  [body('full_name').notEmpty(), body('phone').notEmpty(),
   body('address_line1').notEmpty(), body('city').notEmpty(),
   body('state').notEmpty(), body('pincode').notEmpty()],
  validate, cartCtrl.addAddress);
router.put('/addresses/:id',     authenticate, cartCtrl.updateAddress);
router.delete('/addresses/:id',  authenticate, cartCtrl.deleteAddress);

// ── COUPONS ───────────────────────────────────────────────────
router.post('/coupons/validate', authenticate, cartCtrl.validateCoupon);

// ── ORDERS ────────────────────────────────────────────────────
router.post('/orders',           authenticate, authorize('buyer'),
  [body('address_id').isUUID(), body('payment_method').notEmpty()],
  validate, orderCtrl.placeOrder);
router.get('/orders',            authenticate, authorize('buyer'), orderCtrl.getMyOrders);
router.get('/orders/:id',        authenticate, orderCtrl.getOrder);
router.post('/orders/:id/cancel',authenticate, authorize('buyer'), orderCtrl.cancelOrder);

// ── SELLER ────────────────────────────────────────────────────
router.post('/sellers/register', authenticate,
  [body('store_name').notEmpty().trim()],
  validate, sellerCtrl.registerSeller);
router.get('/sellers/me',        authenticate, authorize('seller'), sellerCtrl.getMyProfile);
router.put('/sellers/me',        authenticate, authorize('seller'), sellerCtrl.updateProfile);
router.get('/sellers/dashboard', authenticate, authorize('seller'), sellerCtrl.getDashboard);
router.get('/sellers/orders',    authenticate, authorize('seller'), sellerCtrl.getMyOrders);
router.put('/sellers/orders/:orderId/status', authenticate, authorize('seller'),
  [body('status').notEmpty()], validate, sellerCtrl.updateOrderStatus);
router.get('/sellers/:slug/public', sellerCtrl.getPublicProfile);

// Seller book management
router.get('/seller/books',      authenticate, authorize('seller'), requireApprovedSeller, bookCtrl.getMyBooks);
router.post('/seller/books',     authenticate, authorize('seller'), requireApprovedSeller,
  [body('title').notEmpty(), body('authors').isArray({ min:1 }),
   body('mrp').isFloat({ min:1 }), body('selling_price').isFloat({ min:1 }),
   body('stock_quantity').isInt({ min:0 })],
  validate, bookCtrl.createBook);
router.put('/seller/books/:id',  authenticate, authorize('seller'), requireApprovedSeller, bookCtrl.updateBook);
router.delete('/seller/books/:id', authenticate, authorize('seller'), requireApprovedSeller, bookCtrl.deleteBook);

// ── ADMIN ─────────────────────────────────────────────────────
const adm = authenticate, role = (r) => authorize(r);
router.get('/admin/dashboard',          adm, role('admin'), adminCtrl.getDashboard);

router.get('/admin/sellers',            adm, role('admin'), adminCtrl.getSellers);
router.get('/admin/sellers/:id',        adm, role('admin'), adminCtrl.getSellerDetail);
router.post('/admin/sellers/:id/approve', adm, role('admin'), adminCtrl.approveSeller);
router.post('/admin/sellers/:id/reject',  adm, role('admin'),
  [body('reason').notEmpty()], validate, adminCtrl.rejectSeller);
router.post('/admin/sellers/:id/suspend', adm, role('admin'), adminCtrl.suspendSeller);

router.get('/admin/users',              adm, role('admin'), adminCtrl.getUsers);
router.put('/admin/users/:id/toggle',   adm, role('admin'), adminCtrl.toggleUserStatus);

router.get('/admin/orders',             adm, role('admin'), adminCtrl.getAllOrders);
router.put('/admin/orders/:id/status',  adm, role('admin'), adminCtrl.updateOrderStatus);

router.get('/admin/books',              adm, role('admin'), adminCtrl.getAllBooks);
router.put('/admin/books/:id/feature',  adm, role('admin'), adminCtrl.toggleBookFeatured);

router.get('/admin/coupons',            adm, role('admin'), adminCtrl.getCoupons);
router.post('/admin/coupons',           adm, role('admin'),
  [body('code').notEmpty(), body('discount_type').isIn(['percentage','fixed']),
   body('discount_value').isFloat({ min:1 })],
  validate, adminCtrl.createCoupon);
router.put('/admin/coupons/:id/toggle', adm, role('admin'), adminCtrl.toggleCoupon);

router.post('/admin/categories',        adm, role('admin'),
  [body('name').notEmpty()], validate, adminCtrl.createCategory);
router.put('/admin/categories/:id',     adm, role('admin'), adminCtrl.updateCategory);

router.get('/admin/audit-logs',         adm, role('admin'), adminCtrl.getAuditLogs);
router.post('/admin/notifications',     adm, role('admin'),
  [body('title').notEmpty(), body('message').notEmpty()],
  validate, adminCtrl.sendNotification);

module.exports = router;
