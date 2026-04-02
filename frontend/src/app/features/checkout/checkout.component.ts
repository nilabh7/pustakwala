import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CartService, AddressService, OrderService } from '../../core/services/api.service';
import { Cart, Address } from '../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="checkout-wrap">
      <h1 class="page-title">🛒 Checkout</h1>

      <!-- STEPS -->
      <div class="steps">
        <div class="step" [class.active]="step>=1" [class.done]="step>1">
          <span class="step-num">1</span><span class="step-lbl">Address</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step>=2" [class.done]="step>2">
          <span class="step-num">2</span><span class="step-lbl">Payment</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step>=3">
          <span class="step-num">3</span><span class="step-lbl">Confirm</span>
        </div>
      </div>

      <div class="checkout-grid">
        <!-- LEFT PANEL -->
        <div class="checkout-main">

          <!-- STEP 1: ADDRESS -->
          <div class="checkout-section" *ngIf="step===1">
            <h2>Delivery Address</h2>
            <div class="addresses" *ngIf="addresses.length">
              <div class="addr-card" *ngFor="let a of addresses"
                [class.selected]="selectedAddressId===a.id" (click)="selectedAddressId=a.id">
                <div class="addr-radio">
                  <input type="radio" [value]="a.id" [(ngModel)]="selectedAddressId" name="addr">
                </div>
                <div class="addr-body">
                  <div class="addr-name">{{ a.full_name }} <span class="addr-type">{{ a.type }}</span>
                    <span class="default-badge" *ngIf="a.is_default">Default</span>
                  </div>
                  <div class="addr-line">{{ a.address_line1 }}</div>
                  <div class="addr-line" *ngIf="a.address_line2">{{ a.address_line2 }}</div>
                  <div class="addr-line">{{ a.city }}, {{ a.state }} – {{ a.pincode }}</div>
                  <div class="addr-phone">📞 {{ a.phone }}</div>
                </div>
              </div>
            </div>

            <!-- Add New Address Form -->
            <div class="add-addr-toggle">
              <button class="add-addr-btn" (click)="showAddAddr=!showAddAddr">
                {{ showAddAddr ? '✕ Cancel' : '+ Add New Address' }}
              </button>
            </div>
            <div class="new-addr-form" *ngIf="showAddAddr">
              <div class="form-row-2">
                <div class="form-group">
                  <label>Full Name *</label>
                  <input type="text" [(ngModel)]="newAddr.full_name" placeholder="Arjun Sharma">
                </div>
                <div class="form-group">
                  <label>Phone *</label>
                  <input type="tel" [(ngModel)]="newAddr.phone" placeholder="9876543210">
                </div>
              </div>
              <div class="form-group">
                <label>Address Line 1 *</label>
                <input type="text" [(ngModel)]="newAddr.address_line1" placeholder="House no, Street, Area">
              </div>
              <div class="form-group">
                <label>Address Line 2</label>
                <input type="text" [(ngModel)]="newAddr.address_line2" placeholder="Landmark (optional)">
              </div>
              <div class="form-row-3">
                <div class="form-group">
                  <label>City *</label>
                  <input type="text" [(ngModel)]="newAddr.city" placeholder="Mumbai">
                </div>
                <div class="form-group">
                  <label>State *</label>
                  <input type="text" [(ngModel)]="newAddr.state" placeholder="Maharashtra">
                </div>
                <div class="form-group">
                  <label>Pincode *</label>
                  <input type="text" [(ngModel)]="newAddr.pincode" placeholder="400001" maxlength="6">
                </div>
              </div>
              <div class="form-group">
                <label class="check-label">
                  <input type="checkbox" [(ngModel)]="newAddr.is_default"> Set as default address
                </label>
              </div>
              <button class="save-addr-btn" (click)="saveAddress()">Save Address</button>
            </div>

            <button class="next-btn" [disabled]="!selectedAddressId" (click)="step=2">
              Continue to Payment →
            </button>
          </div>

          <!-- STEP 2: PAYMENT -->
          <div class="checkout-section" *ngIf="step===2">
            <h2>Payment Method</h2>
            <div class="pay-methods">
              <label class="pay-opt" *ngFor="let pm of paymentMethods" [class.selected]="paymentMethod===pm.val">
                <input type="radio" [value]="pm.val" [(ngModel)]="paymentMethod" name="pm">
                <span class="pm-icon">{{ pm.icon }}</span>
                <div>
                  <div class="pm-name">{{ pm.name }}</div>
                  <div class="pm-desc">{{ pm.desc }}</div>
                </div>
              </label>
            </div>

            <div class="coupon-row">
              <label>Have a coupon?</label>
              <div class="coupon-input-row">
                <input type="text" [(ngModel)]="couponCode" placeholder="Enter coupon code" class="coupon-input">
                <button class="apply-btn" (click)="applyCoupon()">Apply</button>
              </div>
              <div class="coupon-success" *ngIf="couponDiscount>0">
                ✅ Coupon applied! You save ₹{{ couponDiscount | number:'1.0-0' }}
              </div>
            </div>

            <div class="form-group" style="margin-top:16px">
              <label>Order Notes (optional)</label>
              <textarea [(ngModel)]="notes" placeholder="Any special instructions…" rows="2" class="notes-ta"></textarea>
            </div>

            <div class="nav-btns">
              <button class="back-btn" (click)="step=1">← Back</button>
              <button class="next-btn" [disabled]="!paymentMethod" (click)="step=3">
                Review Order →
              </button>
            </div>
          </div>

          <!-- STEP 3: REVIEW & CONFIRM -->
          <div class="checkout-section" *ngIf="step===3">
            <h2>Review Your Order</h2>
            <div class="review-addr" *ngIf="selectedAddress">
              <div class="review-label">📍 Delivering to:</div>
              <div class="review-val">
                {{ selectedAddress.full_name }}, {{ selectedAddress.address_line1 }},
                {{ selectedAddress.city }}, {{ selectedAddress.state }} – {{ selectedAddress.pincode }}
              </div>
            </div>
            <div class="review-pay">
              <div class="review-label">💳 Payment:</div>
              <div class="review-val">{{ selectedPM?.name }}</div>
            </div>
            <div class="review-items" *ngIf="cart">
              <div class="ri-item" *ngFor="let item of cart.items">
                <span class="ri-title">{{ item.title }}</span>
                <span class="ri-qty">×{{ item.quantity }}</span>
                <span class="ri-price">₹{{ (item.selling_price*item.quantity) | number:'1.0-0' }}</span>
              </div>
            </div>
            <div class="error-msg" *ngIf="orderError">{{ orderError }}</div>
            <div class="nav-btns">
              <button class="back-btn" (click)="step=2">← Back</button>
              <button class="place-btn" [disabled]="placing" (click)="placeOrder()">
                {{ placing ? 'Placing Order…' : '✅ Place Order' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ORDER SUMMARY SIDEBAR -->
        <div class="order-summary" *ngIf="cart">
          <h3>Order Summary</h3>
          <div class="os-items">
            <div class="os-item" *ngFor="let item of cart.items">
              <div class="osi-title">{{ item.title }} <span class="osi-qty">×{{ item.quantity }}</span></div>
              <div class="osi-price">₹{{ (item.selling_price*item.quantity) | number:'1.0-0' }}</div>
            </div>
          </div>
          <div class="os-divider"></div>
          <div class="os-row"><span>Subtotal</span><span>₹{{ cart.subtotal | number:'1.0-0' }}</span></div>
          <div class="os-row"><span>Shipping</span>
            <span [class.free]="cart.shipping===0">{{ cart.shipping===0 ? 'FREE' : '₹'+cart.shipping }}</span>
          </div>
          <div class="os-row" *ngIf="couponDiscount>0">
            <span>Discount</span><span class="disc">−₹{{ couponDiscount | number:'1.0-0' }}</span>
          </div>
          <div class="os-divider"></div>
          <div class="os-row os-total">
            <span>Total</span>
            <span>₹{{ grandTotal() | number:'1.0-0' }}</span>
          </div>
          <div class="secure-tag">🔒 100% Secure Checkout</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:28px}
    .steps{display:flex;align-items:center;margin-bottom:36px;max-width:400px}
    .step{display:flex;align-items:center;gap:8px;flex-shrink:0}
    .step-num{width:30px;height:30px;border-radius:50%;border:2px solid #E2D5BE;background:#FFFBF4;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#7A6855;transition:.3s}
    .step-lbl{font-size:13px;font-weight:600;color:#7A6855;transition:.3s}
    .step.active .step-num{background:#E8580A;border-color:#E8580A;color:#fff}
    .step.active .step-lbl{color:#E8580A}
    .step.done .step-num{background:#2D6A4F;border-color:#2D6A4F;color:#fff}
    .step-line{flex:1;height:2px;background:#E2D5BE;margin:0 8px}
    .checkout-grid{display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:flex-start}
    .checkout-section{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px}
    .checkout-section h2{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:20px}
    .addresses{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
    .addr-card{border:1.5px solid #E2D5BE;border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;gap:12px;transition:.2s}
    .addr-card:hover,.addr-card.selected{border-color:#E8580A;background:#FFF8F5}
    .addr-radio input{accent-color:#E8580A;margin-top:3px}
    .addr-name{font-size:14px;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px}
    .addr-type{background:#F5ECD7;color:#7A6855;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:capitalize}
    .default-badge{background:#E8F5E9;color:#276749;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}
    .addr-line{font-size:13px;color:#3D2B1F;line-height:1.6}
    .addr-phone{font-size:12px;color:#7A6855;margin-top:4px}
    .add-addr-btn{background:transparent;border:1.5px dashed #E8580A;color:#E8580A;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;font-family:inherit}
    .add-addr-btn:hover{background:#FFF0E6}
    .new-addr-form{background:#F5ECD7;border-radius:10px;padding:20px;margin-top:16px}
    .form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
    .form-group{margin-bottom:14px}
    .form-group label{display:block;font-size:12px;font-weight:600;color:#1A0F00;margin-bottom:4px}
    .form-group input,.notes-ta{width:100%;padding:9px 12px;border:1.5px solid #E2D5BE;border-radius:7px;font-size:13px;background:#fff;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box}
    .form-group input:focus,.notes-ta:focus{border-color:#E8580A}
    .notes-ta{resize:vertical}
    .check-label{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer}
    .check-label input{accent-color:#E8580A;width:15px;height:15px}
    .save-addr-btn{padding:9px 20px;background:#E8580A;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
    .next-btn{display:block;width:100%;padding:14px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:20px;font-family:inherit;transition:.2s}
    .next-btn:hover:not(:disabled){background:#7A1E2E}
    .next-btn:disabled{opacity:.5;cursor:not-allowed}
    .pay-methods{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
    .pay-opt{display:flex;align-items:center;gap:14px;border:1.5px solid #E2D5BE;border-radius:10px;padding:14px 16px;cursor:pointer;transition:.2s}
    .pay-opt.selected{border-color:#E8580A;background:#FFF8F5}
    .pay-opt input{accent-color:#E8580A}
    .pm-icon{font-size:24px;flex-shrink:0}
    .pm-name{font-size:14px;font-weight:700}
    .pm-desc{font-size:12px;color:#7A6855}
    .coupon-row{border:1px solid #E2D5BE;border-radius:10px;padding:14px;background:#F5ECD7}
    .coupon-row label{font-size:13px;font-weight:600;display:block;margin-bottom:8px}
    .coupon-input-row{display:flex;gap:8px}
    .coupon-input{flex:1;padding:9px 12px;border:1.5px solid #E2D5BE;border-radius:7px;font-size:13px;outline:none;font-family:inherit}
    .coupon-input:focus{border-color:#E8580A}
    .apply-btn{padding:9px 16px;background:#E8580A;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
    .coupon-success{font-size:13px;color:#276749;font-weight:600;margin-top:8px}
    .nav-btns{display:flex;gap:12px;margin-top:20px}
    .back-btn{padding:13px 24px;background:transparent;border:1.5px solid #E2D5BE;color:#7A6855;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:.2s}
    .back-btn:hover{border-color:#7A6855;color:#1A0F00}
    .review-addr,.review-pay{display:flex;gap:10px;margin-bottom:14px;font-size:14px}
    .review-label{font-weight:700;flex-shrink:0}
    .review-val{color:#3D2B1F}
    .review-items{border:1px solid #E2D5BE;border-radius:8px;overflow:hidden;margin-bottom:16px}
    .ri-item{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #E2D5BE;gap:8px}
    .ri-item:last-child{border-bottom:none}
    .ri-title{flex:1;font-size:13px;font-weight:600}
    .ri-qty{font-size:12px;color:#7A6855}
    .ri-price{font-size:14px;font-weight:700;color:#7A1E2E}
    .error-msg{background:#FFF0F0;color:#C0392B;border:1px solid #FFCDD2;border-radius:8px;padding:10px;margin-bottom:12px;font-size:13px}
    .place-btn{flex:1;padding:14px;background:#2D6A4F;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:.2s}
    .place-btn:hover:not(:disabled){background:#1B4332}
    .place-btn:disabled{opacity:.6;cursor:not-allowed}
    .order-summary{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:22px;position:sticky;top:140px}
    .order-summary h3{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:16px}
    .os-items{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
    .os-item{display:flex;justify-content:space-between;gap:8px;font-size:13px}
    .osi-title{flex:1;color:#3D2B1F}
    .osi-qty{color:#7A6855;font-size:11px}
    .osi-price{font-weight:700;color:#7A1E2E;flex-shrink:0}
    .os-divider{border-top:1.5px solid #E2D5BE;margin:10px 0}
    .os-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px}
    .os-total{font-size:17px;font-weight:700;margin-top:4px}
    .free{color:#2D6A4F;font-weight:700}
    .disc{color:#2D6A4F;font-weight:700}
    .secure-tag{text-align:center;font-size:12px;color:#7A6855;margin-top:12px;padding:8px;background:#F5ECD7;border-radius:6px}
    @media(max-width:768px){.checkout-grid{grid-template-columns:1fr}.form-row-2,.form-row-3{grid-template-columns:1fr}}
  `]
})
export class CheckoutComponent implements OnInit {
  cartSvc    = inject(CartService);
  addrSvc    = inject(AddressService);
  orderSvc   = inject(OrderService);
  router     = inject(Router);

  cart: Cart | null = null;
  addresses: Address[] = [];
  selectedAddressId = '';
  paymentMethod = '';
  couponCode = ''; couponDiscount = 0;
  notes = ''; step = 1; placing = false; orderError = '';
  showAddAddr = false;

  newAddr: Partial<Address> = { type: 'home', is_default: false };

  paymentMethods = [
    { val:'upi',        icon:'📱', name:'UPI', desc:'Pay via GPay, PhonePe, Paytm & more' },
    { val:'card',       icon:'💳', name:'Credit / Debit Card', desc:'Visa, Mastercard, RuPay' },
    { val:'netbanking', icon:'🏦', name:'Net Banking', desc:'All major Indian banks' },
    { val:'cod',        icon:'💵', name:'Cash on Delivery', desc:'Pay when your order arrives' },
  ];

  get selectedAddress(): Address | undefined {
    return this.addresses.find(a => a.id === this.selectedAddressId);
  }

  get selectedPM() { return this.paymentMethods.find(p => p.val === this.paymentMethod); }

  ngOnInit() {
    this.cartSvc.getCart().subscribe(r => {
      this.cart = r.data;
      if (!this.cart?.items?.length) this.router.navigate(['/cart']);
    });
    this.addrSvc.getAddresses().subscribe(r => {
      this.addresses = r.data || [];
      const def = this.addresses.find(a => a.is_default);
      if (def) this.selectedAddressId = def.id;
      else if (this.addresses.length) this.selectedAddressId = this.addresses[0].id;
    });
  }

  saveAddress() {
    this.addrSvc.addAddress(this.newAddr).subscribe((r: any) => {
      this.addresses.push(r.data);
      this.selectedAddressId = r.data.id;
      this.showAddAddr = false;
      this.newAddr = { type: 'home', is_default: false };
    });
  }

  applyCoupon() {
    if (!this.couponCode || !this.cart) return;
    this.cartSvc.validateCoupon(this.couponCode, this.cart.subtotal).subscribe({
      next: (r: any) => this.couponDiscount = r.data.discount_amount,
      error: err => alert(err.error?.message || 'Invalid coupon')
    });
  }

  grandTotal(): number {
    if (!this.cart) return 0;
    return this.cart.subtotal + this.cart.shipping - this.couponDiscount;
  }

  placeOrder() {
    if (!this.selectedAddressId || !this.paymentMethod) return;
    this.placing = true; this.orderError = '';
    this.orderSvc.placeOrder({
      address_id: this.selectedAddressId,
      payment_method: this.paymentMethod,
      coupon_code: this.couponCode || undefined,
      notes: this.notes || undefined,
    }).subscribe({
      next: (r: any) => {
        this.router.navigate(['/orders', r.data.id], { queryParams: { new: '1' } });
      },
      error: err => { this.orderError = err.error?.message || 'Order failed'; this.placing = false; }
    });
  }
}
