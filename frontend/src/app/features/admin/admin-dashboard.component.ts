import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="sl-name">Pustakwala</div>
          <div class="sl-role">Admin Panel</div>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="snav-item">📊 Dashboard</a>
          <a routerLink="/admin/sellers"   routerLinkActive="active" class="snav-item">🏪 Sellers <span class="badge-count" *ngIf="pendingSellers()">{{ pendingSellers() }}</span></a>
          <a routerLink="/admin/users"     routerLinkActive="active" class="snav-item">👥 Users</a>
          <a routerLink="/admin/orders"    routerLinkActive="active" class="snav-item">📦 Orders</a>
          <a routerLink="/admin/books"     routerLinkActive="active" class="snav-item">📚 Books</a>
          <a routerLink="/admin/coupons"   routerLinkActive="active" class="snav-item">🎟️ Coupons</a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="snav-item">🗂️ Categories</a>
          <a routerLink="/admin/audit-logs" routerLinkActive="active" class="snav-item">📋 Audit Logs</a>
          <hr class="snav-divider">
          <a routerLink="/" class="snav-item">🌐 View Store</a>
        </nav>
      </aside>

      <!-- MAIN -->
      <div class="admin-main">
        <div class="admin-topbar">
          <h1 class="page-title">Dashboard Overview</h1>
          <span class="topbar-date">{{ today }}</span>
        </div>

        <div class="loading-state" *ngIf="loading()">Loading dashboard…</div>

        <ng-container *ngIf="!loading() && data()">
          <!-- STAT CARDS -->
          <div class="stat-cards">
            <div class="stat-card">
              <div class="sc-icon">💰</div>
              <div class="sc-info">
                <div class="sc-val">₹{{ data().revenue.total_revenue | number:'1.0-0' }}</div>
                <div class="sc-label">Total Revenue</div>
                <div class="sc-sub green">₹{{ data().revenue.monthly_revenue | number:'1.0-0' }} this month</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="sc-icon">📦</div>
              <div class="sc-info">
                <div class="sc-val">{{ data().orders.total | number }}</div>
                <div class="sc-label">Total Orders</div>
                <div class="sc-sub">{{ data().orders.this_month }} this month</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="sc-icon">👥</div>
              <div class="sc-info">
                <div class="sc-val">{{ data().users.total | number }}</div>
                <div class="sc-label">Total Users</div>
                <div class="sc-sub green">+{{ data().users.new_this_month }} new this month</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="sc-icon">🏪</div>
              <div class="sc-info">
                <div class="sc-val">{{ data().sellers.approved }}</div>
                <div class="sc-label">Active Sellers</div>
                <div class="sc-sub orange" *ngIf="data().sellers.pending > 0">
                  {{ data().sellers.pending }} pending approval
                </div>
              </div>
            </div>
            <div class="stat-card">
              <div class="sc-icon">📚</div>
              <div class="sc-info">
                <div class="sc-val">{{ data().books.active | number }}</div>
                <div class="sc-label">Active Books</div>
                <div class="sc-sub">{{ data().books.total }} total listed</div>
              </div>
            </div>
            <div class="stat-card highlight">
              <div class="sc-icon">⚠️</div>
              <div class="sc-info">
                <div class="sc-val orange">{{ data().sellers.pending }}</div>
                <div class="sc-label">Pending Approvals</div>
                <a routerLink="/admin/sellers" [queryParams]="{status:'pending'}" class="sc-action">Review Now →</a>
              </div>
            </div>
          </div>

          <!-- REVENUE CHART (CSS bars) -->
          <div class="panel">
            <h2 class="panel-title">Revenue Trend (Last 12 Months)</h2>
            <div class="chart-bars" *ngIf="data().revenueTrend?.length">
              <div class="chart-wrap">
                <ng-container *ngFor="let m of data().revenueTrend">
                  <div class="bar-col">
                    <div class="bar-val">₹{{ m.revenue | number:'1.0-0' }}</div>
                    <div class="bar" [style.height.px]="barH(m.revenue)"></div>
                    <div class="bar-lbl">{{ m.month }}</div>
                  </div>
                </ng-container>
              </div>
            </div>
            <div class="empty-chart" *ngIf="!data().revenueTrend?.length">No revenue data yet</div>
          </div>

          <!-- TWO COLUMN -->
          <div class="two-col">
            <!-- RECENT ORDERS -->
            <div class="panel">
              <div class="panel-header">
                <h2 class="panel-title">Recent Orders</h2>
                <a routerLink="/admin/orders" class="panel-link">View all →</a>
              </div>
              <table class="data-table">
                <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let o of data().recentOrders">
                    <td class="mono">{{ o.order_number }}</td>
                    <td>{{ o.first_name }} {{ o.last_name }}</td>
                    <td>₹{{ o.total_amount }}</td>
                    <td><span class="status-pill" [class]="'s-'+o.status">{{ o.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TOP SELLERS -->
            <div class="panel">
              <div class="panel-header">
                <h2 class="panel-title">Top Sellers</h2>
                <a routerLink="/admin/sellers" class="panel-link">View all →</a>
              </div>
              <div class="seller-list">
                <div *ngFor="let s of data().topSellers; let i=index" class="seller-row">
                  <div class="seller-rank">{{ i+1 }}</div>
                  <div class="seller-info">
                    <div class="seller-store">{{ s.store_name }}</div>
                    <div class="seller-owner">{{ s.first_name }} {{ s.last_name }}</div>
                  </div>
                  <div class="seller-rev">
                    <div class="rev-amt">₹{{ s.total_revenue | number:'1.0-0' }}</div>
                    <div class="rev-sub">{{ s.total_sales }} sales</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TOP BOOKS -->
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Top Selling Books</h2>
              <a routerLink="/admin/books" class="panel-link">View all →</a>
            </div>
            <table class="data-table">
              <thead><tr><th>Title</th><th>Author(s)</th><th>Store</th><th>Price</th><th>Sold</th></tr></thead>
              <tbody>
                <tr *ngFor="let b of data().topBooks">
                  <td class="book-title-cell">{{ b.title }}</td>
                  <td>{{ b.authors?.join(', ') }}</td>
                  <td>{{ b.store_name }}</td>
                  <td>₹{{ b.selling_price }}</td>
                  <td><strong>{{ b.total_sold }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { display:flex; min-height:100vh; }
    .sidebar { width:240px; background:#1A0F00; color:#fff; flex-shrink:0;
      display:flex; flex-direction:column; position:sticky; top:0; height:100vh; overflow-y:auto; }
    .sidebar-logo { padding:24px 20px 20px; border-bottom:1px solid rgba(255,255,255,.1); }
    .sl-name { font-family:'Playfair Display',serif; font-size:20px; font-weight:900; color:#C99A2E; }
    .sl-role { font-size:11px; color:rgba(255,255,255,.4); letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
    .sidebar-nav { padding:12px 0; flex:1; }
    .snav-item { display:flex; align-items:center; gap:8px; padding:10px 20px;
      color:rgba(255,255,255,.7); text-decoration:none; font-size:14px;
      transition:.15s; cursor:pointer; }
    .snav-item:hover, .snav-item.active { background:rgba(255,255,255,.08); color:#fff; }
    .snav-item.active { border-right:3px solid #E8580A; color:#E8580A; }
    .snav-divider { border:none; border-top:1px solid rgba(255,255,255,.1); margin:8px 0; }
    .badge-count { margin-left:auto; background:#E8580A; color:#fff; border-radius:10px;
      padding:1px 7px; font-size:11px; font-weight:700; }

    .admin-main { flex:1; background:#F5ECD7; padding:28px; min-width:0; }
    .admin-topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
    .page-title { font-family:'Playfair Display',serif; font-size:24px; font-weight:700; }
    .topbar-date { font-size:13px; color:#7A6855; }
    .loading-state { color:#7A6855; padding:60px; text-align:center; font-size:16px; }

    .stat-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
    .stat-card { background:#FFFBF4; border:1px solid #E2D5BE; border-radius:12px;
      padding:20px; display:flex; gap:16px; align-items:center; transition:.2s; }
    .stat-card:hover { border-color:#E8580A; }
    .stat-card.highlight { border-color:#FFE082; background:#FFFDE7; }
    .sc-icon { font-size:32px; }
    .sc-val { font-family:'Playfair Display',serif; font-size:26px; font-weight:700; color:#1A0F00; }
    .sc-val.orange { color:#E8580A; }
    .sc-label { font-size:13px; color:#7A6855; margin-top:2px; }
    .sc-sub { font-size:12px; margin-top:4px; color:#7A6855; }
    .sc-sub.green { color:#2D6A4F; font-weight:600; }
    .sc-sub.orange { color:#E8580A; font-weight:600; }
    .sc-action { font-size:13px; color:#E8580A; font-weight:600; text-decoration:none; margin-top:4px; display:block; }

    .panel { background:#FFFBF4; border:1px solid #E2D5BE; border-radius:12px;
      padding:20px; margin-bottom:20px; }
    .panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .panel-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; }
    .panel-link { font-size:13px; color:#E8580A; text-decoration:none; font-weight:600; }

    .chart-bars { overflow-x:auto; }
    .chart-wrap { display:flex; align-items:flex-end; gap:8px; height:160px; padding-top:24px; }
    .bar-col { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:50px; }
    .bar-val { font-size:9px; color:#7A6855; text-align:center; }
    .bar { background:linear-gradient(180deg,#E8580A,#7A1E2E); border-radius:4px 4px 0 0;
      width:36px; min-height:4px; transition:.3s; }
    .bar-lbl { font-size:10px; color:#7A6855; white-space:nowrap; }
    .empty-chart { color:#7A6855; text-align:center; padding:40px; font-size:14px; }

    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }

    .data-table { width:100%; border-collapse:collapse; font-size:13px; }
    .data-table th { text-align:left; padding:8px 12px; background:#F5ECD7;
      font-size:12px; font-weight:600; color:#7A6855; text-transform:uppercase; letter-spacing:.5px; }
    .data-table td { padding:10px 12px; border-bottom:1px solid #F0E8D8; }
    .data-table tr:last-child td { border-bottom:none; }
    .data-table tr:hover td { background:#FFF5EC; }
    .mono { font-family:monospace; font-size:12px; }
    .book-title-cell { font-weight:600; max-width:180px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .status-pill { padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase; }
    .s-pending   { background:#FFF3E0; color:#E65100; }
    .s-confirmed { background:#E8F5E9; color:#2E7D32; }
    .s-shipped   { background:#E3F2FD; color:#1565C0; }
    .s-delivered { background:#F3E5F5; color:#6A1B9A; }
    .s-cancelled { background:#FFEBEE; color:#C62828; }

    .seller-list { display:flex; flex-direction:column; gap:12px; }
    .seller-row { display:flex; align-items:center; gap:12px; padding:10px 0;
      border-bottom:1px solid #F0E8D8; }
    .seller-row:last-child { border-bottom:none; }
    .seller-rank { width:28px; height:28px; background:#E8580A; color:#fff;
      border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-size:13px; font-weight:700; flex-shrink:0; }
    .seller-info { flex:1; }
    .seller-store { font-weight:600; font-size:14px; }
    .seller-owner { font-size:12px; color:#7A6855; }
    .seller-rev { text-align:right; }
    .rev-amt { font-weight:700; font-size:14px; color:#7A1E2E; }
    .rev-sub { font-size:12px; color:#7A6855; }

    @media(max-width:1024px) {
      .stat-cards { grid-template-columns:1fr 1fr; }
      .two-col { grid-template-columns:1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminSvc = inject(AdminService);
  data = signal<any>(null);
  loading = signal(true);
  pendingSellers = signal(0);
  today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  ngOnInit() {
    this.adminSvc.getDashboard().subscribe(r => {
      this.data.set(r.data);
      this.pendingSellers.set(r.data.sellers?.pending || 0);
      this.loading.set(false);
    });
  }

  barH(val: number): number {
    const all = this.data()?.revenueTrend || [];
    const max = Math.max(...all.map((m: any) => +m.revenue), 1);
    return Math.max(4, (+val / max) * 120);
  }
}
