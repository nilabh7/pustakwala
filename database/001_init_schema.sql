-- ============================================================
-- PUSTAKWALA - Complete Database Schema
-- PostgreSQL 15+
-- ============================================================

SET client_encoding = 'UTF8';
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE seller_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('upi', 'card', 'netbanking', 'cod', 'wallet');
CREATE TYPE book_condition AS ENUM ('new', 'like_new', 'good', 'acceptable');
CREATE TYPE address_type AS ENUM ('home', 'office', 'other');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'buyer',
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verify_token VARCHAR(255),
    email_verify_expires TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================================
-- SELLER PROFILES
-- ============================================================
CREATE TABLE seller_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name      VARCHAR(255) NOT NULL,
    store_slug      VARCHAR(255) UNIQUE NOT NULL,
    store_description TEXT,
    store_logo_url  TEXT,
    store_banner_url TEXT,
    gst_number      VARCHAR(20),
    pan_number      VARCHAR(20),
    bank_account_number VARCHAR(30),
    bank_ifsc       VARCHAR(15),
    bank_holder_name VARCHAR(100),
    status          seller_status DEFAULT 'pending',
    rejection_reason TEXT,
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    total_sales     INTEGER DEFAULT 0,
    total_revenue   NUMERIC(12,2) DEFAULT 0,
    rating          NUMERIC(3,2) DEFAULT 0,
    rating_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seller_user_id ON seller_profiles(user_id);
CREATE INDEX idx_seller_status ON seller_profiles(status);
CREATE INDEX idx_seller_slug ON seller_profiles(store_slug);

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE addresses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            address_type DEFAULT 'home',
    full_name       VARCHAR(200) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(10) NOT NULL,
    country         VARCHAR(100) DEFAULT 'India',
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    icon            VARCHAR(10),
    image_url       TEXT,
    parent_id       UUID REFERENCES categories(id),
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE books (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id       UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id),
    title           VARCHAR(500) NOT NULL,
    subtitle        VARCHAR(500),
    slug            VARCHAR(600) UNIQUE NOT NULL,
    description     TEXT,
    isbn            VARCHAR(20),
    isbn13          VARCHAR(20),
    authors         TEXT[] NOT NULL DEFAULT '{}',
    publisher       VARCHAR(255),
    publication_year INTEGER,
    edition         VARCHAR(50),
    language        VARCHAR(50) DEFAULT 'English',
    pages           INTEGER,
    cover_image_url TEXT,
    additional_images TEXT[],
    condition       book_condition DEFAULT 'new',
    mrp             NUMERIC(10,2) NOT NULL,
    selling_price   NUMERIC(10,2) NOT NULL,
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    is_featured     BOOLEAN DEFAULT FALSE,
    tags            TEXT[],
    weight_grams    INTEGER,
    dimensions_cm   JSONB,
    rating          NUMERIC(3,2) DEFAULT 0,
    rating_count    INTEGER DEFAULT 0,
    total_sold      INTEGER DEFAULT 0,
    search_vector   TSVECTOR,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_seller ON books(seller_id);
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_slug ON books(slug);
CREATE INDEX idx_books_active ON books(is_active);
CREATE INDEX idx_books_featured ON books(is_featured);
CREATE INDEX idx_books_search ON books USING GIN(search_vector);
CREATE INDEX idx_books_authors ON books USING GIN(authors);
CREATE INDEX idx_books_price ON books(selling_price);
CREATE INDEX idx_books_rating ON books(rating DESC);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_book_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.authors, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.publisher, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER books_search_vector_update
    BEFORE INSERT OR UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_book_search_vector();

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id        UUID, -- Will FK to orders
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(255),
    body            TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count   INTEGER DEFAULT 0,
    is_approved     BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_id, user_id, order_id)
);

CREATE INDEX idx_reviews_book ON reviews(book_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE wishlists (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);

-- ============================================================
-- CART
-- ============================================================
CREATE TABLE cart_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE coupons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value  NUMERIC(10,2) NOT NULL,
    min_order_value NUMERIC(10,2) DEFAULT 0,
    max_discount    NUMERIC(10,2),
    usage_limit     INTEGER,
    used_count      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    valid_from      TIMESTAMPTZ DEFAULT NOW(),
    valid_until     TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number    VARCHAR(30) UNIQUE NOT NULL,
    buyer_id        UUID NOT NULL REFERENCES users(id),
    shipping_address_id UUID REFERENCES addresses(id),
    shipping_address_snapshot JSONB NOT NULL,
    status          order_status DEFAULT 'pending',
    payment_status  payment_status DEFAULT 'pending',
    payment_method  payment_method,
    payment_reference VARCHAR(255),
    subtotal        NUMERIC(10,2) NOT NULL,
    shipping_charge NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    coupon_id       UUID REFERENCES coupons(id),
    coupon_code     VARCHAR(50),
    tax_amount      NUMERIC(10,2) DEFAULT 0,
    total_amount    NUMERIC(10,2) NOT NULL,
    notes           TEXT,
    tracking_number VARCHAR(100),
    shipped_at      TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Sequence for order numbers
CREATE SEQUENCE order_number_seq START 10000;

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL REFERENCES books(id),
    seller_id       UUID NOT NULL REFERENCES seller_profiles(id),
    quantity        INTEGER NOT NULL,
    unit_price      NUMERIC(10,2) NOT NULL,
    total_price     NUMERIC(10,2) NOT NULL,
    book_snapshot   JSONB NOT NULL,
    status          order_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
CREATE INDEX idx_order_items_book ON order_items(book_id);

-- FK for reviews
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_order
    FOREIGN KEY (order_id) REFERENCES orders(id);

-- ============================================================
-- SELLER PAYOUTS
-- ============================================================
CREATE TABLE seller_payouts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id       UUID NOT NULL REFERENCES seller_profiles(id),
    amount          NUMERIC(10,2) NOT NULL,
    platform_fee    NUMERIC(10,2) NOT NULL,
    net_amount      NUMERIC(10,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    reference       VARCHAR(255),
    period_from     DATE,
    period_to       DATE,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_seller ON seller_payouts(seller_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(50),
    link            TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_seller_updated BEFORE UPDATE ON seller_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_updated BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-UPDATE BOOK RATING ON REVIEW CHANGE
-- ============================================================
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE books SET
        rating = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id) AND is_approved = TRUE),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id) AND is_approved = TRUE)
    WHERE id = COALESCE(NEW.book_id, OLD.book_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_book_rating AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_book_rating();
