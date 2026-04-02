import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <!-- ANNOUNCEMENT BAR -->
    <div class="announcement-bar" *ngIf="showAnnouncement">
      🎉 Grand Opening Sale! Use code <strong>PUSTAK20</strong> for 20% off · Free shipping above ₹499
      <button class="close-ann" (click)="showAnnouncement=false">✕</button>
    </div>

    <!-- HEADER -->
    <header class="site-header">
      <div class="header-inner">
        <a routerLink="/" class="logo">
          <span class="logo-hindi">पुस्तकवाला</span>
          <span class="logo-name">Pustakwala</span>
          <span class="logo-tag">Your Book Universe</span>
        </a>

        <div class="search-wrap">
          <select class="search-cat" [(ngModel)]="searchCat" *ngIf="false"></select>
          <input class="search-input" type="text" placeholder="Search titles, authors, ISBN…"
            [(ngModel)]="searchQuery" (keyup.enter)="doSearch()">
          <button class="search-btn" (click)="doSearch()">🔍</button>
        </div>

        <div class="header-actions">
          <ng-container *ngIf="!auth.isLoggedIn(); else loggedIn">
            <a routerLink="/auth/login" class="hdr-action">
              <span class="ha-icon">👤</span><span class="ha-label">Login</span>
            </a>
          </ng-container>
          <ng-template #loggedIn>
            <div class="hdr-action user-menu-wrap">
              <span class="ha-icon">👤</span>
              <span class="ha-label">{{ auth.currentUser()?.first_name }}</span>
              <div class="user-dropdown">
                <ng-container [ngSwitch]="auth.currentUser()?.role">
                  <ng-container *ngSwitchCase="'buyer'">
                    <a routerLink="/profile">My Profile</a>
                    <a routerLink="/orders">My Orders</a>
                    <a routerLink="/wishlist">Wishlist</a>
                  </ng-container>
                  <ng-container *ngSwitchCase="'seller'">
                    <a routerLink="/seller/dashboard">Dashboard</a>
                    <a routerLink="/seller/books">My Books</a>
                    <a routerLink="/seller/orders">Orders</a>
                    <a routerLink="/seller/profile">Profile</a>
                  </ng-container>
                  <ng-container *ngSwitchCase="'admin'">
                    <a routerLink="/admin/dashboard">Admin Panel</a>
                    <a routerLink="/admin/sellers">Sellers</a>
                  </ng-container>
                </ng-container>
                <hr>
                <button (click)="auth.logout()">Logout</button>
              </div>
            </div>
          </ng-template>

          <a routerLink="/wishlist" class="hdr-action" *ngIf="auth.isBuyer()">
            <span class="ha-icon">❤️</span><span class="ha-label">Wishlist</span>
          </a>

          <a routerLink="/cart" class="hdr-action cart-action" *ngIf="auth.isBuyer()">
            <span class="ha-icon">🛒</span>
            <span class="ha-label">Cart</span>
            <span class="cart-badge" *ngIf="cartCount() > 0">{{ cartCount() }}</span>
          </a>
        </div>
      </div>

      <!-- NAV -->
      <nav class="main-nav">
        <div class="nav-inner">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-link">🏠 Home</a>
          <a routerLink="/books" class="nav-link">📚 All Books</a>
          <a [routerLink]="['/books']" [queryParams]="{featured:'true'}" class="nav-link">🏆 Bestsellers</a>
          <a [routerLink]="['/books']" [queryParams]="{sort:'created_at',order:'desc'}" class="nav-link">✨ New Arrivals</a>
          <a [routerLink]="['/categories/academic']" class="nav-link">🎓 Academic</a>
          <a [routerLink]="['/categories/children']" class="nav-link">🧒 Children</a>
          <a [routerLink]="['/categories/regional']" class="nav-link">🌾 Regional</a>
          <a [routerLink]="['/books']" [queryParams]="{min_price:'1',max_price:'199'}" class="nav-link sale-link">🔥 Sale</a>
          <a routerLink="/seller/register" class="nav-link sell-link" *ngIf="!auth.isSeller() && !auth.isAdmin()">📦 Sell Books</a>
        </div>
      </nav>
    </header>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <!-- FOOTER -->
    <footer class="site-footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo-name" style="color:#C99A2E;font-size:24px">Pustakwala</div>
          <div class="logo-hindi" style="color:rgba(255,255,255,0.4)">पुस्तकवाला</div>
          <p>India's growing online bookstore — books in 22+ Indian languages delivered across the country.</p>
          <div class="social-row">
            <span class="soc">📘</span><span class="soc">📸</span>
            <span class="soc">🐦</span><span class="soc">▶️</span>
          </div>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <a routerLink="/">Home</a>
          <a routerLink="/books">All Books</a>
          <a [routerLink]="['/books']" [queryParams]="{featured:'true'}">Bestsellers</a>
          <a routerLink="/seller/register">Sell on Pustakwala</a>
        </div>
        <div class="footer-col">
          <h4>Customer</h4>
          <a routerLink="/orders">Track Order</a>
          <a routerLink="/profile">My Account</a>
          <a routerLink="/wishlist">Wishlist</a>
          <a href="#">Contact Support</a>
        </div>
        <div class="footer-col">
          <h4>Policies</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Return Policy</a>
          <a href="#">Shipping Info</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 Pustakwala. All rights reserved.</span>
        <div class="pay-icons">
          <span>UPI</span><span>Visa</span><span>MC</span><span>COD</span><span>EMI</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }

    .announcement-bar {
      background: #7A1E2E; color: #fff; text-align: center;
      padding: 8px 40px; font-size: 13px; position: relative;
    }
    .announcement-bar strong { color: #C99A2E; }
    .close-ann { position:absolute; right:12px; top:50%; transform:translateY(-50%);
      background:none; border:none; color:#fff; cursor:pointer; font-size:16px; }

    .site-header { background:#FDF6EC; border-bottom:2px solid #E8580A;
      position:sticky; top:0; z-index:1000;
      box-shadow:0 2px 20px rgba(232,88,10,.1); }
    .header-inner { max-width:1280px; margin:0 auto; display:flex;
      align-items:center; gap:20px; padding:14px 24px; }

    .logo { text-decoration:none; flex-shrink:0; display:flex; flex-direction:column; line-height:1.1; }
    .logo-hindi { font-size:10px; color:#7A6855; letter-spacing:2px; }
    .logo-name  { font-family:'Playfair Display',serif; font-size:26px; font-weight:900; color:#E8580A; }
    .logo-tag   { font-size:10px; color:#7A6855; letter-spacing:2px; text-transform:uppercase; }

    .search-wrap { flex:1; display:flex; align-items:center; background:#F5ECD7;
      border:1.5px solid #E2D5BE; border-radius:8px; overflow:hidden; }
    .search-wrap:focus-within { border-color:#E8580A; }
    .search-input { flex:1; padding:10px 14px; border:none; background:transparent;
      font-size:14px; outline:none; }
    .search-btn { padding:10px 18px; background:#E8580A; border:none;
      color:#fff; cursor:pointer; font-size:16px; transition:.2s; }
    .search-btn:hover { background:#7A1E2E; }

    .header-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; }
    .hdr-action { display:flex; flex-direction:column; align-items:center;
      padding:6px 10px; cursor:pointer; text-decoration:none; color:#1A0F00;
      border-radius:6px; transition:.2s; position:relative; }
    .hdr-action:hover { background:#F5ECD7; }
    .ha-icon  { font-size:20px; }
    .ha-label { font-size:10px; color:#7A6855; margin-top:2px; }
    .cart-badge { position:absolute; top:2px; right:4px; background:#E8580A;
      color:#fff; border-radius:50%; width:16px; height:16px; font-size:10px;
      font-weight:700; display:flex; align-items:center; justify-content:center; }

    .user-menu-wrap { position:relative; }
    .user-dropdown { display:none; position:absolute; top:100%; right:0;
      background:#fff; border:1px solid #E2D5BE; border-radius:8px;
      min-width:160px; box-shadow:0 8px 24px rgba(0,0,0,.1); z-index:100;
      padding:8px 0; }
    .user-menu-wrap:hover .user-dropdown { display:block; }
    .user-dropdown a, .user-dropdown button {
      display:block; width:100%; padding:8px 16px; text-decoration:none;
      color:#1A0F00; font-size:14px; background:none; border:none;
      cursor:pointer; text-align:left; }
    .user-dropdown a:hover, .user-dropdown button:hover { background:#FDF6EC; color:#E8580A; }
    .user-dropdown hr { margin:4px 0; border:none; border-top:1px solid #E2D5BE; }

    .main-nav { background:#7A1E2E; }
    .nav-inner { max-width:1280px; margin:0 auto; display:flex;
      align-items:center; padding:0 24px; gap:2px; overflow-x:auto; }
    .nav-link { color:rgba(255,255,255,.85); text-decoration:none;
      padding:11px 16px; font-size:13.5px; font-weight:500; white-space:nowrap;
      border-bottom:3px solid transparent; transition:.2s; }
    .nav-link:hover, .nav-link.active { color:#C99A2E; border-bottom-color:#C99A2E; }
    .sale-link { color:#FF9F60 !important; font-weight:700; }
    .sell-link { margin-left:auto; color:#fff !important; background:rgba(255,255,255,.15);
      border-radius:6px; margin-top:4px; margin-bottom:4px; }
    .sell-link:hover { background:rgba(255,255,255,.25); }

    .main-content { flex:1; }

    .site-footer { background:#1A0F00; color:rgba(255,255,255,.7); padding:60px 24px 0; margin-top:80px; }
    .footer-grid { max-width:1280px; margin:0 auto;
      display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px; }
    .footer-brand p { font-size:13px; line-height:1.7; margin:10px 0 16px; }
    .social-row { display:flex; gap:10px; }
    .soc { width:34px; height:34px; background:rgba(255,255,255,.1); border-radius:8px;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; font-size:15px; transition:.2s; }
    .soc:hover { background:#E8580A; }
    .footer-col { display:flex; flex-direction:column; }
    .footer-col h4 { color:#fff; font-size:14px; font-weight:600; margin-bottom:14px; }
    .footer-col a { color:rgba(255,255,255,.6); text-decoration:none; font-size:13px; margin-bottom:9px; transition:.2s; }
    .footer-col a:hover { color:#C99A2E; }
    .footer-bottom { max-width:1280px; margin:40px auto 0;
      border-top:1px solid rgba(255,255,255,.1); padding:20px 0;
      display:flex; justify-content:space-between; font-size:12px; }
    .pay-icons { display:flex; gap:8px; }
    .pay-icons span { background:rgba(255,255,255,.12); padding:4px 10px;
      border-radius:4px; font-size:11px; font-weight:600; }
  `]
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  private cartSvc = inject(CartService);
  private router = inject(Router);

  showAnnouncement = true;
  searchQuery = '';
  searchCat = 'all';
  cartCount = signal(0);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.auth.fetchMe().subscribe();
      if (this.auth.isBuyer()) this.loadCartCount();
    }
  }

  loadCartCount() {
    this.cartSvc.getCart().subscribe(res => {
      this.cartCount.set(res.data?.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0);
    });
  }

  doSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/books'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }
}