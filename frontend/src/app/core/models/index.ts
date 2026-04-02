// ── AUTH ──────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  first_name: string;
  last_name: string;
  avatar_url?: string;
  is_email_verified: boolean;
  seller_id?: string;
  seller_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  store_name?: string;
  store_slug?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'buyer' | 'seller';
}

// ── BOOKS ─────────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description?: string;
  isbn?: string;
  authors: string[];
  publisher?: string;
  publication_year?: number;
  edition?: string;
  language: string;
  pages?: number;
  cover_image_url?: string;
  additional_images?: string[];
  condition: 'new' | 'like_new' | 'good' | 'acceptable';
  mrp: number;
  selling_price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  tags?: string[];
  rating: number;
  rating_count: number;
  total_sold: number;
  category_name?: string;
  category_slug?: string;
  store_name?: string;
  store_slug?: string;
  reviews?: Review[];
  created_at: string;
}

export interface BookFilters {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  language?: string;
  condition?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  book_count?: number;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  body: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

// ── CART & ORDERS ─────────────────────────────────────────────
export interface CartItem {
  id: string;
  book_id: string;
  title: string;
  slug: string;
  authors: string[];
  cover_image_url?: string;
  selling_price: number;
  mrp: number;
  stock_quantity: number;
  quantity: number;
  store_name: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export interface Address {
  id: string;
  type: 'home' | 'office' | 'other';
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'|'refunded';
  payment_status: 'pending'|'paid'|'failed'|'refunded';
  payment_method: string;
  subtotal: number;
  shipping_charge: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  coupon_code?: string;
  tracking_number?: string;
  notes?: string;
  items: OrderItem[];
  shipping_address_snapshot: Address;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface OrderItem {
  id: string;
  book_id: string;
  title: string;
  cover?: string;
  authors?: string[];
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  store_name?: string;
}

// ── SELLER ────────────────────────────────────────────────────
export interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  store_description?: string;
  store_logo_url?: string;
  gst_number?: string;
  pan_number?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_holder_name?: string;
  status: 'pending'|'approved'|'rejected'|'suspended';
  rejection_reason?: string;
  total_sales: number;
  total_revenue: number;
  rating: number;
  rating_count: number;
  email?: string;
  first_name?: string;
  last_name?: string;
}

// ── PAGINATION ────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; pages: number; };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// ── COUPON ────────────────────────────────────────────────────
export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  valid_until?: string;
}
