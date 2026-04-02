import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../core/services/api.service';
import { Order } from '../../core/models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <a routerLink="/orders" class="back-link">← Back to Orders</a>
      <div class="loading-state" *ngIf="loading()">Loading order…</div>
      <ng-container *ngIf="!loading() && order()">
        <div class="order-header">
          <div>
            <h1 class="page-title">Order #{{ order()!.order_number }}</h1>
            <div class="order-meta">Placed on {{ order()!.created_at | date:'dd MMMM yyyy, h:mm a' }}</div>
          </div>
          <div class="header-badges">
            <span class="status-pill" [class]="'s-'+order()!.status">{{ order()!.status }}</span>
            <span class="pay-pill" [class]="'p-'+order()!.payment_status">{{ order()!.payment_status }}</span>
          </div>
        </div>

        <div class="detail-grid">
          <div class="panel items-panel">
            <h2 class="panel-title">Items Ordered</h2>
            <div *ngFor="let item of order()!.items" class="order-item">
              <div class="oi-cover">📚</div>
              <div class="oi-info">
                <div class="oi-title">{{ item.title }}</div>
                <div class="oi-store">{{ item.store_name }}</div>
                <div class="oi-qty">Qty: {{ item.quantity }}</div>
              </div>
              <div class="oi-price">₹{{ item.total_price | number:'1.0-0' }}</div>
            </div>
          </div>

          <div class="side-panels">
            <div class="panel">
              <h2 class="panel-title">Price Breakdown</h2>
              <div class="price-row"><span>Subtotal</span><span>₹{{ order()!.subtotal }}</span></div>
              <div class="price-row"><span>Shipping</span><span>{{ order()!.shipping_charge === 0 ? 'FREE' : '₹'+order()!.shipping_charge }}</span></div>
              <div class="price-row discount" *ngIf="order()!.discount_amount > 0">
                <span>Discount ({{ order()!.coupon_code }})</span>
                <span>− ₹{{ order()!.discount_amount }}</span>
              </div>
              <div class="price-row total"><span>Total Paid</span><span>₹{{ order()!.total_amount }}</span></div>
            </div>

            <div class="panel">
              <h2 class="panel-title">Shipping Address</h2>
              <div class="address-block" *ngIf="order()!.shipping_address_snapshot">
                <strong>{{ order()!.shipping_address_snapshot.full_name }}</strong>
                <div>{{ order()!.shipping_address_snapshot.address_line1 }}</div>
                <div *ngIf="order()!.shipping_address_snapshot.address_line2">{{ order()!.shipping_address_snapshot.address_line2 }}</div>
                <div>{{ order()!.shipping_address_snapshot.city }}, {{ order()!.shipping_address_snapshot.state }} {{ order()!.shipping_address_snapshot.pincode }}</div>
                <div>📞 {{ order()!.shipping_address_snapshot.phone }}</div>
              </div>
            </div>

            <div class="panel" *ngIf="order()!.tracking_number">
              <h2 class="panel-title">Tracking</h2>
              <div class="tracking-num">{{ order()!.tracking_number }}</div>
            </div>

            <div class="cancel-section" *ngIf="['pending','confirmed'].includes(order()!.status)">
              <button (click)="cancelOrder()" class="btn-cancel" [disabled]="cancelling">
                {{ cancelling ? 'Cancelling…' : '✕ Cancel Order' }}
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-container{max-width:1100px;margin:0 auto;padding:40px 24px}
    .back-link{color:#E8580A;text-decoration:none;font-size:14px;font-weight:600;display:block;margin-bottom:20px}
    .loading-state{color:#7A6855;padding:60px;text-align:center}
    .order-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
    .page-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700}
    .order-meta{font-size:13px;color:#7A6855;margin-top:4px}
    .header-badges{display:flex;gap:8px}
    .status-pill,.pay-pill{padding:5px 14px;border-radius:12px;font-size:12px;font-weight:700;text-transform:uppercase}
    .s-pending{background:#FFF3E0;color:#E65100} .s-confirmed{background:#E8F5E9;color:#2E7D32}
    .s-shipped{background:#E3F2FD;color:#1565C0} .s-delivered{background:#F3E5F5;color:#6A1B9A}
    .s-cancelled{background:#FFEBEE;color:#C62828}
    .p-paid{background:#E8F5E9;color:#2E7D32} .p-pending{background:#FFF3E0;color:#E65100}
    .detail-grid{display:grid;grid-template-columns:1fr 320px;gap:24px;align-items:start}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:20px;margin-bottom:16px}
    .panel-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;margin-bottom:16px}
    .items-panel .panel-title{font-size:18px}
    .order-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #F0E8D8;align-items:center}
    .order-item:last-child{border-bottom:none}
    .oi-cover{width:52px;height:72px;background:linear-gradient(135deg,#FFD6B0,#FFA875);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
    .oi-info{flex:1}
    .oi-title{font-weight:600;font-size:14px;margin-bottom:3px}
    .oi-store,.oi-qty{font-size:12px;color:#7A6855}
    .oi-price{font-weight:700;font-size:15px;color:#7A1E2E}
    .price-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0E8D8;font-size:14px}
    .price-row:last-child{border-bottom:none}
    .price-row.total{font-size:16px;font-weight:700;border-top:2px solid #E2D5BE;border-bottom:none;padding-top:12px}
    .discount span:last-child{color:#2D6A4F;font-weight:600}
    .address-block{font-size:14px;line-height:1.8;color:#1A0F00}
    .address-block strong{font-size:15px}
    .tracking-num{font-family:monospace;font-size:16px;font-weight:700;color:#E8580A;background:#FFF5EC;padding:10px;border-radius:6px}
    .cancel-section{margin-top:4px}
    .btn-cancel{width:100%;padding:11px;background:#FFEBEE;color:#C62828;border:1px solid #FFCDD2;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
    .btn-cancel:hover:not(:disabled){background:#FFCDD2}
    .btn-cancel:disabled{opacity:.6;cursor:not-allowed}
    @media(max-width:768px){.detail-grid{grid-template-columns:1fr}}
  `]
})
export class OrderDetailComponent implements OnInit {
  private orderSvc = inject(OrderService);
  private route    = inject(ActivatedRoute);
  order     = signal<Order | null>(null);
  loading   = signal(true);
  cancelling = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.orderSvc.getOrder(id).subscribe(r => { this.order.set(r.data); this.loading.set(false); });
  }

  cancelOrder() {
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;
    this.cancelling = true;
    this.orderSvc.cancelOrder(this.order()!.id, reason).subscribe({
      next: () => { this.order.update(o => o ? { ...o, status: 'cancelled' } : o); this.cancelling = false; },
      error: () => this.cancelling = false
    });
  }
}
