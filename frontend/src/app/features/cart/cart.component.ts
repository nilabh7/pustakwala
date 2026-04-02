import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/api.service';
import { Cart, CartItem } from '../../core/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">🛒 Your Cart
        <span class="item-count" *ngIf="cart()?.items?.length">({{ cart()!.items.length }} items)</span>
      </h1>
      <div class="loading-state" *ngIf="loading()">Loading cart…</div>
      <div class="empty-state" *ngIf="!loading() && !cart()?.items?.length">
        <div class="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any books yet.</p>
        <a routerLink="/books" class="btn-primary">Browse Books</a>
      </div>
      <div class="cart-layout" *ngIf="!loading() && cart()?.items?.length">
        <div class="cart-items">
          <div *ngFor="let item of cart()!.items" class="cart-item">
            <div class="item-cover" [style.background]="coverGrad(item.book_id)">📚</div>
            <div class="item-info">
              <a [routerLink]="['/books', item.slug]" class="item-title">{{ item.title }}</a>
              <div class="item-author">{{ item.authors?.join(', ') }}</div>
              <div class="item-store">Sold by: {{ item.store_name }}</div>
              <div class="item-price-row">
                <span class="item-price">₹{{ item.selling_price }}</span>
                <span class="item-mrp" *ngIf="item.mrp > item.selling_price">₹{{ item.mrp }}</span>
              </div>
            </div>
            <div class="item-controls">
              <div class="qty-controls">
                <button class="qty-btn" (click)="updateQty(item, item.quantity - 1)" [disabled]="item.quantity <= 1">−</button>
                <span class="qty-val">{{ item.quantity }}</span>
                <button class="qty-btn" (click)="updateQty(item, item.quantity + 1)" [disabled]="item.quantity >= item.stock_quantity">+</button>
              </div>
              <div class="item-total">₹{{ item.selling_price * item.quantity | number:'1.0-0' }}</div>
              <button class="remove-btn" (click)="removeItem(item)">🗑️</button>
            </div>
          </div>
        </div>
        <div class="order-summary">
          <h2 class="summary-title">Order Summary</h2>
          <div class="coupon-row">
            <input type="text" [(ngModel)]="couponCode" placeholder="Coupon code"
              class="coupon-input" [disabled]="!!appliedCoupon">
            <button class="coupon-btn" (click)="applyCoupon()" *ngIf="!appliedCoupon">Apply</button>
            <button class="coupon-btn coupon-remove" (click)="removeCoupon()" *ngIf="appliedCoupon">Remove</button>
          </div>
          <div class="coupon-success" *ngIf="appliedCoupon">
            ✅ <strong>{{ appliedCoupon.code }}</strong> — saving ₹{{ couponDiscount | number:'1.0-0' }}
          </div>
          <div class="coupon-error" *ngIf="couponError">{{ couponError }}</div>
          <div class="summary-rows">
            <div class="summary-row"><span>Subtotal</span><span>₹{{ cart()!.subtotal | number:'1.0-0' }}</span></div>
            <div class="summary-row">
              <span>Shipping</span>
              <span [class]="cart()!.shipping === 0 ? 'free' : ''">
                {{ cart()!.shipping === 0 ? 'FREE' : '₹' + cart()!.shipping }}
              </span>
            </div>
            <div class="summary-row discount" *ngIf="couponDiscount > 0">
              <span>Discount</span><span>− ₹{{ couponDiscount | number:'1.0-0' }}</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>₹{{ (cart()!.subtotal + cart()!.shipping - couponDiscount) | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="free-ship-note" *ngIf="cart()!.shipping > 0">
            Add ₹{{ 499 - cart()!.subtotal }} more for FREE delivery
          </div>
          <button class="btn-checkout" (click)="goCheckout()">Proceed to Checkout →</button>
          <a routerLink="/books" class="continue-shopping">← Continue Shopping</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container{max-width:1280px;margin:0 auto;padding:40px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:32px}
    .item-count{font-size:18px;color:#7A6855;font-weight:400;margin-left:8px}
    .loading-state{color:#7A6855;padding:60px;text-align:center}
    .empty-state{text-align:center;padding:80px 24px}
    .empty-icon{font-size:80px;margin-bottom:20px}
    .empty-state h2{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;margin-bottom:8px}
    .empty-state p{color:#7A6855;margin-bottom:24px}
    .btn-primary{background:#E8580A;color:#fff;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block}
    .cart-layout{display:grid;grid-template-columns:1fr 360px;gap:32px;align-items:start}
    .cart-items{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;overflow:hidden}
    .cart-item{display:flex;gap:16px;padding:20px 24px;border-bottom:1px solid #F0E8D8;align-items:center}
    .cart-item:last-child{border-bottom:none}
    .item-cover{width:64px;height:90px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:28px}
    .item-info{flex:1;min-width:0}
    .item-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;text-decoration:none;color:#1A0F00;display:block;margin-bottom:4px}
    .item-title:hover{color:#E8580A}
    .item-author{font-size:13px;color:#7A6855;margin-bottom:2px}
    .item-store{font-size:12px;color:#7A6855;margin-bottom:8px}
    .item-price-row{display:flex;align-items:center;gap:8px}
    .item-price{font-size:15px;font-weight:700;color:#7A1E2E}
    .item-mrp{font-size:12px;color:#7A6855;text-decoration:line-through}
    .item-controls{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
    .qty-controls{display:flex;align-items:center;gap:6px}
    .qty-btn{width:28px;height:28px;border:1.5px solid #E2D5BE;border-radius:6px;background:#F5ECD7;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .qty-btn:hover:not(:disabled){border-color:#E8580A}
    .qty-btn:disabled{opacity:.4;cursor:not-allowed}
    .qty-val{font-size:15px;font-weight:600;min-width:24px;text-align:center}
    .item-total{font-size:16px;font-weight:700}
    .remove-btn{background:none;border:none;cursor:pointer;font-size:16px;opacity:.6}
    .remove-btn:hover{opacity:1}
    .order-summary{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px;position:sticky;top:100px}
    .summary-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:20px}
    .coupon-row{display:flex;gap:8px;margin-bottom:8px}
    .coupon-input{flex:1;padding:9px 12px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:13px;background:#F5ECD7;outline:none;font-family:inherit;text-transform:uppercase}
    .coupon-input:focus{border-color:#E8580A}
    .coupon-btn{padding:9px 14px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}
    .coupon-remove{background:#FFEBEE;color:#C62828}
    .coupon-success{font-size:13px;color:#2D6A4F;background:#F0FFF4;padding:8px 12px;border-radius:6px;margin-bottom:12px}
    .coupon-error{font-size:13px;color:#C62828;background:#FFEBEE;padding:8px 12px;border-radius:6px;margin-bottom:12px}
    .summary-rows{margin:16px 0}
    .summary-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F0E8D8;font-size:14px}
    .summary-row:last-child{border-bottom:none}
    .summary-row.total{font-size:18px;font-weight:700;padding-top:14px;border-top:2px solid #E2D5BE;border-bottom:none;margin-top:4px}
    .free{color:#2D6A4F;font-weight:600}
    .free-ship-note{font-size:12px;color:#E8580A;text-align:center;background:#FFF5EC;padding:8px;border-radius:6px;margin-bottom:16px}
    .btn-checkout{width:100%;padding:14px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:12px;font-family:inherit}
    .btn-checkout:hover{background:#7A1E2E}
    .continue-shopping{display:block;text-align:center;font-size:13px;color:#E8580A;text-decoration:none;font-weight:600}
    @media(max-width:768px){.cart-layout{grid-template-columns:1fr}}
  `]
})
export class CartComponent implements OnInit {
  private cartSvc = inject(CartService);
  private router  = inject(Router);
  cart    = signal<Cart | null>(null);
  loading = signal(true);
  couponCode = ''; appliedCoupon: any = null; couponDiscount = 0; couponError = '';
  ngOnInit() { this.loadCart(); }
  loadCart() { this.cartSvc.getCart().subscribe(r => { this.cart.set(r.data); this.loading.set(false); }); }
  updateQty(item: CartItem, qty: number) { if (qty < 1) return; this.cartSvc.updateItem(item.id, qty).subscribe(() => this.loadCart()); }
  removeItem(item: CartItem) { this.cartSvc.removeItem(item.id).subscribe(() => this.loadCart()); }
  applyCoupon() {
    if (!this.couponCode.trim()) return;
    this.couponError = '';
    this.cartSvc.validateCoupon(this.couponCode.toUpperCase(), this.cart()?.subtotal || 0).subscribe({
      next: (r: any) => { this.appliedCoupon = r.data.coupon; this.couponDiscount = r.data.discount_amount; },
      error: (err) => { this.couponError = err.error?.message || 'Invalid coupon'; }
    });
  }
  removeCoupon() { this.appliedCoupon = null; this.couponDiscount = 0; this.couponCode = ''; this.couponError = ''; }
  goCheckout() {
    this.router.navigate(['/checkout'], this.appliedCoupon ? { state: { coupon: this.appliedCoupon.code, discount: this.couponDiscount } } : {});
  }
  coverGrad(id: string): string {
    const g = ['linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)','linear-gradient(135deg,#B5FFCA,#5FC97E)','linear-gradient(135deg,#FFB5C8,#FF6B8A)','linear-gradient(135deg,#FFEDB5,#FFD460)'];
    return g[(parseInt(id?.replace(/-/g,'').slice(0,4)||'0',16)) % g.length];
  }
}
