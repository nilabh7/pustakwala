import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { SellerService, BookService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

// ── SELLER REGISTER ───────────────────────────────────────────
@Component({
  selector: 'app-seller-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="seller-page">
      <div class="seller-card">
        <div class="seller-header">
          <div class="sh-icon">📦</div>
          <h1>Start Selling on Pustakwala</h1>
          <p>Reach millions of book lovers across India</p>
        </div>
        <div class="features-row">
          <div class="sf" *ngFor="let f of sellerPerks">
            <span>{{ f.icon }}</span>{{ f.text }}
          </div>
        </div>
        <div class="error-msg" *ngIf="error">{{ error }}</div>
        <div class="success-msg" *ngIf="success">
          ✅ Application submitted! We'll review and notify you within 1–2 business days.
        </div>
        <form (ngSubmit)="onSubmit()" *ngIf="!success">
          <h3>Store Information</h3>
          <div class="form-group">
            <label>Store Name *</label>
            <input type="text" [(ngModel)]="form.store_name" name="store_name" placeholder="Sharma Book House" required>
          </div>
          <div class="form-group">
            <label>Store Description</label>
            <textarea [(ngModel)]="form.store_description" name="desc" rows="3" placeholder="Tell buyers about your store…" class="textarea"></textarea>
          </div>
          <h3>Legal & Tax</h3>
          <div class="form-row-2">
            <div class="form-group">
              <label>GST Number</label>
              <input type="text" [(ngModel)]="form.gst_number" name="gst" placeholder="22AAAAA0000A1Z5">
            </div>
            <div class="form-group">
              <label>PAN Number *</label>
              <input type="text" [(ngModel)]="form.pan_number" name="pan" placeholder="AAAAA0000A">
            </div>
          </div>
          <h3>Bank Account</h3>
          <div class="form-row-2">
            <div class="form-group">
              <label>Account Number *</label>
              <input type="text" [(ngModel)]="form.bank_account_number" name="acc" placeholder="XXXXXXXXXXXXXXX">
            </div>
            <div class="form-group">
              <label>IFSC Code *</label>
              <input type="text" [(ngModel)]="form.bank_ifsc" name="ifsc" placeholder="HDFC0000123">
            </div>
          </div>
          <div class="form-group">
            <label>Account Holder Name *</label>
            <input type="text" [(ngModel)]="form.bank_holder_name" name="holder" placeholder="Name as in bank records">
          </div>
          <button type="submit" class="submit-btn" [disabled]="loading">
            {{ loading ? 'Submitting…' : 'Submit Application' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .seller-page{max-width:640px;margin:0 auto;padding:40px 24px}
    .seller-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:16px;padding:36px}
    .seller-header{text-align:center;margin-bottom:24px}
    .sh-icon{font-size:48px;margin-bottom:12px}
    .seller-header h1{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin-bottom:6px}
    .seller-header p{font-size:15px;color:#7A6855}
    .features-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;padding:16px;background:#F5ECD7;border-radius:10px}
    .sf{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500}
    .sf span{font-size:16px}
    .error-msg{background:#FFF0F0;color:#C0392B;border:1px solid #FFCDD2;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px}
    .success-msg{background:#E8F5E9;color:#276749;border:1px solid #9AE6B4;border-radius:8px;padding:14px;font-size:14px}
    h3{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin:20px 0 14px;color:#7A1E2E}
    .form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .form-group{margin-bottom:14px}
    .form-group label{display:block;font-size:12px;font-weight:600;color:#1A0F00;margin-bottom:4px}
    .form-group input,.textarea{width:100%;padding:10px 12px;border:1.5px solid #E2D5BE;border-radius:7px;font-size:13px;background:#fff;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box}
    .form-group input:focus,.textarea:focus{border-color:#E8580A}
    .textarea{resize:vertical}
    .submit-btn{width:100%;padding:14px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px;transition:.2s}
    .submit-btn:hover:not(:disabled){background:#7A1E2E}
    .submit-btn:disabled{opacity:.6;cursor:not-allowed}
  `]
})
export class SellerRegisterComponent {
  sellerSvc = inject(SellerService);
  form: any = {};
  loading = false; error = ''; success = false;
  sellerPerks = [
    { icon:'💰', text:'Low 5% commission' },
    { icon:'🚀', text:'Easy listing tools' },
    { icon:'💳', text:'Weekly payouts' },
    { icon:'📊', text:'Sales analytics' },
  ];
  onSubmit() {
    this.loading = true; this.error = '';
    this.sellerSvc.registerSeller(this.form).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Registration failed'; this.loading = false; }
    });
  }
}

// ── SELLER DASHBOARD ─────────────────────────────────────────
@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dash-wrap">
      <div class="dash-header">
        <h1>Seller Dashboard</h1>
        <div class="dash-actions">
          <a routerLink="/seller/books/new" class="btn-primary">+ List New Book</a>
        </div>
      </div>

      <!-- PENDING BANNER -->
      <div class="pending-banner" *ngIf="profile?.status==='pending'">
        ⏳ Your seller account is under review. You'll be notified once approved (1–2 business days).
      </div>
      <div class="rejected-banner" *ngIf="profile?.status==='rejected'">
        ❌ Your application was rejected. Reason: {{ profile?.rejection_reason }}
      </div>

      <!-- STATS -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card">
          <div class="sc-icon">₹</div>
          <div class="sc-val">₹{{ stats.revenue?.total_revenue | number:'1.0-0' }}</div>
          <div class="sc-lbl">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="sc-icon">📦</div>
          <div class="sc-val">{{ stats.revenue?.total_orders }}</div>
          <div class="sc-lbl">Total Orders</div>
        </div>
        <div class="stat-card">
          <div class="sc-icon">📚</div>
          <div class="sc-val">{{ stats.bookStats?.active }}</div>
          <div class="sc-lbl">Active Books</div>
        </div>
        <div class="stat-card">
          <div class="sc-icon">⏰</div>
          <div class="sc-val">{{ stats.pendingOrders }}</div>
          <div class="sc-lbl">Pending Orders</div>
        </div>
      </div>

      <!-- RECENT ORDERS -->
      <div class="dash-section">
        <div class="ds-header">
          <h2>Recent Orders</h2>
          <a routerLink="/seller/orders" class="see-all">See all →</a>
        </div>
        <div class="orders-table" *ngIf="stats?.recentOrders?.length; else noOrders">
          <table>
            <thead><tr>
              <th>Order #</th><th>Customer</th><th>Books</th><th>Amount</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let o of stats.recentOrders">
                <td><strong>{{ o.order_number }}</strong></td>
                <td>{{ o.first_name }} {{ o.last_name }}</td>
                <td><span class="books-tag">{{ o.book_titles?.join(', ') | slice:0:40 }}{{ o.book_titles?.join(', ').length>40?'…':'' }}</span></td>
                <td>₹{{ o.total_amount | number:'1.0-0' }}</td>
                <td><span class="status-badge st-{{o.status}}">{{ o.status }}</span></td>
                <td>{{ o.created_at | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noOrders>
          <div class="empty-row">No orders yet. <a routerLink="/seller/books/new">List your first book</a> to get started!</div>
        </ng-template>
      </div>

      <!-- QUICK LINKS -->
      <div class="quick-links">
        <a routerLink="/seller/books" class="ql-card">
          <span>📚</span><strong>My Books</strong><span>{{ stats?.bookStats?.total }} listed</span>
        </a>
        <a routerLink="/seller/orders" class="ql-card">
          <span>📦</span><strong>All Orders</strong><span>Manage & ship</span>
        </a>
        <a routerLink="/seller/profile" class="ql-card">
          <span>🏪</span><strong>Store Profile</strong><span>Edit details</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dash-wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    .dash-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px}
    .dash-header h1{font-family:'Playfair Display',serif;font-size:28px;font-weight:700}
    .btn-primary{padding:11px 22px;background:#E8580A;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;transition:.2s}
    .btn-primary:hover{background:#7A1E2E}
    .pending-banner{background:#FFF3CD;border:1px solid #FFEEBA;color:#856404;padding:14px 18px;border-radius:10px;margin-bottom:24px;font-size:14px}
    .rejected-banner{background:#F8D7DA;border:1px solid #F5C6CB;color:#721C24;padding:14px 18px;border-radius:10px;margin-bottom:24px;font-size:14px}
    .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
    .stat-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:20px;text-align:center;transition:.2s}
    .stat-card:hover{border-color:#E8580A;box-shadow:0 4px 12px rgba(232,88,10,.1)}
    .sc-icon{font-size:24px;margin-bottom:8px;color:#E8580A;font-weight:900}
    .sc-val{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#1A0F00;margin-bottom:4px}
    .sc-lbl{font-size:12px;color:#7A6855;font-weight:600}
    .dash-section{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:22px;margin-bottom:24px}
    .ds-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
    .ds-header h2{font-family:'Playfair Display',serif;font-size:18px;font-weight:700}
    .see-all{font-size:13px;color:#E8580A;font-weight:600;text-decoration:none}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:8px 10px;border-bottom:2px solid #E2D5BE;font-size:12px;font-weight:700;color:#7A6855;text-transform:uppercase;letter-spacing:.5px}
    td{padding:10px 10px;border-bottom:1px solid #E2D5BE;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    .books-tag{color:#7A6855}
    .status-badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:capitalize}
    .st-confirmed,.st-processing{background:#FFF3CD;color:#856404}
    .st-shipped{background:#CCE5FF;color:#004085}
    .st-delivered{background:#D4EDDA;color:#155724}
    .st-cancelled{background:#F8D7DA;color:#721C24}
    .st-pending{background:#E2E3E5;color:#383D41}
    .empty-row{padding:20px;color:#7A6855;font-size:14px}
    .empty-row a{color:#E8580A;font-weight:600;text-decoration:none}
    .quick-links{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .ql-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:20px;text-decoration:none;color:#1A0F00;display:flex;flex-direction:column;gap:4px;transition:.2s}
    .ql-card:hover{border-color:#E8580A;box-shadow:0 4px 12px rgba(232,88,10,.1)}
    .ql-card span:first-child{font-size:28px}
    .ql-card strong{font-size:15px;font-weight:700}
    .ql-card span:last-child{font-size:12px;color:#7A6855}
    @media(max-width:768px){.stats-row,.quick-links{grid-template-columns:1fr 1fr}}
  `]
})
export class SellerDashboardComponent implements OnInit {
  sellerSvc = inject(SellerService);
  profile: any = null; stats: any = null;
  ngOnInit() {
    this.sellerSvc.getMyProfile().subscribe(r => this.profile = r.data);
    this.sellerSvc.getDashboard().subscribe(r => this.stats = r.data);
  }
}

// ── SELLER BOOKS ──────────────────────────────────────────────
@Component({
  selector: 'app-seller-books',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="ph">
        <h1>📚 My Books</h1>
        <a routerLink="/seller/books/new" class="btn-primary">+ List New Book</a>
      </div>
      <div class="toolbar">
        <input type="text" [(ngModel)]="search" (input)="onSearch()" placeholder="Search by title…" class="search-input">
      </div>
      <div class="books-table" *ngIf="books.length; else empty">
        <table>
          <thead><tr>
            <th>Book</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Rating</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let b of books">
              <td>
                <div class="bt-title">{{ b.title }}</div>
                <div class="bt-author">{{ b.authors?.join(', ') }}</div>
              </td>
              <td>{{ b.category_name || '—' }}</td>
              <td>
                <div class="price-main">₹{{ b.selling_price | number:'1.0-0' }}</div>
                <div class="price-mrp" *ngIf="b.mrp>b.selling_price">₹{{ b.mrp | number:'1.0-0' }}</div>
              </td>
              <td [class.low-stock]="b.stock_quantity<5">{{ b.stock_quantity }}</td>
              <td>{{ b.total_sold }}</td>
              <td>{{ b.rating | number:'1.1-1' }} ({{ b.rating_count }})</td>
              <td><span class="st-badge" [class.active]="b.is_active" [class.inactive]="!b.is_active">{{ b.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <a [routerLink]="['/seller/books', b.id, 'edit']" class="action-btn edit">Edit</a>
                <button class="action-btn del" (click)="deleteBook(b)">{{ b.is_active ? 'Delist' : 'Delist' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination" *ngIf="totalPages>1">
          <button [disabled]="page===1" (click)="goPage(page-1)">‹</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button [disabled]="page===totalPages" (click)="goPage(page+1)">›</button>
        </div>
      </div>
      <ng-template #empty>
        <div class="empty-state">
          <p>No books listed yet.</p>
          <a routerLink="/seller/books/new" class="btn-primary">List Your First Book</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
    .ph h1{font-family:'Playfair Display',serif;font-size:26px;font-weight:700}
    .btn-primary{padding:10px 20px;background:#E8580A;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700}
    .toolbar{margin-bottom:16px}
    .search-input{padding:9px 14px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;outline:none;width:280px;font-family:inherit}
    .search-input:focus{border-color:#E8580A}
    .books-table{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:10px 14px;background:#F5ECD7;border-bottom:2px solid #E2D5BE;font-size:12px;font-weight:700;color:#7A6855;text-transform:uppercase}
    td{padding:12px 14px;border-bottom:1px solid #E2D5BE;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    .bt-title{font-weight:700;font-size:13px;margin-bottom:2px}
    .bt-author{font-size:11px;color:#7A6855}
    .price-main{font-weight:700;color:#7A1E2E;font-size:14px}
    .price-mrp{font-size:11px;color:#7A6855;text-decoration:line-through}
    .low-stock{color:#C0392B;font-weight:700}
    .st-badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
    .st-badge.active{background:#D4EDDA;color:#155724}
    .st-badge.inactive{background:#F8D7DA;color:#721C24}
    .action-btn{padding:5px 12px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;border:none;font-family:inherit;margin-right:4px;transition:.2s}
    .edit{background:#E8F4FD;color:#004085;border:1px solid #BEE3FF}
    .edit:hover{background:#BEE3FF}
    .del{background:#F8D7DA;color:#721C24;border:1px solid #F5C6CB}
    .del:hover{background:#F5C6CB}
    .pagination{display:flex;align-items:center;gap:12px;justify-content:center;padding:16px;font-size:14px}
    .pagination button{padding:6px 12px;border:1.5px solid #E2D5BE;border-radius:6px;background:#FFFBF4;cursor:pointer;font-size:14px}
    .pagination button:disabled{opacity:.4;cursor:not-allowed}
    .empty-state{text-align:center;padding:60px 20px;background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px}
    .empty-state p{color:#7A6855;margin-bottom:16px}
  `]
})
export class SellerBooksComponent implements OnInit {
  bookSvc = inject(BookService);
  books: any[] = []; search = ''; page = 1; totalPages = 1; searchTimer: any;
  ngOnInit() { this.loadBooks(); }
  loadBooks() {
    this.bookSvc.getMyBooks({ search: this.search, page: this.page }).subscribe(r => {
      this.books = r.data || [];
      this.totalPages = r.pagination?.pages || 1;
    });
  }
  onSearch() { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => { this.page=1; this.loadBooks(); }, 400); }
  goPage(p: number) { this.page=p; this.loadBooks(); }
  deleteBook(b: any) {
    if (!confirm(`Delist "${b.title}"?`)) return;
    this.bookSvc.deleteBook(b.id).subscribe(() => this.loadBooks());
  }
}

// ── SELLER ORDERS ─────────────────────────────────────────────
@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <h1>📦 My Orders</h1>
      <div class="filter-row">
        <select [(ngModel)]="statusFilter" (change)="loadOrders()" class="sel">
          <option value="">All Status</option>
          <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
        </select>
      </div>
      <div class="orders-table" *ngIf="orders.length">
        <table>
          <thead><tr>
            <th>Order #</th><th>Date</th><th>Book</th><th>Customer</th><th>Qty</th><th>Amount</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td><strong>{{ o.order_number }}</strong></td>
              <td>{{ o.created_at | date:'mediumDate' }}</td>
              <td><div class="bt-title">{{ o.title }}</div></td>
              <td>{{ o.first_name }} {{ o.last_name }}</td>
              <td>{{ o.quantity }}</td>
              <td>₹{{ o.total_price | number:'1.0-0' }}</td>
              <td><span class="status-badge st-{{o.status}}">{{ o.status }}</span></td>
              <td>
                <select class="action-sel" [(ngModel)]="o._newStatus" (change)="updateStatus(o)">
                  <option value="">Update…</option>
                  <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="empty-row" *ngIf="!orders.length">No orders found.</div>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    h1{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin-bottom:20px}
    .filter-row{margin-bottom:16px}
    .sel{padding:8px 12px;border:1.5px solid #E2D5BE;border-radius:7px;font-size:13px;background:#FFFBF4;outline:none;font-family:inherit}
    .orders-table{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:10px 14px;background:#F5ECD7;border-bottom:2px solid #E2D5BE;font-size:12px;font-weight:700;color:#7A6855;text-transform:uppercase}
    td{padding:11px 14px;border-bottom:1px solid #E2D5BE;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    .bt-title{font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .status-badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
    .st-confirmed,.st-processing{background:#FFF3CD;color:#856404}
    .st-shipped{background:#CCE5FF;color:#004085}
    .st-delivered{background:#D4EDDA;color:#155724}
    .st-cancelled{background:#F8D7DA;color:#721C24}
    .st-pending{background:#E2E3E5;color:#383D41}
    .action-sel{padding:5px 8px;border:1.5px solid #E2D5BE;border-radius:6px;font-size:12px;font-family:inherit;background:#F5ECD7;outline:none;cursor:pointer}
    .empty-row{padding:40px;text-align:center;color:#7A6855;background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px}
  `]
})
export class SellerOrdersComponent implements OnInit {
  sellerSvc = inject(SellerService);
  orders: any[] = []; statusFilter = '';
  statuses = ['confirmed','processing','shipped','delivered','cancelled'];
  ngOnInit() { this.loadOrders(); }
  loadOrders() {
    const p: any = {}; if (this.statusFilter) p.status = this.statusFilter;
    this.sellerSvc.getMyOrders(p).subscribe(r => this.orders = r.data || []);
  }
  updateStatus(o: any) {
    if (!o._newStatus) return;
    this.sellerSvc.updateOrderStatus(o.id, o._newStatus).subscribe(() => { o.status = o._newStatus; o._newStatus=''; });
  }
}

// ── SELLER PROFILE ────────────────────────────────────────────
@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <h1>🏪 Store Profile</h1>
      <div class="profile-form" *ngIf="form">
        <div class="success-msg" *ngIf="saved">✅ Profile updated!</div>
        <div class="form-group"><label>Store Name</label>
          <input type="text" [(ngModel)]="form.store_name" name="sn"></div>
        <div class="form-group"><label>Description</label>
          <textarea [(ngModel)]="form.store_description" rows="4" class="ta"></textarea></div>
        <div class="form-row-2">
          <div class="form-group"><label>GST Number</label>
            <input type="text" [(ngModel)]="form.gst_number"></div>
          <div class="form-group"><label>PAN Number</label>
            <input type="text" [(ngModel)]="form.pan_number"></div>
        </div>
        <div class="status-row">
          Status: <span class="st-pill" [class]="'stp-'+form.status">{{ form.status | titlecase }}</span>
          <span class="rr" *ngIf="form.rejection_reason"> — {{ form.rejection_reason }}</span>
        </div>
        <button class="save-btn" (click)="save()">Save Changes</button>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:700px;margin:0 auto;padding:32px 24px}
    h1{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin-bottom:24px}
    .profile-form{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:28px}
    .success-msg{background:#E8F5E9;color:#276749;border:1px solid #9AE6B4;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px}
    .form-group{margin-bottom:16px}
    .form-group label{display:block;font-size:12px;font-weight:600;color:#1A0F00;margin-bottom:4px}
    .form-group input,.ta{width:100%;padding:10px 12px;border:1.5px solid #E2D5BE;border-radius:7px;font-size:13px;background:#fff;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box}
    .form-group input:focus,.ta:focus{border-color:#E8580A}
    .ta{resize:vertical}
    .form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .status-row{font-size:14px;margin-bottom:16px;display:flex;align-items:center;gap:8px}
    .st-pill{padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700}
    .stp-approved{background:#D4EDDA;color:#155724}
    .stp-pending{background:#FFF3CD;color:#856404}
    .stp-rejected{background:#F8D7DA;color:#721C24}
    .rr{color:#721C24;font-size:13px}
    .save-btn{padding:11px 28px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .save-btn:hover{background:#7A1E2E}
  `]
})
export class SellerProfileComponent implements OnInit {
  sellerSvc = inject(SellerService);
  form: any = null; saved = false;
  ngOnInit() { this.sellerSvc.getMyProfile().subscribe(r => this.form = { ...r.data }); }
  save() {
    this.sellerSvc.updateProfile(this.form).subscribe(() => { this.saved=true; setTimeout(()=>this.saved=false,3000); });
  }
}

// ── BOOK FORM (create / edit) ─────────────────────────────────
@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrap">
      <a routerLink="/seller/books" class="back-link">← Back to Books</a>
      <h1>{{ isEdit ? 'Edit Book' : '+ List New Book' }}</h1>
      <div class="success-msg" *ngIf="saved">✅ Book {{ isEdit ? 'updated' : 'listed' }} successfully!</div>
      <div class="error-msg" *ngIf="error">{{ error }}</div>
      <form class="book-form" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <h3>Basic Information</h3>
          <div class="form-group fg-wide">
            <label>Title *</label>
            <input type="text" [(ngModel)]="form.title" name="title" required placeholder="Enter book title">
          </div>
          <div class="form-group fg-wide">
            <label>Subtitle</label>
            <input type="text" [(ngModel)]="form.subtitle" name="subtitle" placeholder="Optional subtitle">
          </div>
          <div class="form-group fg-wide">
            <label>Authors * (comma separated)</label>
            <input type="text" [(ngModel)]="authorsStr" name="authors" required placeholder="Author One, Author Two">
          </div>
          <div class="form-group">
            <label>Publisher</label>
            <input type="text" [(ngModel)]="form.publisher" name="publisher">
          </div>
          <div class="form-group">
            <label>Publication Year</label>
            <input type="number" [(ngModel)]="form.publication_year" name="year" min="1800" [max]="currentYear">
          </div>
          <div class="form-group">
            <label>Edition</label>
            <input type="text" [(ngModel)]="form.edition" name="edition" placeholder="3rd Edition">
          </div>
          <div class="form-group">
            <label>Language</label>
            <select [(ngModel)]="form.language" name="language" class="sel">
              <option *ngFor="let l of languages" [value]="l">{{ l }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Condition</label>
            <select [(ngModel)]="form.condition" name="condition" class="sel">
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="acceptable">Acceptable</option>
            </select>
          </div>
          <div class="form-group">
            <label>Pages</label>
            <input type="number" [(ngModel)]="form.pages" name="pages" min="1">
          </div>
          <div class="form-group">
            <label>ISBN</label>
            <input type="text" [(ngModel)]="form.isbn" name="isbn" placeholder="ISBN-10">
          </div>
          <div class="form-group">
            <label>ISBN-13</label>
            <input type="text" [(ngModel)]="form.isbn13" name="isbn13" placeholder="ISBN-13">
          </div>
          <div class="form-group">
            <label>Category</label>
            <select [(ngModel)]="form.category_id" name="cat" class="sel">
              <option value="">Select category</option>
              <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>
        <div class="form-section">
          <h3>Description & Images</h3>
          <div class="form-group fg-wide">
            <label>Description</label>
            <textarea [(ngModel)]="form.description" name="desc" rows="5" class="ta" placeholder="Describe the book…"></textarea>
          </div>
          <div class="form-group fg-wide">
            <label>Cover Image URL</label>
            <input type="url" [(ngModel)]="form.cover_image_url" name="cover" placeholder="https://…">
          </div>
          <div class="form-group fg-wide">
            <label>Tags (comma separated)</label>
            <input type="text" [(ngModel)]="tagsStr" name="tags" placeholder="fiction, bestseller, award-winner">
          </div>
        </div>
        <div class="form-section">
          <h3>Pricing & Inventory *</h3>
          <div class="form-group">
            <label>MRP (₹) *</label>
            <input type="number" [(ngModel)]="form.mrp" name="mrp" required min="1" step="0.01">
          </div>
          <div class="form-group">
            <label>Selling Price (₹) *</label>
            <input type="number" [(ngModel)]="form.selling_price" name="sp" required min="1" step="0.01">
          </div>
          <div class="form-group">
            <label>Stock Quantity *</label>
            <input type="number" [(ngModel)]="form.stock_quantity" name="qty" required min="0">
          </div>
          <div class="form-group">
            <label>Weight (grams)</label>
            <input type="number" [(ngModel)]="form.weight_grams" name="wt" min="1">
          </div>
        </div>
        <div class="form-actions">
          <a routerLink="/seller/books" class="cancel-btn">Cancel</a>
          <button type="submit" class="submit-btn" [disabled]="loading">
            {{ loading ? 'Saving…' : (isEdit ? 'Update Book' : 'List Book') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:900px;margin:0 auto;padding:32px 24px}
    .back-link{font-size:13px;color:#E8580A;text-decoration:none;display:block;margin-bottom:12px}
    h1{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin-bottom:20px}
    .success-msg{background:#E8F5E9;color:#276749;border:1px solid #9AE6B4;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px}
    .error-msg{background:#FFF0F0;color:#C0392B;border:1px solid #FFCDD2;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px}
    .book-form{display:flex;flex-direction:column;gap:24px}
    .form-section{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .form-section h3{grid-column:1/-1;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin-bottom:4px;color:#7A1E2E}
    .form-group{display:flex;flex-direction:column;gap:4px}
    .fg-wide{grid-column:1/-1}
    .form-group label{font-size:12px;font-weight:600;color:#1A0F00}
    .form-group input,.ta,.sel{padding:9px 12px;border:1.5px solid #E2D5BE;border-radius:7px;font-size:13px;background:#fff;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box;width:100%}
    .form-group input:focus,.ta:focus,.sel:focus{border-color:#E8580A}
    .ta{resize:vertical}
    .form-actions{display:flex;justify-content:flex-end;gap:12px}
    .cancel-btn{padding:12px 24px;background:transparent;border:1.5px solid #E2D5BE;color:#7A6855;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600}
    .submit-btn{padding:12px 32px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:.2s}
    .submit-btn:hover:not(:disabled){background:#7A1E2E}
    .submit-btn:disabled{opacity:.6;cursor:not-allowed}
    @media(max-width:600px){.form-section{grid-template-columns:1fr}}
  `]
})
export class BookFormComponent implements OnInit {
  bookSvc    = inject(BookService);
  route      = inject(ActivatedRoute);
  router     = inject(Router);

  form: any = { language: 'English', condition: 'new', stock_quantity: 0 };
  categories: any[] = [];
  authorsStr = ''; tagsStr = '';
  isEdit = false; bookId = '';
  loading = false; saved = false; error = '';
  currentYear = new Date().getFullYear();
  languages = ['English','Hindi','Bengali','Tamil','Telugu','Marathi','Gujarati','Kannada','Malayalam','Punjabi','Sanskrit','Urdu','Other'];

  ngOnInit() {
    this.bookSvc.getCategories().subscribe(r => this.categories = r.data || []);
    this.bookId = this.route.snapshot.params['id'] || '';
    this.isEdit = !!this.bookId;
    if (this.isEdit) {
      // Load existing book by id — in real app would use id, here using a placeholder
    }
  }

  onSubmit() {
    this.loading = true; this.error = '';
    this.form.authors = this.authorsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    this.form.tags = this.tagsStr ? this.tagsStr.split(',').map((s: string) => s.trim()) : [];
    const req = this.isEdit
      ? this.bookSvc.updateBook(this.bookId, this.form)
      : this.bookSvc.createBook(this.form);
    req.subscribe({
      next: () => { this.saved=true; this.loading=false; setTimeout(()=>this.router.navigate(['/seller/books']),1500); },
      error: err => { this.error=err.error?.message||'Failed to save book'; this.loading=false; }
    });
  }
}
