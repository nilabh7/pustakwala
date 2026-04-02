import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, BookService } from '../../core/services/api.service';

// ── SHARED ADMIN SIDEBAR ─────────────────────────────────────
const ADMIN_IMPORTS = [CommonModule, RouterLink, FormsModule];

// ── SELLER DETAIL ─────────────────────────────────────────────
@Component({
  selector: 'app-admin-seller-detail',
  standalone: true, imports: ADMIN_IMPORTS,
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers" routerLinkActive="active" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar">
          <div>
            <a routerLink="/admin/sellers" class="back-link">← Back to Sellers</a>
            <h1 class="page-title">Seller Detail</h1>
          </div>
        </div>
        <div class="loading-state" *ngIf="loading()">Loading…</div>
        <ng-container *ngIf="!loading() && seller()">
          <div class="detail-header">
            <div class="detail-store">
              <div class="ds-name">{{ seller().store_name }}</div>
              <div class="ds-slug">{{ seller().store_slug }}</div>
              <span class="status-pill" [class]="'ss-'+seller().status">{{ seller().status }}</span>
            </div>
            <div class="detail-actions" *ngIf="seller().status === 'pending'">
              <button (click)="approve()" class="btn-approve">✅ Approve Seller</button>
              <button (click)="openReject()" class="btn-reject">❌ Reject</button>
            </div>
            <div *ngIf="seller().status === 'approved'">
              <button (click)="suspend()" class="btn-reject">🚫 Suspend</button>
            </div>
          </div>

          <div class="detail-grid">
            <div class="panel">
              <h3 class="panel-title">Owner Information</h3>
              <div class="info-row"><span>Name</span><strong>{{ seller().first_name }} {{ seller().last_name }}</strong></div>
              <div class="info-row"><span>Email</span><strong>{{ seller().email }}</strong></div>
              <div class="info-row"><span>Phone</span><strong>{{ seller().phone || '—' }}</strong></div>
              <div class="info-row"><span>Joined</span><strong>{{ seller().user_created | date:'dd MMM yyyy' }}</strong></div>
            </div>
            <div class="panel">
              <h3 class="panel-title">Business Information</h3>
              <div class="info-row"><span>GST Number</span><strong>{{ seller().gst_number || '—' }}</strong></div>
              <div class="info-row"><span>PAN Number</span><strong>{{ seller().pan_number || '—' }}</strong></div>
              <div class="info-row"><span>Bank IFSC</span><strong>{{ seller().bank_ifsc || '—' }}</strong></div>
              <div class="info-row"><span>A/C Holder</span><strong>{{ seller().bank_holder_name || '—' }}</strong></div>
            </div>
            <div class="panel">
              <h3 class="panel-title">Sales Performance</h3>
              <div class="info-row"><span>Total Revenue</span><strong class="orange">₹{{ seller().total_revenue | number:'1.0-0' }}</strong></div>
              <div class="info-row"><span>Total Sales</span><strong>{{ seller().total_sales }}</strong></div>
              <div class="info-row"><span>Rating</span><strong>⭐ {{ seller().rating || 0 }}</strong></div>
              <div class="info-row"><span>Books Listed</span><strong>{{ seller().bookStats?.active || 0 }} active</strong></div>
            </div>
            <div class="panel" *ngIf="seller().store_description">
              <h3 class="panel-title">Store Description</h3>
              <p class="store-desc">{{ seller().store_description }}</p>
            </div>
          </div>

          <div class="panel" *ngIf="seller().rejection_reason">
            <h3 class="panel-title">Rejection / Suspension Reason</h3>
            <p class="rejection-reason">{{ seller().rejection_reason }}</p>
          </div>
        </ng-container>

        <!-- REJECT MODAL -->
        <div class="modal-overlay" *ngIf="showReject" (click)="showReject=false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Reject Seller Application</h3>
            <div class="form-group">
              <label>Reason *</label>
              <textarea [(ngModel)]="rejectReason" rows="4" placeholder="Explain why…"></textarea>
            </div>
            <div class="modal-actions">
              <button (click)="showReject=false" class="btn-cancel">Cancel</button>
              <button (click)="confirmReject()" class="btn-confirm-reject" [disabled]="!rejectReason.trim()">Confirm Rejection</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout{display:flex;min-height:100vh}
    .sidebar{width:240px;background:#1A0F00;color:#fff;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
    .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1)}
    .sl-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#C99A2E}
    .sl-role{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
    .sidebar-nav{padding:12px 0}
    .snav-item{display:flex;align-items:center;gap:8px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:.15s}
    .snav-item:hover,.snav-item.active{background:rgba(255,255,255,.08);color:#fff}
    .snav-item.active{border-right:3px solid #E8580A;color:#E8580A}
    .admin-main{flex:1;background:#F5ECD7;padding:28px;min-width:0}
    .admin-topbar{margin-bottom:24px}
    .back-link{font-size:13px;color:#E8580A;text-decoration:none;display:block;margin-bottom:8px}
    .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700}
    .loading-state{color:#7A6855;padding:40px;text-align:center}
    .detail-header{display:flex;justify-content:space-between;align-items:flex-start;
      background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px;margin-bottom:20px}
    .ds-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:4px}
    .ds-slug{font-size:13px;color:#7A6855;font-family:monospace;margin-bottom:10px}
    .detail-actions{display:flex;gap:10px}
    .btn-approve{padding:10px 20px;background:#2D6A4F;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .btn-reject{padding:10px 20px;background:#FFEBEE;color:#C62828;border:1px solid #FFCDD2;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:20px;margin-bottom:16px}
    .panel-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin-bottom:14px}
    .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0E8D8;font-size:14px}
    .info-row:last-child{border-bottom:none}
    .info-row span{color:#7A6855}
    .orange{color:#E8580A}
    .store-desc,.rejection-reason{font-size:14px;color:#7A6855;line-height:1.6}
    .rejection-reason{background:#FFEBEE;padding:12px;border-radius:8px;color:#C62828}
    .status-pill{padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;text-transform:uppercase}
    .ss-pending{background:#FFF3E0;color:#E65100}
    .ss-approved{background:#E8F5E9;color:#2E7D32}
    .ss-rejected{background:#FFEBEE;color:#C62828}
    .ss-suspended{background:#F3E5F5;color:#6A1B9A}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center}
    .modal{background:#FDF6EC;border-radius:12px;padding:32px;width:480px;max-width:90vw}
    .modal h3{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:16px}
    .form-group{margin-bottom:20px}
    .form-group label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
    .form-group textarea{width:100%;padding:11px 14px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#F5ECD7;outline:none;font-family:inherit;resize:vertical;box-sizing:border-box}
    .modal-actions{display:flex;gap:10px;justify-content:flex-end}
    .btn-cancel{padding:10px 20px;border:1.5px solid #E2D5BE;border-radius:8px;background:#F5ECD7;cursor:pointer;font-size:14px;font-family:inherit}
    .btn-confirm-reject{padding:10px 20px;background:#C62828;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .btn-confirm-reject:disabled{opacity:.4;cursor:not-allowed}
  `]
})
export class AdminSellerDetailComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  seller  = signal<any>(null);
  loading = signal(true);
  showReject = false; rejectReason = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.adminSvc.getSellerDetail(id).subscribe(r => { this.seller.set(r.data); this.loading.set(false); });
  }

  approve() {
    this.adminSvc.approveSeller(this.seller().id).subscribe(() => {
      this.seller.update(s => ({ ...s, status: 'approved' }));
    });
  }
  openReject()   { this.showReject = true; this.rejectReason = ''; }
  confirmReject() {
    this.adminSvc.rejectSeller(this.seller().id, this.rejectReason).subscribe(() => {
      this.seller.update(s => ({ ...s, status: 'rejected', rejection_reason: this.rejectReason }));
      this.showReject = false;
    });
  }
  suspend() {
    if (confirm('Suspend this seller?')) {
      this.adminSvc.suspendSeller(this.seller().id).subscribe(() =>
        this.seller.update(s => ({ ...s, status: 'suspended' }))
      );
    }
  }
}

// ── USERS ─────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-users',
  standalone: true, imports: ADMIN_IMPORTS,
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users" routerLinkActive="active" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar"><h1 class="page-title">User Management</h1></div>
        <div class="filters-bar">
          <select [(ngModel)]="roleFilter" (ngModelChange)="load()" class="filter-sel">
            <option value="">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
          <input class="search-input" [(ngModel)]="search" (input)="load()" placeholder="Search by name or email…">
        </div>
        <div class="panel">
          <div class="loading-state" *ngIf="loading()">Loading…</div>
          <table class="data-table" *ngIf="!loading()">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Verified</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let u of users()">
                <td>{{ u.first_name }} {{ u.last_name }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.phone || '—' }}</td>
                <td><span class="role-pill role-{{ u.role }}">{{ u.role }}</span></td>
                <td>{{ u.is_email_verified ? '✅' : '❌' }}</td>
                <td><span [class]="u.is_active ? 'status-active' : 'status-inactive'">{{ u.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td>{{ u.created_at | date:'dd MMM yy' }}</td>
                <td>
                  <button (click)="toggle(u)" class="btn-sm" [class]="u.is_active ? 'btn-deactivate' : 'btn-activate'">
                    {{ u.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!users().length"><td colspan="8" class="empty-row">No users found</td></tr>
            </tbody>
          </table>
          <div class="pagination" *ngIf="totalPages() > 1">
            <button (click)="prev()" [disabled]="page===1">← Prev</button>
            <span>Page {{ page }} of {{ totalPages() }}</span>
            <button (click)="next()" [disabled]="page>=totalPages()">Next →</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout{display:flex;min-height:100vh}
    .sidebar{width:240px;background:#1A0F00;color:#fff;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
    .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1)}
    .sl-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#C99A2E}
    .sl-role{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
    .sidebar-nav{padding:12px 0}
    .snav-item{display:flex;align-items:center;gap:8px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:.15s}
    .snav-item:hover,.snav-item.active{background:rgba(255,255,255,.08);color:#fff}
    .snav-item.active{border-right:3px solid #E8580A;color:#E8580A}
    .admin-main{flex:1;background:#F5ECD7;padding:28px;min-width:0}
    .admin-topbar{margin-bottom:24px}
    .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700}
    .loading-state{color:#7A6855;padding:40px;text-align:center}
    .filters-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
    .filter-sel{padding:8px 14px;border:1.5px solid #E2D5BE;border-radius:8px;background:#FFFBF4;font-size:14px;outline:none;font-family:inherit}
    .search-input{padding:8px 14px;border:1.5px solid #E2D5BE;border-radius:8px;background:#FFFBF4;font-size:14px;outline:none;font-family:inherit;min-width:240px}
    .search-input:focus{border-color:#E8580A}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:13px}
    .data-table th{text-align:left;padding:10px 14px;background:#F5ECD7;font-size:12px;font-weight:600;color:#7A6855;text-transform:uppercase;letter-spacing:.5px}
    .data-table td{padding:10px 14px;border-bottom:1px solid #F0E8D8;vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none}
    .data-table tr:hover td{background:#FFF5EC}
    .empty-row{text-align:center;color:#7A6855;padding:40px !important}
    .role-pill{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase}
    .role-buyer{background:#E3F2FD;color:#1565C0}
    .role-seller{background:#F3E5F5;color:#6A1B9A}
    .role-admin{background:#FFF3E0;color:#E65100}
    .status-active{color:#2D6A4F;font-weight:600;font-size:13px}
    .status-inactive{color:#C62828;font-weight:600;font-size:13px}
    .btn-sm{padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:inherit}
    .btn-deactivate{background:#FFEBEE;color:#C62828}
    .btn-activate{background:#E8F5E9;color:#2E7D32}
    .pagination{display:flex;gap:12px;align-items:center;justify-content:center;padding:16px;border-top:1px solid #F0E8D8}
    .pagination button{padding:6px 16px;border:1.5px solid #E2D5BE;border-radius:6px;background:#FFFBF4;cursor:pointer;font-size:13px;font-family:inherit}
    .pagination button:disabled{opacity:.4;cursor:not-allowed}
    .pagination span{font-size:13px;color:#7A6855}
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminSvc = inject(AdminService);
  users = signal<any[]>([]); loading = signal(true);
  search = ''; roleFilter = ''; page = 1; limit = 20; total = 0;
  totalPages = () => Math.ceil(this.total / this.limit);

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.adminSvc.getUsers({ role: this.roleFilter, search: this.search, page: this.page, limit: this.limit })
      .subscribe(r => { this.users.set(r.data); this.total = r.pagination.total; this.loading.set(false); });
  }
  toggle(u: any) {
    this.adminSvc.toggleUserStatus(u.id).subscribe(r => {
      u.is_active = (r as any).data.is_active;
    });
  }
  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages()) { this.page++; this.load(); } }
}

// ── ORDERS ────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-orders',
  standalone: true, imports: ADMIN_IMPORTS,
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders" routerLinkActive="active" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar"><h1 class="page-title">Order Management</h1></div>
        <div class="filters-bar">
          <select [(ngModel)]="statusFilter" (ngModelChange)="load()" class="filter-sel">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input class="search-input" [(ngModel)]="search" (input)="load()" placeholder="Search order # or email…">
        </div>
        <div class="panel">
          <div class="loading-state" *ngIf="loading()">Loading…</div>
          <table class="data-table" *ngIf="!loading()">
            <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              <tr *ngFor="let o of orders()">
                <td class="mono">{{ o.order_number }}</td>
                <td>{{ o.first_name }} {{ o.last_name }}<br><small>{{ o.email }}</small></td>
                <td>{{ o.item_count }}</td>
                <td>₹{{ o.total_amount }}</td>
                <td><span [class]="'pay-'+o.payment_status">{{ o.payment_status }}</span></td>
                <td><span class="status-pill" [class]="'s-'+o.status">{{ o.status }}</span></td>
                <td>{{ o.created_at | date:'dd MMM yy' }}</td>
                <td>
                  <select (change)="updateStatus(o, $any($event.target).value)" class="status-sel">
                    <option value="">Change status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
              <tr *ngIf="!orders().length"><td colspan="8" class="empty-row">No orders found</td></tr>
            </tbody>
          </table>
          <div class="pagination" *ngIf="totalPages() > 1">
            <button (click)="prev()" [disabled]="page===1">← Prev</button>
            <span>Page {{ page }} of {{ totalPages() }}</span>
            <button (click)="next()" [disabled]="page>=totalPages()">Next →</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout{display:flex;min-height:100vh} .sidebar{width:240px;background:#1A0F00;color:#fff;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
    .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1)} .sl-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#C99A2E}
    .sl-role{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px} .sidebar-nav{padding:12px 0}
    .snav-item{display:flex;align-items:center;gap:8px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:.15s}
    .snav-item:hover,.snav-item.active{background:rgba(255,255,255,.08);color:#fff} .snav-item.active{border-right:3px solid #E8580A;color:#E8580A}
    .admin-main{flex:1;background:#F5ECD7;padding:28px;min-width:0} .admin-topbar{margin-bottom:24px}
    .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700} .loading-state{color:#7A6855;padding:40px;text-align:center}
    .filters-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
    .filter-sel,.status-sel{padding:8px 14px;border:1.5px solid #E2D5BE;border-radius:8px;background:#FFFBF4;font-size:13px;outline:none;font-family:inherit}
    .search-input{padding:8px 14px;border:1.5px solid #E2D5BE;border-radius:8px;background:#FFFBF4;font-size:14px;outline:none;font-family:inherit;min-width:240px}
    .search-input:focus{border-color:#E8580A}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:13px}
    .data-table th{text-align:left;padding:10px 14px;background:#F5ECD7;font-size:12px;font-weight:600;color:#7A6855;text-transform:uppercase;letter-spacing:.5px}
    .data-table td{padding:10px 14px;border-bottom:1px solid #F0E8D8;vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none} .data-table tr:hover td{background:#FFF5EC}
    .empty-row{text-align:center;color:#7A6855;padding:40px !important} .mono{font-family:monospace;font-size:12px}
    .status-pill{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase}
    .s-pending{background:#FFF3E0;color:#E65100} .s-confirmed{background:#E8F5E9;color:#2E7D32}
    .s-shipped{background:#E3F2FD;color:#1565C0} .s-delivered{background:#F3E5F5;color:#6A1B9A}
    .s-cancelled{background:#FFEBEE;color:#C62828}
    .pay-paid{color:#2D6A4F;font-weight:600;font-size:12px} .pay-pending{color:#E65100;font-weight:600;font-size:12px}
    .pay-failed{color:#C62828;font-weight:600;font-size:12px}
    .pagination{display:flex;gap:12px;align-items:center;justify-content:center;padding:16px;border-top:1px solid #F0E8D8}
    .pagination button{padding:6px 16px;border:1.5px solid #E2D5BE;border-radius:6px;background:#FFFBF4;cursor:pointer;font-size:13px;font-family:inherit}
    .pagination button:disabled{opacity:.4;cursor:not-allowed} .pagination span{font-size:13px;color:#7A6855}
  `]
})
export class AdminOrdersComponent implements OnInit {
  private adminSvc = inject(AdminService);
  orders = signal<any[]>([]); loading = signal(true);
  search = ''; statusFilter = ''; page = 1; limit = 20; total = 0;
  totalPages = () => Math.ceil(this.total / this.limit);
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.adminSvc.getAllOrders({ status: this.statusFilter, search: this.search, page: this.page, limit: this.limit })
      .subscribe(r => { this.orders.set(r.data); this.total = r.pagination.total; this.loading.set(false); });
  }
  updateStatus(o: any, status: string) {
    if (!status) return;
    this.adminSvc.updateOrderStatus(o.id, status).subscribe(() => { o.status = status; });
  }
  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages()) { this.page++; this.load(); } }
}

// ── BOOKS ─────────────────────────────────────────────────────
@Component({
  selector: 'app-admin-books',
  standalone: true, imports: ADMIN_IMPORTS,
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books" routerLinkActive="active" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar"><h1 class="page-title">Book Management</h1></div>
        <div class="filters-bar">
          <input class="search-input" [(ngModel)]="search" (input)="load()" placeholder="Search title, ISBN…">
          <select [(ngModel)]="activeFilter" (ngModelChange)="load()" class="filter-sel">
            <option value="">All Books</option><option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </div>
        <div class="panel">
          <div class="loading-state" *ngIf="loading()">Loading…</div>
          <table class="data-table" *ngIf="!loading()">
            <thead><tr><th>Title</th><th>Author(s)</th><th>Store</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Rating</th><th>Featured</th></tr></thead>
            <tbody>
              <tr *ngFor="let b of books()">
                <td class="book-title-cell">{{ b.title }}</td>
                <td>{{ b.authors?.join(', ') }}</td>
                <td>{{ b.store_name }}</td>
                <td>{{ b.category_name || '—' }}</td>
                <td>₹{{ b.selling_price }}</td>
                <td [class]="b.stock_quantity === 0 ? 'out-stock' : ''">{{ b.stock_quantity }}</td>
                <td>{{ b.total_sold }}</td>
                <td>⭐ {{ b.rating || 0 }}</td>
                <td>
                  <button (click)="toggleFeatured(b)" class="btn-sm" [class]="b.is_featured ? 'btn-featured' : 'btn-unfeatured'">
                    {{ b.is_featured ? '⭐ Featured' : 'Feature' }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!books().length"><td colspan="9" class="empty-row">No books found</td></tr>
            </tbody>
          </table>
          <div class="pagination" *ngIf="totalPages() > 1">
            <button (click)="prev()" [disabled]="page===1">← Prev</button>
            <span>Page {{ page }} of {{ totalPages() }}</span>
            <button (click)="next()" [disabled]="page>=totalPages()">Next →</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout{display:flex;min-height:100vh} .sidebar{width:240px;background:#1A0F00;color:#fff;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
    .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1)} .sl-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#C99A2E}
    .sl-role{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px} .sidebar-nav{padding:12px 0}
    .snav-item{display:flex;align-items:center;gap:8px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:.15s}
    .snav-item:hover,.snav-item.active{background:rgba(255,255,255,.08);color:#fff} .snav-item.active{border-right:3px solid #E8580A;color:#E8580A}
    .admin-main{flex:1;background:#F5ECD7;padding:28px;min-width:0} .admin-topbar{margin-bottom:24px}
    .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700} .loading-state{color:#7A6855;padding:40px;text-align:center}
    .filters-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
    .filter-sel{padding:8px 14px;border:1.5px solid #E2D5BE;border-radius:8px;background:#FFFBF4;font-size:13px;outline:none;font-family:inherit}
    .search-input{padding:8px 14px;border:1.5px solid #E2D5BE;border-radius:8px;background:#FFFBF4;font-size:14px;outline:none;font-family:inherit;min-width:240px}
    .search-input:focus{border-color:#E8580A}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:13px}
    .data-table th{text-align:left;padding:10px 14px;background:#F5ECD7;font-size:12px;font-weight:600;color:#7A6855;text-transform:uppercase;letter-spacing:.5px}
    .data-table td{padding:10px 14px;border-bottom:1px solid #F0E8D8;vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none} .data-table tr:hover td{background:#FFF5EC}
    .empty-row{text-align:center;color:#7A6855;padding:40px !important}
    .book-title-cell{font-weight:600;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .out-stock{color:#C62828;font-weight:700}
    .btn-sm{padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:inherit}
    .btn-featured{background:#FFF8E1;color:#C99A2E;border:1px solid #FFE082}
    .btn-unfeatured{background:#F5ECD7;color:#7A6855}
    .pagination{display:flex;gap:12px;align-items:center;justify-content:center;padding:16px;border-top:1px solid #F0E8D8}
    .pagination button{padding:6px 16px;border:1.5px solid #E2D5BE;border-radius:6px;background:#FFFBF4;cursor:pointer;font-size:13px;font-family:inherit}
    .pagination button:disabled{opacity:.4;cursor:not-allowed} .pagination span{font-size:13px;color:#7A6855}
  `]
})
export class AdminBooksComponent implements OnInit {
  private adminSvc = inject(AdminService);
  books = signal<any[]>([]); loading = signal(true);
  search = ''; activeFilter = ''; page = 1; limit = 20; total = 0;
  totalPages = () => Math.ceil(this.total / this.limit);
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.adminSvc.getAllBooks({ search: this.search, is_active: this.activeFilter, page: this.page, limit: this.limit })
      .subscribe(r => { this.books.set(r.data); this.total = r.pagination.total; this.loading.set(false); });
  }
  toggleFeatured(b: any) {
    this.adminSvc.toggleBookFeatured(b.id).subscribe(() => { b.is_featured = !b.is_featured; });
  }
  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages()) { this.page++; this.load(); } }
}

// ── COUPONS ───────────────────────────────────────────────────
@Component({
  selector: 'app-admin-coupons',
  standalone: true, imports: ADMIN_IMPORTS,
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons" routerLinkActive="active" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar">
          <h1 class="page-title">Coupon Management</h1>
          <button class="btn-create" (click)="showForm=true">+ Create Coupon</button>
        </div>
        <div class="panel">
          <table class="data-table">
            <thead><tr><th>Code</th><th>Description</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used/Limit</th><th>Expires</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of coupons()">
                <td><strong class="mono">{{ c.code }}</strong></td>
                <td>{{ c.description }}</td>
                <td>{{ c.discount_type }}</td>
                <td>{{ c.discount_type==='percentage' ? c.discount_value+'%' : '₹'+c.discount_value }}</td>
                <td>₹{{ c.min_order_value }}</td>
                <td>{{ c.used_count }}/{{ c.usage_limit || '∞' }}</td>
                <td>{{ c.valid_until ? (c.valid_until | date:'dd MMM yy') : '—' }}</td>
                <td><span [class]="c.is_active ? 'badge-active' : 'badge-inactive'">{{ c.is_active ? 'Active' : 'Inactive' }}</span></td>
                <td><button (click)="toggle(c)" class="btn-sm btn-toggle">{{ c.is_active ? 'Disable' : 'Enable' }}</button></td>
              </tr>
              <tr *ngIf="!coupons().length"><td colspan="9" class="empty-row">No coupons yet</td></tr>
            </tbody>
          </table>
        </div>

        <!-- CREATE FORM MODAL -->
        <div class="modal-overlay" *ngIf="showForm" (click)="showForm=false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Create New Coupon</h3>
            <div class="form-grid">
              <div class="form-group"><label>Code *</label><input [(ngModel)]="f.code" placeholder="SAVE20" style="text-transform:uppercase"></div>
              <div class="form-group"><label>Discount Type *</label>
                <select [(ngModel)]="f.discount_type" class="filter-sel w100">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>
              <div class="form-group"><label>Value *</label><input type="number" [(ngModel)]="f.discount_value" placeholder="20"></div>
              <div class="form-group"><label>Min Order (₹)</label><input type="number" [(ngModel)]="f.min_order_value" placeholder="0"></div>
              <div class="form-group"><label>Max Discount (₹)</label><input type="number" [(ngModel)]="f.max_discount" placeholder="Optional"></div>
              <div class="form-group"><label>Usage Limit</label><input type="number" [(ngModel)]="f.usage_limit" placeholder="Unlimited"></div>
              <div class="form-group full"><label>Description</label><input [(ngModel)]="f.description" placeholder="Coupon description"></div>
              <div class="form-group"><label>Valid Until</label><input type="date" [(ngModel)]="f.valid_until"></div>
            </div>
            <div class="modal-actions">
              <button (click)="showForm=false" class="btn-cancel">Cancel</button>
              <button (click)="create()" class="btn-create">Create Coupon</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout{display:flex;min-height:100vh} .sidebar{width:240px;background:#1A0F00;color:#fff;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
    .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1)} .sl-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#C99A2E}
    .sl-role{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px} .sidebar-nav{padding:12px 0}
    .snav-item{display:flex;align-items:center;gap:8px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:.15s}
    .snav-item:hover,.snav-item.active{background:rgba(255,255,255,.08);color:#fff} .snav-item.active{border-right:3px solid #E8580A;color:#E8580A}
    .admin-main{flex:1;background:#F5ECD7;padding:28px;min-width:0}
    .admin-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700}
    .btn-create{padding:10px 20px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .btn-create:hover{background:#7A1E2E}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:13px}
    .data-table th{text-align:left;padding:10px 14px;background:#F5ECD7;font-size:12px;font-weight:600;color:#7A6855;text-transform:uppercase;letter-spacing:.5px}
    .data-table td{padding:10px 14px;border-bottom:1px solid #F0E8D8;vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none} .data-table tr:hover td{background:#FFF5EC}
    .empty-row{text-align:center;color:#7A6855;padding:40px !important} .mono{font-family:monospace}
    .badge-active{background:#E8F5E9;color:#2E7D32;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}
    .badge-inactive{background:#FFEBEE;color:#C62828;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}
    .btn-sm{padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:inherit}
    .btn-toggle{background:#F5ECD7;color:#7A6855}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center}
    .modal{background:#FDF6EC;border-radius:12px;padding:32px;width:560px;max-width:90vw}
    .modal h3{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:20px}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .form-group{display:flex;flex-direction:column;gap:6px}
    .form-group.full{grid-column:1/-1}
    .form-group label{font-size:13px;font-weight:600}
    .form-group input,.filter-sel{padding:10px 14px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#F5ECD7;outline:none;font-family:inherit;box-sizing:border-box}
    .form-group input:focus{border-color:#E8580A;background:#fff}
    .w100{width:100%}
    .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
    .btn-cancel{padding:10px 20px;border:1.5px solid #E2D5BE;border-radius:8px;background:#F5ECD7;cursor:pointer;font-size:14px;font-family:inherit}
  `]
})
export class AdminCouponsComponent implements OnInit {
  private adminSvc = inject(AdminService);
  coupons = signal<any[]>([]); showForm = false;
  f: any = { code:'', discount_type:'percentage', discount_value:null, min_order_value:0, max_discount:null, usage_limit:null, description:'', valid_until:'' };
  ngOnInit() { this.load(); }
  load() { this.adminSvc.getCoupons().subscribe(r => this.coupons.set(r.data)); }
  toggle(c: any) { this.adminSvc.toggleCoupon(c.id).subscribe(() => { c.is_active = !c.is_active; }); }
  create() {
    this.adminSvc.createCoupon({ ...this.f, code: this.f.code.toUpperCase() }).subscribe(() => {
      this.showForm = false; this.load();
    });
  }
}

// ── CATEGORIES ────────────────────────────────────────────────
@Component({
  selector: 'app-admin-categories',
  standalone: true, imports: ADMIN_IMPORTS,
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar">
          <h1 class="page-title">Category Management</h1>
          <button class="btn-create" (click)="showForm=!showForm">{{ showForm ? 'Cancel' : '+ Add Category' }}</button>
        </div>
        <div class="panel create-form" *ngIf="showForm">
          <h3>New Category</h3>
          <div class="form-row-3">
            <div class="form-group"><label>Name *</label><input [(ngModel)]="f.name" placeholder="e.g. Science Fiction"></div>
            <div class="form-group"><label>Icon (emoji)</label><input [(ngModel)]="f.icon" placeholder="🔬" maxlength="4"></div>
            <div class="form-group"><label>Sort Order</label><input type="number" [(ngModel)]="f.sort_order" placeholder="0"></div>
          </div>
          <div class="form-group"><label>Description</label><input [(ngModel)]="f.description" placeholder="Brief description"></div>
          <button class="btn-create" (click)="create()">Create Category</button>
        </div>
        <div class="panel">
          <table class="data-table">
            <thead><tr><th>Icon</th><th>Name</th><th>Slug</th><th>Description</th><th>Active</th><th>Sort</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of categories()">
                <td style="font-size:20px">{{ c.icon || '📁' }}</td>
                <td><strong>{{ c.name }}</strong></td>
                <td class="mono">{{ c.slug }}</td>
                <td>{{ c.description || '—' }}</td>
                <td>{{ c.is_active ? '✅' : '❌' }}</td>
                <td>{{ c.sort_order }}</td>
                <td>
                  <button (click)="toggleActive(c)" class="btn-sm btn-toggle">
                    {{ c.is_active ? 'Disable' : 'Enable' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout{display:flex;min-height:100vh} .sidebar{width:240px;background:#1A0F00;color:#fff;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
    .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1)} .sl-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#C99A2E}
    .sl-role{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px} .sidebar-nav{padding:12px 0}
    .snav-item{display:flex;align-items:center;gap:8px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:.15s}
    .snav-item:hover,.snav-item.active{background:rgba(255,255,255,.08);color:#fff} .snav-item.active{border-right:3px solid #E8580A;color:#E8580A}
    .admin-main{flex:1;background:#F5ECD7;padding:28px;min-width:0}
    .admin-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700}
    .btn-create{padding:10px 20px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .create-form{padding:20px;margin-bottom:20px}
    .create-form h3{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:16px}
    .form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px}
    .form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
    .form-group label{font-size:13px;font-weight:600}
    .form-group input{padding:10px 14px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#F5ECD7;outline:none;font-family:inherit;box-sizing:border-box}
    .form-group input:focus{border-color:#E8580A;background:#fff}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden;margin-bottom:16px}
    .data-table{width:100%;border-collapse:collapse;font-size:13px}
    .data-table th{text-align:left;padding:10px 14px;background:#F5ECD7;font-size:12px;font-weight:600;color:#7A6855;text-transform:uppercase;letter-spacing:.5px}
    .data-table td{padding:10px 14px;border-bottom:1px solid #F0E8D8;vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none} .data-table tr:hover td{background:#FFF5EC}
    .mono{font-family:monospace;font-size:12px}
    .btn-sm{padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:inherit}
    .btn-toggle{background:#F5ECD7;color:#7A6855}
  `]
})
export class AdminCategoriesComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private bookSvc  = inject(BookService);
  categories = signal<any[]>([]); showForm = false;
  f = { name: '', icon: '', description: '', sort_order: 0 };
  ngOnInit() { this.load(); }
  load() {
    this.bookSvc.getCategories().subscribe((r: any) => this.categories.set(r.data));
  }
  create() {
    this.adminSvc.createCategory(this.f).subscribe(() => { this.showForm = false; this.load(); });
  }
  toggleActive(c: any) {
    this.adminSvc.updateCategory(c.id, { is_active: !c.is_active }).subscribe(() => { c.is_active = !c.is_active; });
  }
}

// ── AUDIT LOGS ────────────────────────────────────────────────
@Component({
  selector: 'app-admin-audit-logs',
  standalone: true, imports: ADMIN_IMPORTS,
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" routerLinkActive="active" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>
      <div class="admin-main">
        <div class="admin-topbar"><h1 class="page-title">Audit Logs</h1></div>
        <div class="panel">
          <div class="loading-state" *ngIf="loading()">Loading…</div>
          <table class="data-table" *ngIf="!loading()">
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
            <tbody>
              <tr *ngFor="let l of logs()">
                <td class="time-cell">{{ l.created_at | date:'dd MMM yy, HH:mm' }}</td>
                <td>{{ l.email || 'System' }}</td>
                <td><span class="action-tag">{{ l.action }}</span></td>
                <td>{{ l.entity_type }} {{ l.entity_id ? ('· ' + l.entity_id.slice(0,8)+'…') : '' }}</td>
                <td class="mono">{{ l.ip_address || '—' }}</td>
              </tr>
              <tr *ngIf="!logs().length"><td colspan="5" class="empty-row">No audit logs yet</td></tr>
            </tbody>
          </table>
          <div class="pagination" *ngIf="totalPages() > 1">
            <button (click)="prev()" [disabled]="page===1">← Prev</button>
            <span>Page {{ page }} of {{ totalPages() }}</span>
            <button (click)="next()" [disabled]="page>=totalPages()">Next →</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout{display:flex;min-height:100vh} .sidebar{width:240px;background:#1A0F00;color:#fff;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
    .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1)} .sl-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#C99A2E}
    .sl-role{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px} .sidebar-nav{padding:12px 0}
    .snav-item{display:flex;align-items:center;gap:8px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;transition:.15s}
    .snav-item:hover,.snav-item.active{background:rgba(255,255,255,.08);color:#fff} .snav-item.active{border-right:3px solid #E8580A;color:#E8580A}
    .admin-main{flex:1;background:#F5ECD7;padding:28px;min-width:0} .admin-topbar{margin-bottom:24px}
    .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700} .loading-state{color:#7A6855;padding:40px;text-align:center}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    .data-table{width:100%;border-collapse:collapse;font-size:13px}
    .data-table th{text-align:left;padding:10px 14px;background:#F5ECD7;font-size:12px;font-weight:600;color:#7A6855;text-transform:uppercase;letter-spacing:.5px}
    .data-table td{padding:10px 14px;border-bottom:1px solid #F0E8D8;vertical-align:middle}
    .data-table tr:last-child td{border-bottom:none} .data-table tr:hover td{background:#FFF5EC}
    .empty-row{text-align:center;color:#7A6855;padding:40px !important}
    .time-cell{white-space:nowrap;font-size:12px;color:#7A6855}
    .action-tag{background:#FFF3E0;color:#E65100;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:monospace}
    .mono{font-family:monospace;font-size:12px}
    .pagination{display:flex;gap:12px;align-items:center;justify-content:center;padding:16px;border-top:1px solid #F0E8D8}
    .pagination button{padding:6px 16px;border:1.5px solid #E2D5BE;border-radius:6px;background:#FFFBF4;cursor:pointer;font-size:13px;font-family:inherit}
    .pagination button:disabled{opacity:.4;cursor:not-allowed} .pagination span{font-size:13px;color:#7A6855}
  `]
})
export class AdminAuditLogsComponent implements OnInit {
  private adminSvc = inject(AdminService);
  logs = signal<any[]>([]); loading = signal(true);
  page = 1; limit = 50; total = 0;
  totalPages = () => Math.ceil(this.total / this.limit);
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.adminSvc.getAuditLogs({ page: this.page, limit: this.limit })
      .subscribe(r => { this.logs.set(r.data); this.total = r.pagination.total; this.loading.set(false); });
  }
  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages()) { this.page++; this.load(); } }
}
