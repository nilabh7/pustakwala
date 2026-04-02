import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  Book, BookFilters, Category, Cart, Address,
  Order, SellerProfile, Coupon, PaginatedResponse, ApiResponse
} from '../models';

const API = environment.apiUrl;

// ── BOOKS ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BookService {
  constructor(private http: HttpClient) {}

  getBooks(filters: BookFilters = {}): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null) params = params.set(k, String(v)); });
    return this.http.get<PaginatedResponse<Book>>(`${API}/books`, { params });
  }

  getBook(slug: string): Observable<ApiResponse<Book>> {
    return this.http.get<ApiResponse<Book>>(`${API}/books/${slug}`);
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${API}/categories`);
  }

  addReview(bookId: string, data: { rating: number; title?: string; body: string; order_id?: string }) {
    return this.http.post(`${API}/books/${bookId}/reviews`, data);
  }

  // Seller book management
  getMyBooks(params: any = {}): Observable<PaginatedResponse<Book>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<Book>>(`${API}/seller/books`, { params: p });
  }

  createBook(data: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.http.post<ApiResponse<Book>>(`${API}/seller/books`, data);
  }

  updateBook(id: string, data: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.http.put<ApiResponse<Book>>(`${API}/seller/books/${id}`, data);
  }

  deleteBook(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${API}/seller/books/${id}`);
  }
}

// ── CART ──────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CartService {
  constructor(private http: HttpClient) {}

  getCart(): Observable<ApiResponse<Cart>> {
    return this.http.get<ApiResponse<Cart>>(`${API}/cart`);
  }

  addToCart(book_id: string, quantity = 1) {
    return this.http.post(`${API}/cart`, { book_id, quantity });
  }

  updateItem(id: string, quantity: number) {
    return this.http.put(`${API}/cart/${id}`, { quantity });
  }

  removeItem(id: string) {
    return this.http.delete(`${API}/cart/${id}`);
  }

  clearCart() {
    return this.http.delete(`${API}/cart`);
  }

  getWishlist(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${API}/wishlist`);
  }

  toggleWishlist(book_id: string) {
    return this.http.post(`${API}/wishlist/toggle`, { book_id });
  }

  validateCoupon(code: string, order_value: number) {
    return this.http.post(`${API}/coupons/validate`, { code, order_value });
  }
}

// ── ADDRESS ───────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AddressService {
  constructor(private http: HttpClient) {}

  getAddresses(): Observable<ApiResponse<Address[]>> {
    return this.http.get<ApiResponse<Address[]>>(`${API}/addresses`);
  }

  addAddress(data: Partial<Address>): Observable<ApiResponse<Address>> {
    return this.http.post<ApiResponse<Address>>(`${API}/addresses`, data);
  }

  updateAddress(id: string, data: Partial<Address>) {
    return this.http.put(`${API}/addresses/${id}`, data);
  }

  deleteAddress(id: string) {
    return this.http.delete(`${API}/addresses/${id}`);
  }
}

// ── ORDERS ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  placeOrder(data: { address_id: string; payment_method: string; coupon_code?: string; notes?: string }): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${API}/orders`, data);
  }

  getMyOrders(params: any = {}): Observable<PaginatedResponse<Order>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<Order>>(`${API}/orders`, { params: p });
  }

  getOrder(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${API}/orders/${id}`);
  }

  cancelOrder(id: string, reason?: string) {
    return this.http.post(`${API}/orders/${id}/cancel`, { reason });
  }
}

// ── SELLER ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SellerService {
  constructor(private http: HttpClient) {}

  registerSeller(data: Partial<SellerProfile>): Observable<ApiResponse<SellerProfile>> {
    return this.http.post<ApiResponse<SellerProfile>>(`${API}/sellers/register`, data);
  }

  getMyProfile(): Observable<ApiResponse<SellerProfile>> {
    return this.http.get<ApiResponse<SellerProfile>>(`${API}/sellers/me`);
  }

  updateProfile(data: Partial<SellerProfile>) {
    return this.http.put(`${API}/sellers/me`, data);
  }

  getDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/sellers/dashboard`);
  }

  getMyOrders(params: any = {}): Observable<PaginatedResponse<any>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<any>>(`${API}/sellers/orders`, { params: p });
  }

  updateOrderStatus(orderId: string, status: string, tracking_number?: string) {
    return this.http.put(`${API}/sellers/orders/${orderId}/status`, { status, tracking_number });
  }
}

// ── ADMIN ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/admin/dashboard`);
  }

  // Sellers
  getSellers(params: any = {}): Observable<PaginatedResponse<SellerProfile>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<SellerProfile>>(`${API}/admin/sellers`, { params: p });
  }

  getSellerDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/admin/sellers/${id}`);
  }

  approveSeller(id: string) {
    return this.http.post(`${API}/admin/sellers/${id}/approve`, {});
  }

  rejectSeller(id: string, reason: string) {
    return this.http.post(`${API}/admin/sellers/${id}/reject`, { reason });
  }

  suspendSeller(id: string, reason?: string) {
    return this.http.post(`${API}/admin/sellers/${id}/suspend`, { reason });
  }

  // Users
  getUsers(params: any = {}): Observable<PaginatedResponse<any>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<any>>(`${API}/admin/users`, { params: p });
  }

  toggleUserStatus(id: string) {
    return this.http.put(`${API}/admin/users/${id}/toggle`, {});
  }

  // Orders
  getAllOrders(params: any = {}): Observable<PaginatedResponse<Order>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<Order>>(`${API}/admin/orders`, { params: p });
  }

  updateOrderStatus(id: string, status: string, tracking_number?: string) {
    return this.http.put(`${API}/admin/orders/${id}/status`, { status, tracking_number });
  }

  // Books
  getAllBooks(params: any = {}): Observable<PaginatedResponse<Book>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<Book>>(`${API}/admin/books`, { params: p });
  }

  toggleBookFeatured(id: string) {
    return this.http.put(`${API}/admin/books/${id}/feature`, {});
  }

  // Coupons
  getCoupons(): Observable<ApiResponse<Coupon[]>> {
    return this.http.get<ApiResponse<Coupon[]>>(`${API}/admin/coupons`);
  }

  createCoupon(data: Partial<Coupon>) {
    return this.http.post(`${API}/admin/coupons`, data);
  }

  toggleCoupon(id: string) {
    return this.http.put(`${API}/admin/coupons/${id}/toggle`, {});
  }

  // Categories
  createCategory(data: any) {
    return this.http.post(`${API}/admin/categories`, data);
  }

  updateCategory(id: string, data: any) {
    return this.http.put(`${API}/admin/categories/${id}`, data);
  }

  getAuditLogs(params: any = {}): Observable<PaginatedResponse<any>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) p = p.set(k, String(v)); });
    return this.http.get<PaginatedResponse<any>>(`${API}/admin/audit-logs`, { params: p });
  }

  sendNotification(data: { title: string; message: string; type?: string; target_role?: string }) {
    return this.http.post(`${API}/admin/notifications`, data);
  }
}

// ── USER ──────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  updateProfile(data: any) {
    return this.http.put(`${API}/users/me`, data);
  }

  getNotifications(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/users/notifications`);
  }

  markNotificationsRead() {
    return this.http.put(`${API}/users/notifications/read`, {});
  }
}
