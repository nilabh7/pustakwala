import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, OrderService, AddressService } from '../../core/services/api.service';
import { Cart, CartItem, Order, Address } from '../../core/models';

// ── CART ──────────────────────────────────────────────────────
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-wrap">
      <h1 class="page-title">🛒 Shopping Cart</h1>
      <div class="cart-layout" *ngIf="cart && cart.items.length; else empty">
        <div class="cart-items">
          <div class="cart-item" *ngFor="let item of cart.items">
            <div class="ci-cover" [style.background]="bg(item.book_id)">📖</div>
            <div class="ci-info">
              <a [routerLink]="['/books', item.slug]" class="ci-title">{{ item.title }}</a>
              <div class="ci-author">{{ item.authors?.join(', ') }}</div>
              <div class="ci-store">{{ item.store_name }}</div>
              <div class="ci-price-row">
                <span class="ci-price">₹{{ item.selling_price | number:'1.0-0' }}</span>
                <span class="ci-mrp" *ngIf="item.mrp>item.selling_price">₹{{ item.mrp | number:'1.0-0' }}</span>
              </div>
            </div>
            <div class="ci-actions">
              <div class="qty-ctrl">
                <button (click)="updateQty(item, item.quantity-1)">−</button>
                <span>{{ item.quantity }}</span>
                <button (click)="updateQty(item, item.quantity+1)">+</button>
              </div>
              <div class="ci-total">₹{{ (item.selling_price * item.quantity) | number:'1.0-0' }}</div>
              <button class="remove-btn" (click)="removeItem(item)">🗑️</button>
            </div>
          </div>
        </div>

        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="sum-row"><span>Subtotal ({{ cart.items.length }} items)</span><span>₹{{ cart.subtotal | number:'1.0-0' }}</span></div>
          <div class="sum-row"><span>Shipping</span><span [class.free]="cart.shipping===0">{{ cart.shipping===0 ? 'FREE' : '₹'+cart.shipping }}</span></div>
          <div class="sum-row coupon-row">
            <input placeholder="Coupon code" [(ngModel)]="couponCode" class="coupon-input">
            <button class="apply-btn" (click)="applyCoupon()">Apply</button>
          </div>
          <div class="sum-row discount-row" *ngIf="discount>0">
            <span>Discount</span><span class="disc">−₹{{ discount | number:'1.0-0' }}</span>
          </div>
          <div class="sum-divider"></div>
          <div class="sum-row total-row">
            <span>Total</span>
            <span>₹{{ (cart.subtotal + cart.shipping - discount) | number:'1.0-0' }}</span>
          </div>
          <div class="savings-tag" *ngIf="totalSavings()>0">
            🎉 You save ₹{{ totalSavings() | number:'1.0-0' }} on this order!
          </div>
          <a routerLink="/checkout" class="checkout-btn">Proceed to Checkout →</a>
          <a routerLink="/books" class="continue-btn">← Continue Shopping</a>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-cart">
          <span>🛒</span>
          <h2>Your cart is empty</h2>
          <p>Discover great books and add them to your cart!</p>
          <a routerLink="/books" class="btn-primary">Browse Books</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:28px}
    .cart-layout{display:grid;grid-template-columns:1fr 320px;gap:28px;align-items:flex-start}
    .cart-items{display:flex;flex-direction:column;gap:0}
    .cart-item{display:flex;gap:16px;padding:20px;background:#FFFBF4;border:1px solid #E2D5BE;border-bottom:none;align-items:flex-start}
    .cart-item:first-child{border-radius:12px 12px 0 0}
    .cart-item:last-child{border-bottom:1px solid #E2D5BE;border-radius:0 0 12px 12px}
    .ci-cover{width:72px;height:96px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0}
    .ci-info{flex:1;min-width:0}
    .ci-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;text-decoration:none;color:#1A0F00;display:block;margin-bottom:4px}
    .ci-title:hover{color:#E8580A}
    .ci-author{font-size:12px;color:#7A6855;margin-bottom:2px}
    .ci-store{font-size:11px;color:#7A6855;margin-bottom:8px}
    .ci-price-row{display:flex;align-items:center;gap:8px}
    .ci-price{font-size:16px;font-weight:700;color:#7A1E2E}
    .ci-mrp{font-size:12px;color:#7A6855;text-decoration:line-through}
    .ci-actions{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
    .qty-ctrl{display:flex;align-items:center;gap:8px;border:1.5px solid #E2D5BE;border-radius:8px;overflow:hidden}
    .qty-ctrl button{width:32px;height:32px;border:none;background:#F5ECD7;cursor:pointer;font-size:16px;transition:.2s}
    .qty-ctrl button:hover{background:#E8580A;color:#fff}
    .qty-ctrl span{min-width:32px;text-align:center;font-size:14px;font-weight:600}
    .ci-total{font-size:16px;font-weight:700;color:#1A0F00}
    .remove-btn{background:none;border:none;cursor:pointer;font-size:18px;opacity:.6;transition:.2s}
    .remove-btn:hover{opacity:1}
    .cart-summary{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px;position:sticky;top:140px}
    .cart-summary h3{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:20px}
    .sum-row{display:flex;justify-content:space-between;font-size:14px;margin-bottom:14px;align-items:center}
    .free{color:#2D6A4F;font-weight:700}
    .disc{color:#2D6A4F;font-weight:700}
    .coupon-row{gap:8px}
    .coupon-input{flex:1;padding:8px 10px;border:1.5px solid #E2D5BE;border-radius:6px;font-size:13px;outline:none;font-family:inherit}
    .coupon-input:focus{border-color:#E8580A}
    .apply-btn{padding:8px 14px;background:#E8580A;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
    .sum-divider{border-top:2px solid #E2D5BE;margin:8px 0 14px}
    .total-row{font-size:18px;font-weight:700}
    .savings-tag{background:#E8F5E9;color:#276749;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;margin-bottom:14px;text-align:center}
    .checkout-btn{display:block;width:100%;padding:14px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;margin-bottom:10px;box-sizing:border-box;transition:.2s}
    .checkout-btn:hover{background:#7A1E2E}
    .continue-btn{display:block;text-align:center;font-size:13px;color:#E8580A;text-decoration:none}
    .empty-cart{text-align:center;padding:80px 20px}
    .empty-cart span{font-size:80px;display:block;margin-bottom:16px}
    .empty-cart h2{font-family:'Playfair Display',serif;font-size:24px;margin-bottom:8px}
    .empty-cart p{color:#7A6855;margin-bottom:24px}
    .btn-primary{display:inline-block;padding:12px 28px;background:#E8580A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700}
    @media(max-width:768px){.cart-layout{grid-template-columns:1fr}}
  `]
})
export class CartComponent implements OnInit {
  cartSvc = inject(CartService);
  cart: Cart | null = null;
  couponCode = ''; discount = 0;

  bgs = ['linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)',
         'linear-gradient(135deg,#B5FFCA,#5FC97E)','linear-gradient(135deg,#FFB5C8,#FF6B8A)'];
  bg(id: string) { return this.bgs[(id?.charCodeAt(0)||0)%this.bgs.length]; }

  ngOnInit() { this.loadCart(); }

  loadCart() {
    this.cartSvc.getCart().subscribe(r => this.cart = r.data);
  }

  updateQty(item: CartItem, qty: number) {
    if (qty < 1) { this.removeItem(item); return; }
    this.cartSvc.updateItem(item.id, qty).subscribe(() => this.loadCart());
  }

  removeItem(item: CartItem) {
    this.cartSvc.removeItem(item.id).subscribe(() => this.loadCart());
  }

  applyCoupon() {
    if (!this.couponCode || !this.cart) return;
    this.cartSvc.validateCoupon(this.couponCode, this.cart.subtotal).subscribe({
      next: (r: any) => this.discount = r.data.discount_amount,
      error: err => alert(err.error?.message || 'Invalid coupon')
    });
  }

  totalSavings() {
    if (!this.cart) return 0;
    return this.cart.items.reduce((s, i) => s + (i.mrp - i.selling_price) * i.quantity, 0) + this.discount;
  }
}

// ── WISHLIST ──────────────────────────────────────────────────
@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap">
      <h1 class="page-title">❤️ My Wishlist</h1>
      <div class="books-grid" *ngIf="items.length; else empty">
        <div class="wish-card" *ngFor="let item of items">
          <a [routerLink]="['/books', item.slug]" class="wc-cover" [style.background]="bg(item.book_id)">📖</a>
          <div class="wc-info">
            <a [routerLink]="['/books', item.slug]" class="wc-title">{{ item.title }}</a>
            <div class="wc-author">{{ item.authors?.join(', ') }}</div>
            <div class="wc-price">
              <span class="pn">₹{{ item.selling_price | number:'1.0-0' }}</span>
              <span class="pm" *ngIf="item.mrp>item.selling_price">₹{{ item.mrp | number:'1.0-0' }}</span>
            </div>
            <div class="wc-btns">
              <button class="add-btn" (click)="addToCart(item)">Add to Cart</button>
              <button class="rem-btn" (click)="remove(item)">Remove</button>
            </div>
          </div>
        </div>
      </div>
      <ng-template #empty>
        <div class="empty"><span>🤍</span><h2>Wishlist is empty</h2>
          <a routerLink="/books" class="btn-primary">Discover Books</a></div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:1280px;margin:0 auto;padding:32px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:24px}
    .books-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
    .wish-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:10px;overflow:hidden;transition:.2s}
    .wish-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.1);border-color:#E8580A}
    .wc-cover{height:180px;display:flex;align-items:center;justify-content:center;font-size:48px;text-decoration:none;display:block}
    .wc-info{padding:12px 14px 14px}
    .wc-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;text-decoration:none;color:#1A0F00;display:block;margin-bottom:4px}
    .wc-author{font-size:12px;color:#7A6855;margin-bottom:8px}
    .wc-price{display:flex;gap:8px;align-items:center;margin-bottom:10px}
    .pn{font-size:16px;font-weight:700;color:#7A1E2E}
    .pm{font-size:12px;color:#7A6855;text-decoration:line-through}
    .wc-btns{display:flex;gap:8px}
    .add-btn{flex:1;padding:7px;background:#E8580A;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
    .rem-btn{padding:7px 10px;background:transparent;border:1.5px solid #E2D5BE;color:#7A6855;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit}
    .rem-btn:hover{border-color:#E8580A;color:#E8580A}
    .empty{text-align:center;padding:80px 20px}
    .empty span{font-size:64px;display:block;margin-bottom:16px}
    .empty h2{font-family:'Playfair Display',serif;font-size:22px;margin-bottom:20px}
    .btn-primary{display:inline-block;padding:12px 28px;background:#E8580A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700}
  `]
})
export class WishlistComponent implements OnInit {
  cartSvc = inject(CartService);
  items: any[] = [];
  bgs = ['linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)',
         'linear-gradient(135deg,#B5FFCA,#5FC97E)','linear-gradient(135deg,#FFB5C8,#FF6B8A)'];
  bg(id: string) { return this.bgs[(id?.charCodeAt(0)||0)%this.bgs.length]; }
  ngOnInit() { this.cartSvc.getWishlist().subscribe(r => this.items = r.data || []); }
  remove(item: any) {
    this.cartSvc.toggleWishlist(item.book_id).subscribe(() =>
      this.items = this.items.filter(i => i.book_id !== item.book_id)
    );
  }
  addToCart(item: any) { this.cartSvc.addToCart(item.book_id).subscribe(); }
}

// ── ORDERS LIST ───────────────────────────────────────────────
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap">
      <h1 class="page-title">📦 My Orders</h1>
      <div class="orders-list" *ngIf="orders.length; else empty">
        <div class="order-card" *ngFor="let o of orders">
          <div class="oc-header">
            <div>
              <div class="order-num">#{{ o.order_number }}</div>
              <div class="order-date">{{ o.created_at | date:'mediumDate' }}</div>
            </div>
            <div class="status-badge" [class]="'st-'+o.status">{{ o.status | titlecase }}</div>
            <div class="order-total">₹{{ o.total_amount | number:'1.0-0' }}</div>
            <a [routerLink]="['/orders', o.id]" class="view-btn">View Details →</a>
          </div>
          <div class="oc-items">
            <div class="oi-thumb" *ngFor="let item of o.items?.slice(0,3)">
              <div class="oi-cover" [style.background]="bg(item.book_id||'')">📖</div>
              <div class="oi-title">{{ item.title }}</div>
            </div>
            <div class="oi-more" *ngIf="(o.items?.length ?? 0) > 3">+{{ (o.items?.length ?? 0) - 3 }} more</div>
          </div>
        </div>
      </div>
      <ng-template #empty>
        <div class="empty"><span>📦</span><h2>No orders yet</h2>
          <a routerLink="/books" class="btn-primary">Start Shopping</a></div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:900px;margin:0 auto;padding:32px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:24px}
    .orders-list{display:flex;flex-direction:column;gap:16px}
    .order-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    .oc-header{display:flex;align-items:center;gap:16px;padding:16px 20px;flex-wrap:wrap}
    .order-num{font-weight:700;font-size:15px;color:#1A0F00}
    .order-date{font-size:12px;color:#7A6855;margin-top:2px}
    .status-badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:capitalize}
    .st-confirmed,.st-processing{background:#FFF3CD;color:#856404}
    .st-shipped{background:#CCE5FF;color:#004085}
    .st-delivered{background:#D4EDDA;color:#155724}
    .st-cancelled,.st-refunded{background:#F8D7DA;color:#721C24}
    .st-pending{background:#E2E3E5;color:#383D41}
    .order-total{font-size:18px;font-weight:700;color:#7A1E2E;margin-left:auto}
    .view-btn{padding:7px 14px;background:transparent;border:1.5px solid #E8580A;color:#E8580A;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;transition:.2s}
    .view-btn:hover{background:#E8580A;color:#fff}
    .oc-items{display:flex;gap:12px;padding:12px 20px;border-top:1px solid #E2D5BE;background:#FDF6EC;overflow:hidden}
    .oi-thumb{display:flex;gap:8px;align-items:center}
    .oi-cover{width:40px;height:52px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .oi-title{font-size:12px;font-weight:600;max-width:100px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .oi-more{font-size:12px;color:#7A6855;align-self:center}
    .empty{text-align:center;padding:80px 20px}
    .empty span{font-size:64px;display:block;margin-bottom:16px}
    .empty h2{font-family:'Playfair Display',serif;font-size:22px;margin-bottom:20px}
    .btn-primary{display:inline-block;padding:12px 28px;background:#E8580A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700}
  `]
})
export class OrdersComponent implements OnInit {
  orderSvc = inject(OrderService);
  orders: Order[] = [];
  bgs = ['linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)','linear-gradient(135deg,#B5FFCA,#5FC97E)'];
  bg(id: string) { return this.bgs[(id?.charCodeAt(0)||0)%this.bgs.length]; }
  ngOnInit() { this.orderSvc.getMyOrders().subscribe(r => this.orders = r.data || []); }
}

// ── ORDER DETAIL ──────────────────────────────────────────────
@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap" *ngIf="order; else loading">
      <div class="od-header">
        <div>
          <a routerLink="/orders" class="back-link">← My Orders</a>
          <h1 class="page-title">Order #{{ order.order_number }}</h1>
          <div class="od-date">Placed on {{ order.created_at | date:'long' }}</div>
        </div>
        <div class="status-badge" [class]="'st-'+order.status">{{ order.status | titlecase }}</div>
      </div>

      <div class="od-grid">
        <div class="od-items">
          <h3>Items Ordered</h3>
          <div class="od-item" *ngFor="let item of order.items">
            <div class="odi-cover" [style.background]="bg(item.book_id||'')">📖</div>
            <div class="odi-info">
              <div class="odi-title">{{ item.title }}</div>
              <div class="odi-meta">Qty: {{ item.quantity }} × ₹{{ item.unit_price | number:'1.0-0' }}</div>
              <div class="odi-store" *ngIf="item.store_name">{{ item.store_name }}</div>
            </div>
            <div class="odi-total">₹{{ item.total_price | number:'1.0-0' }}</div>
          </div>
        </div>

        <div class="od-sidebar">
          <div class="od-box">
            <h4>Price Details</h4>
            <div class="pd-row"><span>Subtotal</span><span>₹{{ order.subtotal | number:'1.0-0' }}</span></div>
            <div class="pd-row"><span>Shipping</span><span>{{ order.shipping_charge===0 ? 'FREE':'₹'+order.shipping_charge }}</span></div>
            <div class="pd-row" *ngIf="order.discount_amount>0"><span>Discount</span><span class="disc">−₹{{ order.discount_amount | number:'1.0-0' }}</span></div>
            <div class="pd-divider"></div>
            <div class="pd-row pd-total"><span>Total</span><span>₹{{ order.total_amount | number:'1.0-0' }}</span></div>
            <div class="pd-row"><span>Payment</span><span>{{ order.payment_method | titlecase }}</span></div>
          </div>
          <div class="od-box" *ngIf="order.shipping_address_snapshot">
            <h4>Delivery Address</h4>
            <div class="addr-text">
              <strong>{{ order.shipping_address_snapshot.full_name }}</strong><br>
              {{ order.shipping_address_snapshot.address_line1 }}<br>
              <span *ngIf="order.shipping_address_snapshot.address_line2">{{ order.shipping_address_snapshot.address_line2 }}<br></span>
              {{ order.shipping_address_snapshot.city }}, {{ order.shipping_address_snapshot.state }} – {{ order.shipping_address_snapshot.pincode }}<br>
              📞 {{ order.shipping_address_snapshot.phone }}
            </div>
          </div>
          <div class="od-box" *ngIf="order.tracking_number">
            <h4>Tracking</h4>
            <div class="track-num">{{ order.tracking_number }}</div>
          </div>
          <button class="cancel-btn" *ngIf="canCancel()" (click)="cancelOrder()">Cancel Order</button>
        </div>
      </div>
    </div>
    <ng-template #loading><div class="loading-page"><div class="spinner"></div></div></ng-template>
  `,
  styles: [`
    .page-wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    .od-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:12px}
    .back-link{font-size:13px;color:#E8580A;text-decoration:none;display:block;margin-bottom:8px}
    .page-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin-bottom:4px}
    .od-date{font-size:13px;color:#7A6855}
    .status-badge{padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700}
    .st-confirmed,.st-processing{background:#FFF3CD;color:#856404}
    .st-shipped{background:#CCE5FF;color:#004085}
    .st-delivered{background:#D4EDDA;color:#155724}
    .st-cancelled,.st-refunded{background:#F8D7DA;color:#721C24}
    .st-pending{background:#E2E3E5;color:#383D41}
    .od-grid{display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:flex-start}
    h3{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:16px}
    .od-items{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:20px}
    .od-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #E2D5BE;align-items:center}
    .od-item:last-child{border-bottom:none}
    .odi-cover{width:56px;height:72px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
    .odi-info{flex:1}
    .odi-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;margin-bottom:4px}
    .odi-meta{font-size:12px;color:#7A6855}
    .odi-store{font-size:11px;color:#7A6855;margin-top:2px}
    .odi-total{font-size:15px;font-weight:700;color:#7A1E2E}
    .od-box{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:18px;margin-bottom:14px}
    .od-box h4{font-size:14px;font-weight:700;margin-bottom:12px;color:#1A0F00}
    .pd-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px}
    .disc{color:#2D6A4F;font-weight:700}
    .pd-divider{border-top:2px solid #E2D5BE;margin:8px 0}
    .pd-total{font-size:16px;font-weight:700}
    .addr-text{font-size:13px;line-height:1.8;color:#3D2B1F}
    .track-num{font-size:14px;font-weight:700;color:#E8580A;font-family:monospace}
    .cancel-btn{width:100%;padding:12px;background:transparent;border:1.5px solid #C0392B;color:#C0392B;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:.2s}
    .cancel-btn:hover{background:#C0392B;color:#fff}
    .loading-page{display:flex;justify-content:center;align-items:center;min-height:60vh}
    .spinner{width:40px;height:40px;border:3px solid #E2D5BE;border-top-color:#E8580A;border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:768px){.od-grid{grid-template-columns:1fr}}
  `]
})
export class OrderDetailComponent implements OnInit {
  orderSvc = inject(OrderService);
  route    = inject(ActivatedRoute);
  router   = inject(Router);
  order: Order | null = null;
  bgs = ['linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)','linear-gradient(135deg,#B5FFCA,#5FC97E)'];
  bg(id: string) { return this.bgs[(id?.charCodeAt(0)||0)%this.bgs.length]; }
  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.orderSvc.getOrder(p['id']).subscribe(r => this.order = r.data);
    });
  }
  canCancel() { return this.order && ['pending','confirmed'].includes(this.order.status); }
  cancelOrder() {
    if (!confirm('Cancel this order?')) return;
    this.orderSvc.cancelOrder(this.order!.id, 'Cancelled by customer').subscribe(() => {
      this.order!.status = 'cancelled';
    });
  }
}

// ── PROFILE ───────────────────────────────────────────────────
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrap">
      <h1 class="page-title">👤 My Profile</h1>
      <div class="profile-grid">
        <div class="profile-card">
          <div class="avatar">{{ initials }}</div>
          <h2 class="profile-name">{{ form.first_name }} {{ form.last_name }}</h2>
          <div class="profile-email">{{ form.email }}</div>
        </div>
        <div class="form-card">
          <h3>Edit Profile</h3>
          <div class="success-msg" *ngIf="saved">✅ Profile updated successfully!</div>
          <div class="form-row-2">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="form.first_name" name="first_name">
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="form.last_name" name="last_name">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="form.email" name="email" disabled class="disabled">
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" [(ngModel)]="form.phone" name="phone" placeholder="9876543210">
          </div>
          <button class="save-btn" (click)="saveProfile()">Save Changes</button>

          <h3 style="margin-top:24px">Quick Links</h3>
          <div class="quick-links">
            <a routerLink="/orders">📦 My Orders</a>
            <a routerLink="/wishlist">❤️ Wishlist</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap{max-width:900px;margin:0 auto;padding:32px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:24px}
    .profile-grid{display:grid;grid-template-columns:240px 1fr;gap:24px;align-items:flex-start}
    .profile-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:32px 20px;text-align:center}
    .avatar{width:80px;height:80px;border-radius:50%;background:#E8580A;color:#fff;font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
    .profile-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:6px}
    .profile-email{font-size:13px;color:#7A6855}
    .form-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px}
    .form-card h3{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:18px}
    .success-msg{background:#E8F5E9;color:#276749;border:1px solid #9AE6B4;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px}
    .form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .form-group{margin-bottom:16px}
    .form-group label{display:block;font-size:13px;font-weight:600;color:#1A0F00;margin-bottom:5px}
    .form-group input{width:100%;padding:10px 13px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#fff;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box}
    .form-group input:focus{border-color:#E8580A}
    .disabled{background:#F5ECD7 !important;color:#7A6855}
    .save-btn{padding:11px 28px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:.2s}
    .save-btn:hover{background:#7A1E2E}
    .quick-links{display:flex;gap:12px;flex-wrap:wrap}
    .quick-links a{padding:10px 18px;background:#F5ECD7;border:1px solid #E2D5BE;border-radius:8px;text-decoration:none;color:#1A0F00;font-size:14px;font-weight:500;transition:.2s}
    .quick-links a:hover{border-color:#E8580A;color:#E8580A}
    @media(max-width:600px){.profile-grid{grid-template-columns:1fr}}
  `]
})
export class ProfileComponent implements OnInit {
  private userSvc = inject(UserService);
  private authSvc = inject(AuthService);
  form: any = {};
  saved = false;
  get initials() { return `${this.form.first_name?.[0]||''}${this.form.last_name?.[0]||''}`; }
  ngOnInit() {
    const u = this.authSvc.currentUser();
    if (u) this.form = { first_name: u.first_name, last_name: u.last_name, email: u.email, phone: '' };
  }
  saveProfile() {
    this.userSvc.updateProfile(this.form).subscribe(() => { this.saved = true; setTimeout(()=>this.saved=false,3000); });
  }
}

import { UserService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';