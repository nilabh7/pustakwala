-- ============================================================
-- PUSTAKWALA - Seed Data (Windows-safe, no emoji)
-- ============================================================

SET client_encoding = 'UTF8';

-- Categories (icon column stores text label, no emoji)
INSERT INTO categories (id, name, slug, description, icon, sort_order) VALUES
  (uuid_generate_v4(), 'Fiction',              'fiction',           'Novels, short stories, and literary works',       'fiction',    1),
  (uuid_generate_v4(), 'Non-Fiction',           'non-fiction',       'Factual books across all subjects',               'nonfiction', 2),
  (uuid_generate_v4(), 'Academic',              'academic',          'Textbooks, NCERT, competitive exam guides',       'academic',   3),
  (uuid_generate_v4(), 'Children',              'children',          'Books for kids of all ages',                      'children',   4),
  (uuid_generate_v4(), 'Regional Languages',    'regional',          'Books in Hindi, Bengali, Tamil and more',         'regional',   5),
  (uuid_generate_v4(), 'Self-Help',             'self-help',         'Personal development and motivation',             'selfhelp',   6),
  (uuid_generate_v4(), 'Biography',             'biography',         'Life stories of inspiring people',                'biography',  7),
  (uuid_generate_v4(), 'History',               'history',           'Indian and world history',                        'history',    8),
  (uuid_generate_v4(), 'Science & Technology',  'science-technology','Science, tech and engineering books',             'science',    9),
  (uuid_generate_v4(), 'Spiritual',             'spiritual',         'Vedic, spiritual and philosophical works',        'spiritual',  10),
  (uuid_generate_v4(), 'Business & Finance',    'business-finance',  'Business, economics and investing',               'business',   11),
  (uuid_generate_v4(), 'Comics & Manga',        'comics-manga',      'Graphic novels and illustrated stories',          'comics',     12);

-- Admin user (password: Admin@123)
INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, is_active, is_email_verified) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@pustakwala.com',
   '9000000000',
   '$2b$12$QLTwsQnvSPB3q.6mTnZVf.JaO4EVWh62YkBoVxujPRHORyzbkmmdO',
   'admin', 'Super', 'Admin', TRUE, TRUE);

-- Default coupons
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, valid_until, created_by)
VALUES
  ('PUSTAK20', 'Welcome 20% Off',          'percentage', 20, 299, 200, 1000, NOW() + INTERVAL '1 year',   '00000000-0000-0000-0000-000000000001'),
  ('FLAT100',  'Flat Rs.100 off on Rs.599+','fixed',     100, 599, 100,  500, NOW() + INTERVAL '1 year',   '00000000-0000-0000-0000-000000000001'),
  ('BOOKS15',  '15% off on all books',     'percentage', 15, 199, 150, NULL, NOW() + INTERVAL '6 months', '00000000-0000-0000-0000-000000000001');
