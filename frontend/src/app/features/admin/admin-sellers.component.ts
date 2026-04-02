import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-logo"><div class="sl-name">Pustakwala</div><div class="sl-role">Admin Panel</div></div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers"   routerLinkActive="active" class="snav-item">🏪 Sellers</a>
          <a routerLink="/admin/users"     class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders"    class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books"     class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons"   class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" class="snav-item">📋 Audit Logs</a>
        </nav>
      </aside>

      <div class="admin-main">
        <div class="admin-topbar">
          <h1 class="page-title">Seller Management</h1>
        </div>

        <!-- FILTERS -->
        <div class="filters-bar">
          <div class="filter-tabs">
            <button *ngFor="let s of statusOptions"
              [class.active]="statusFilter === s.val"
              (click)="setStatus(s.val)">
              {{ s.label }}
              <span class="tab-count" *ngIf="s.val === 'pending' && pendingCount() > 0">{{ pendingCount() }}</span>
            </button>
          </div>
          <input class="search-input" type="text" [(ngModel)]="search"
            placeholder="Search by store name or email…" (input)="loadSellers()">
        </div>

        <!-- TABLE -->
        <div class="panel">
          <div class="loading-state" *ngIf="loading()">Loading sellers…</div>
          <table class="data-table" *ngIf="!loading()">
            <thead>
              <tr>
                <th>Store</th><th>Owner</th><th>Email</th>
                <th>GST</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of sellers()">
                <td>
                  <div class="store-name">{{ s.store_name }}</div>
                  <div class="store-slug">{{ s.store_slug }}</div>
                </td>
                <td>{{ s.first_name }} {{ s.last_name }}</td>
                <td>{{ s.email }}</td>
                <td>{{ s.gst_number || '—' }}</td>
                <td><span class="status-pill" [class]="'ss-'+s.status">{{ s.status }}</span></td>
                <td>{{ s.created_at | date:'dd MMM yy' }}</td>
                <td class="actions-cell">
                  <a [routerLink]="['/admin/sellers', s.id]" class="btn-sm btn-view">View</a>
                  <button *ngIf="s.status==='pending'" (click)="approve(s)" class="btn-sm btn-approve">Approve</button>
                  <button *ngIf="s.status==='pending'" (click)="openReject(s)" class="btn-sm btn-reject">Reject</button>
                  <button *ngIf="s.status==='approved'" (click)="suspend(s)" class="btn-sm btn-reject">Suspend</button>
                </td>
              </tr>
              <tr *ngIf="!sellers().length">
                <td colspan="7" class="empty-row">No sellers found</td>
              </tr>
            </tbody>
          </table>

          <!-- PAGINATION -->
          <div class="pagination" *ngIf="totalPages() > 1">
            <button (click)="prevPage()" [disabled]="page===1">← Prev</button>
            <span>Page {{ page }} of {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="page >= totalPages()">Next →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- REJECT MODAL -->
    <div class="modal-overlay" *ngIf="rejectTarget()" (click)="closeReject()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Reject Seller Application</h3>
        <p>Store: <strong>{{ rejectTarget()?.store_name }}</strong></p>
        <div class="form-group">
          <label>Reason for rejection *</label>
          <textarea [(ngModel)]="rejectReason" placeholder="Please explain why the application is being rejected…" rows="4"></textarea>
        </div>
        <div class="modal-actions">
          <button (click)="closeReject()" class="btn-cancel">Cancel</button>
          <button (click)="confirmReject()" class="btn-confirm-reject" [disabled]="!rejectReason.trim()">Reject Application</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* reuse shared admin styles */
    .admin-layout { display:flex; min-height:100vh; }
    .sidebar { width:240px; background:#1A0F00; color:#fff; flex-shrink:0; position:sticky; top:0; height:100vh; overflow-y:auto; }
    .sidebar-logo { padding:24px 20px 20px; border-bottom:1px solid rgba(255,255,255,.1); }
    .sl-name { font-family:'Playfair Display',serif; font-size:20px; font-weight:900; color:#C99A2E; }
    .sl-role { font-size:11px; color:rgba(255,255,255,.4); letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
    .sidebar-nav { padding:12px 0; }
    .snav-item { display:flex; align-items:center; gap:8px; padding:10px 20px; color:rgba(255,255,255,.7); text-decoration:none; font-size:14px; transition:.15s; }
    .snav-item:hover, .snav-item.active { background:rgba(255,255,255,.08); color:#fff; }
    .snav-item.active { border-right:3px solid #E8580A; color:#E8580A; }

    .admin-main { flex:1; background:#F5ECD7; padding:28px; min-width:0; }
    .admin-topbar { margin-bottom:24px; }
    .page-title { font-family:'Playfair Display',serif; font-size:24px; font-weight:700; }
    .loading-state { color:#7A6855; padding:40px; text-align:center; }

    .filters-bar { display:flex; gap:16px; align-items:center; margin-bottom:20px; flex-wrap:wrap; }
    .filter-tabs { display:flex; gap:4px; flex-wrap:wrap; }
    .filter-tabs button { padding:7px 16px; border:1.5px solid #E2D5BE; border-radius:20px;
      background:#FFFBF4; font-size:13px; cursor:pointer; transition:.2s; font-family:inherit; }
    .filter-tabs button.active { background:#E8580A; color:#fff; border-color:#E8580A; }
    .tab-count { background:#fff; color:#E8580A; border-radius:10px; padding:0 6px;
      font-size:11px; font-weight:700; margin-left:4px; }
    .search-input { padding:8px 14px; border:1.5px solid #E2D5BE; border-radius:8px;
      font-size:14px; background:#FFFBF4; outline:none; font-family:inherit; min-width:240px; }
    .search-input:focus { border-color:#E8580A; }

    .panel { background:#FFFBF4; border:1px solid #E2D5BE; border-radius:12px; overflow:hidden; }
    .data-table { width:100%; border-collapse:collapse; font-size:13px; }
    .data-table th { text-align:left; padding:10px 14px; background:#F5ECD7;
      font-size:12px; font-weight:600; color:#7A6855; text-transform:uppercase; letter-spacing:.5px; }
    .data-table td { padding:12px 14px; border-bottom:1px solid #F0E8D8; vertical-align:middle; }
    .data-table tr:last-child td { border-bottom:none; }
    .data-table tr:hover td { background:#FFF5EC; }
    .store-name { font-weight:600; font-size:14px; }
    .store-slug { font-size:11px; color:#7A6855; font-family:monospace; }
    .empty-row { text-align:center; color:#7A6855; padding:40px !important; }

    .status-pill { padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase; }
    .ss-pending  { background:#FFF3E0; color:#E65100; }
    .ss-approved { background:#E8F5E9; color:#2E7D32; }
    .ss-rejected { background:#FFEBEE; color:#C62828; }
    .ss-suspended{ background:#F3E5F5; color:#6A1B9A; }

    .actions-cell { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .btn-sm { padding:5px 12px; border-radius:6px; font-size:12px; font-weight:600;
      border:none; cursor:pointer; text-decoration:none; transition:.2s; font-family:inherit; }
    .btn-view    { background:#E8F5E9; color:#2E7D32; }
    .btn-view:hover { background:#C8E6C9; }
    .btn-approve { background:#2D6A4F; color:#fff; }
    .btn-approve:hover { background:#1B4332; }
    .btn-reject  { background:#FFEBEE; color:#C62828; }
    .btn-reject:hover { background:#FFCDD2; }

    .pagination { display:flex; gap:12px; align-items:center; justify-content:center;
      padding:16px; border-top:1px solid #F0E8D8; }
    .pagination button { padding:6px 16px; border:1.5px solid #E2D5BE; border-radius:6px;
      background:#FFFBF4; cursor:pointer; font-size:13px; font-family:inherit; }
    .pagination button:disabled { opacity:.4; cursor:not-allowed; }
    .pagination span { font-size:13px; color:#7A6855; }

    /* MODAL */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5);
      z-index:2000; display:flex; align-items:center; justify-content:center; }
    .modal { background:#FDF6EC; border-radius:12px; padding:32px; width:480px;
      max-width:90vw; box-shadow:0 24px 64px rgba(0,0,0,.3); }
    .modal h3 { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; margin-bottom:8px; }
    .modal p { color:#7A6855; margin-bottom:16px; font-size:14px; }
    .form-group { margin-bottom:20px; }
    .form-group label { display:block; font-size:13px; font-weight:600; margin-bottom:6px; }
    .form-group textarea { width:100%; padding:11px 14px; border:1.5px solid #E2D5BE;
      border-radius:8px; font-size:14px; background:#F5ECD7; outline:none;
      font-family:inherit; resize:vertical; box-sizing:border-box; }
    .form-group textarea:focus { border-color:#E8580A; background:#fff; }
    .modal-actions { display:flex; gap:10px; justify-content:flex-end; }
    .btn-cancel { padding:10px 20px; border:1.5px solid #E2D5BE; border-radius:8px;
      background:#F5ECD7; cursor:pointer; font-size:14px; font-family:inherit; }
    .btn-confirm-reject { padding:10px 20px; background:#C62828; color:#fff; border:none;
      border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-confirm-reject:disabled { opacity:.4; cursor:not-allowed; }
  `]
})
export class AdminSellersComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private route = inject(ActivatedRoute);

  sellers    = signal<any[]>([]);
  loading    = signal(true);
  pendingCount = signal(0);
  rejectTarget = signal<any>(null);
  rejectReason = '';
  search = ''; statusFilter = '';
  page = 1; limit = 20; total = 0;

  statusOptions = [
    { val: '', label: 'All' },
    { val: 'pending',  label: '⏳ Pending' },
    { val: 'approved', label: '✅ Approved' },
    { val: 'rejected', label: '❌ Rejected' },
    { val: 'suspended',label: '🚫 Suspended' },
  ];

  totalPages = () => Math.ceil(this.total / this.limit);

  ngOnInit() {
    const s = this.route.snapshot.queryParamMap.get('status');
    if (s) this.statusFilter = s;
    this.loadSellers();
    this.adminSvc.getSellers({ status: 'pending', limit: 1 }).subscribe(r => {
      this.pendingCount.set(r.pagination.total);
    });
  }

  setStatus(v: string) { this.statusFilter = v; this.page = 1; this.loadSellers(); }

  loadSellers() {
    this.loading.set(true);
    this.adminSvc.getSellers({ status: this.statusFilter, search: this.search, page: this.page, limit: this.limit })
      .subscribe(r => { this.sellers.set(r.data); this.total = r.pagination.total; this.loading.set(false); });
  }

  approve(s: any) {
    this.adminSvc.approveSeller(s.id).subscribe(() => this.loadSellers());
  }

  openReject(s: any) { this.rejectTarget.set(s); this.rejectReason = ''; }
  closeReject()      { this.rejectTarget.set(null); }

  confirmReject() {
    const t = this.rejectTarget();
    if (!t || !this.rejectReason.trim()) return;
    this.adminSvc.rejectSeller(t.id, this.rejectReason).subscribe(() => {
      this.closeReject(); this.loadSellers();
    });
  }

  suspend(s: any) {
    if (confirm(`Suspend "${s.store_name}"?`)) {
      this.adminSvc.suspendSeller(s.id, 'Suspended by admin').subscribe(() => this.loadSellers());
    }
  }

  prevPage() { if (this.page > 1) { this.page--; this.loadSellers(); } }
  nextPage() { if (this.page < this.totalPages()) { this.page++; this.loadSellers(); } }
}
