import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookService } from '../../core/services/api.service';
import { Book, Category } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-text">
          <p class="eyebrow">🇮🇳 India's Favourite Online Bookstore</p>
          <h1 class="hero-title">Every Story<br>Deserves a <em>Reader</em></h1>
          <p class="hero-sub">Explore 5 lakh+ titles across fiction, non-fiction, academic and regional literature. Delivered across India in 2–5 days.</p>
          <div class="hero-btns">
            <a routerLink="/books" class="btn-primary">Browse Bestsellers</a>
            <a routerLink="/books" [queryParams]="{sort:'created_at',order:'desc'}" class="btn-outline">New Arrivals</a>
          </div>
          <div class="hero-stats">
            <div class="stat"><span class="snum">5L+</span><span class="slbl">Titles</span></div>
            <div class="stat"><span class="snum">2.8M+</span><span class="slbl">Readers</span></div>
            <div class="stat"><span class="snum">22+</span><span class="slbl">Languages</span></div>
          </div>
        </div>
        <div class="hero-books">
          <div class="hb b1">The Immortals</div>
          <div class="hb b2">Ocean of Milk</div>
          <div class="hb b3">Mango Season</div>
          <div class="hb b4">Dust &amp; Gold</div>
        </div>
      </div>
    </section>

    <!-- CATEGORY PILLS -->
    <section class="cats-section">
      <div class="container">
        <div class="cats-row">
          <a *ngFor="let c of categories" [routerLink]="['/books']" [queryParams]="{category: c.slug}" class="cat-pill">
            <span>{{ c.icon }}</span> {{ c.name }}
            <span class="cnt" *ngIf="c.book_count">{{ c.book_count }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- FEATURED BOOKS -->
    <section class="books-section">
      <div class="container">
        <div class="sec-header">
          <div>
            <h2 class="sec-title">Featured <span>Books</span></h2>
            <p class="sec-sub">Handpicked titles loved by thousands of readers</p>
          </div>
          <a routerLink="/books" [queryParams]="{featured:'true'}" class="see-all">See all →</a>
        </div>
        <div class="books-grid" *ngIf="featuredBooks.length; else loading">
          <a *ngFor="let b of featuredBooks" [routerLink]="['/books', b.slug]" class="book-card">
            <div class="book-cover" [style.background]="coverBg(b.id)">
              <span class="book-emoji">📖</span>
              <span class="badge badge-sale" *ngIf="discount(b) > 0">{{ discount(b) }}% off</span>
              <span class="badge badge-feat" *ngIf="b.is_featured">⭐</span>
            </div>
            <div class="book-info">
              <div class="book-title">{{ b.title }}</div>
              <div class="book-author">{{ b.authors?.join(', ') }}</div>
              <div class="book-rating">
                <span class="stars">{{ stars(b.rating) }}</span>
                <span class="rc">({{ b.rating_count | number }})</span>
              </div>
              <div class="book-price">
                <span class="price-now">₹{{ b.selling_price | number:'1.0-0' }}</span>
                <span class="price-mrp" *ngIf="b.mrp > b.selling_price">₹{{ b.mrp | number:'1.0-0' }}</span>
              </div>
            </div>
          </a>
        </div>
        <ng-template #loading>
          <div class="books-grid">
            <div class="book-skeleton" *ngFor="let i of [1,2,3,4,5,6,7,8]"></div>
          </div>
        </ng-template>
      </div>
    </section>

    <!-- PROMO BANNERS -->
    <section class="container promo-row">
      <div class="promo-card promo-1">
        <div class="promo-text">
          <h3>School Books Made Easy</h3>
          <p>NCERT, CBSE, ICSE &amp; State Board at best prices</p>
          <a [routerLink]="['/books']" [queryParams]="{category:'academic'}" class="promo-btn">Up to 30% Off</a>
        </div>
        <span class="promo-icon">📐</span>
      </div>
      <div class="promo-card promo-2">
        <div class="promo-text">
          <h3>Regional Literature</h3>
          <p>Books in Hindi, Bengali, Tamil, Marathi &amp; 18 more</p>
          <a [routerLink]="['/books']" [queryParams]="{category:'regional'}" class="promo-btn">22 Languages</a>
        </div>
        <span class="promo-icon">🌏</span>
      </div>
    </section>

    <!-- NEW ARRIVALS -->
    <section class="books-section">
      <div class="container">
        <div class="sec-header">
          <div>
            <h2 class="sec-title">New <span>Arrivals</span></h2>
            <p class="sec-sub">Fresh off the press — just added this week</p>
          </div>
          <a routerLink="/books" [queryParams]="{sort:'created_at',order:'desc'}" class="see-all">See all →</a>
        </div>
        <div class="books-grid">
          <a *ngFor="let b of newBooks" [routerLink]="['/books', b.slug]" class="book-card">
            <div class="book-cover" [style.background]="coverBg(b.id)">
              <span class="book-emoji">📚</span>
              <span class="badge badge-new">New</span>
            </div>
            <div class="book-info">
              <div class="book-title">{{ b.title }}</div>
              <div class="book-author">{{ b.authors?.join(', ') }}</div>
              <div class="book-price">
                <span class="price-now">₹{{ b.selling_price | number:'1.0-0' }}</span>
                <span class="price-mrp" *ngIf="b.mrp > b.selling_price">₹{{ b.mrp | number:'1.0-0' }}</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="container features-row">
      <div class="feat" *ngFor="let f of features">
        <span class="feat-icon">{{ f.icon }}</span>
        <div>
          <div class="feat-title">{{ f.title }}</div>
          <div class="feat-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <!-- NEWSLETTER -->
    <section class="container nl-section">
      <div class="nl-inner">
        <div class="nl-text">
          <h3>📖 Stay in the Loop</h3>
          <p>New arrivals, exclusive deals &amp; reading recommendations straight to your inbox.</p>
        </div>
        <div class="nl-form">
          <input class="nl-input" type="email" [(ngModel)]="nlEmail" placeholder="Your email address">
          <button class="nl-btn" (click)="subscribeNl()">{{ nlDone ? 'Subscribed!' : 'Subscribe' }}</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* HERO */
    .hero { background:linear-gradient(135deg,#7A1E2E 0%,#3D0B17 50%,#1A0810 100%);
      min-height:480px; display:flex; align-items:center; position:relative;
      overflow:hidden; padding:40px 24px; }
    .hero-bg { position:absolute; inset:0;
      background:radial-gradient(circle at 70% 50%,rgba(232,88,10,.2) 0%,transparent 60%); }
    .hero-content { max-width:1280px; margin:0 auto; width:100%;
      display:flex; align-items:center; gap:40px; position:relative; }
    .hero-text { flex:1; }
    .eyebrow { font-size:12px; letter-spacing:3px; text-transform:uppercase;
      color:#C99A2E; font-weight:600; margin-bottom:16px; }
    .hero-title { font-family:'Playfair Display',serif; font-size:clamp(36px,5vw,60px);
      font-weight:900; line-height:1.1; color:#fff; margin-bottom:16px; }
    .hero-title em { color:#E8580A; font-style:italic; }
    .hero-sub { color:rgba(255,255,255,.7); font-size:16px; line-height:1.6;
      margin-bottom:32px; max-width:480px; }
    .hero-btns { display:flex; gap:14px; flex-wrap:wrap; }
    .btn-primary { background:#E8580A; color:#fff; padding:14px 28px; border-radius:6px;
      font-size:15px; font-weight:600; border:none; cursor:pointer; transition:.2s;
      text-decoration:none; display:inline-block; }
    .btn-primary:hover { background:#C94A00; transform:translateY(-1px); }
    .btn-outline { background:transparent; color:#fff; padding:13px 28px; border-radius:6px;
      font-size:15px; border:1.5px solid rgba(255,255,255,.4); cursor:pointer;
      transition:.2s; text-decoration:none; display:inline-block; }
    .btn-outline:hover { border-color:#fff; }
    .hero-stats { display:flex; gap:32px; margin-top:40px; }
    .stat { color:rgba(255,255,255,.9); }
    .snum { font-family:'Playfair Display',serif; font-size:28px; font-weight:700;
      color:#C99A2E; display:block; }
    .slbl { font-size:12px; color:rgba(255,255,255,.5); letter-spacing:1px; }
    .hero-books { display:flex; gap:16px; align-items:flex-end; flex-shrink:0; }
    .hb { width:80px; height:120px; border-radius:4px; display:flex; align-items:flex-end;
      padding:8px 6px; font-size:9px; color:rgba(255,255,255,.9); font-weight:600;
      font-family:'Playfair Display',serif; cursor:pointer; transition:.2s;
      box-shadow:-4px 4px 12px rgba(0,0,0,.5); }
    .hb:hover { transform:translateY(-8px) rotate(-2deg); }
    .hb:nth-child(2) { height:140px; }
    .hb:nth-child(3) { height:105px; }
    .b1{background:linear-gradient(160deg,#e8580a,#7a1e2e)}
    .b2{background:linear-gradient(160deg,#1a3a5c,#0d1f2d)}
    .b3{background:linear-gradient(160deg,#2d6a4f,#1b4332)}
    .b4{background:linear-gradient(160deg,#5c2d0a,#3d1a00)}

    /* LAYOUT */
    .container { max-width:1280px; margin:0 auto; padding:0 24px; }
    .cats-section { padding:32px 0; }
    .cats-row { display:flex; gap:10px; flex-wrap:wrap; }
    .cat-pill { display:flex; align-items:center; gap:6px; padding:8px 16px;
      border-radius:24px; background:#FFFBF4; border:1.5px solid #E2D5BE;
      font-size:13px; font-weight:500; cursor:pointer; text-decoration:none;
      color:#1A0F00; transition:.2s; }
    .cat-pill:hover { background:#E8580A; color:#fff; border-color:#E8580A; }
    .cnt { background:#E8580A; color:#fff; border-radius:10px; padding:1px 6px;
      font-size:10px; font-weight:700; }

    /* SECTIONS */
    .books-section { padding:40px 0; }
    .sec-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; }
    .sec-title { font-family:'Playfair Display',serif; font-size:26px; font-weight:700; }
    .sec-title span { color:#E8580A; }
    .sec-sub { font-size:13px; color:#7A6855; margin-top:4px; }
    .see-all { font-size:13px; color:#E8580A; font-weight:600;
      text-decoration:none; border-bottom:1px dashed #E8580A; }

    /* BOOKS GRID */
    .books-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(176px,1fr)); gap:18px; }
    .book-card { background:#FFFBF4; border:1px solid #E2D5BE; border-radius:10px;
      overflow:hidden; transition:.25s; cursor:pointer; text-decoration:none; color:inherit; display:block; }
    .book-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(26,15,0,.12);
      border-color:#E8580A; }
    .book-cover { height:210px; display:flex; align-items:center; justify-content:center;
      position:relative; }
    .book-emoji { font-size:52px; }
    .badge { position:absolute; top:8px; left:8px; padding:3px 8px; border-radius:4px;
      font-size:10px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; }
    .badge-new { background:#2D6A4F; color:#fff; }
    .badge-sale { background:#E8580A; color:#fff; }
    .badge-feat { background:#C99A2E; color:#fff; left:auto; right:8px; }
    .book-info { padding:12px 14px 14px; }
    .book-title { font-family:'Playfair Display',serif; font-size:13.5px; font-weight:700;
      line-height:1.3; margin-bottom:4px; display:-webkit-box;
      -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .book-author { font-size:11.5px; color:#7A6855; margin-bottom:6px; }
    .book-rating { display:flex; align-items:center; gap:4px; margin-bottom:8px; }
    .stars { color:#C99A2E; font-size:12px; }
    .rc { font-size:11px; color:#7A6855; }
    .book-price { display:flex; align-items:center; gap:8px; }
    .price-now { font-size:15px; font-weight:700; color:#7A1E2E; }
    .price-mrp { font-size:11.5px; color:#7A6855; text-decoration:line-through; }
    .book-skeleton { height:280px; background:linear-gradient(90deg,#F5ECD7 25%,#FDF6EC 50%,#F5ECD7 75%);
      background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:10px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* PROMOS */
    .promo-row { display:grid; grid-template-columns:1fr 1fr; gap:20px;
      padding-top:8px; padding-bottom:40px; }
    .promo-card { border-radius:12px; padding:32px 28px;
      display:flex; justify-content:space-between; align-items:center;
      cursor:pointer; transition:.2s; }
    .promo-card:hover { transform:scale(1.01); }
    .promo-1 { background:linear-gradient(135deg,#7A1E2E,#4A0818); }
    .promo-2 { background:linear-gradient(135deg,#1a3a5c,#0d1f2d); }
    .promo-text h3 { font-family:'Playfair Display',serif; font-size:20px; color:#fff;
      font-weight:700; margin-bottom:8px; }
    .promo-text p { font-size:13px; color:rgba(255,255,255,.7); margin-bottom:14px; }
    .promo-btn { display:inline-block; padding:6px 16px; border-radius:20px;
      font-size:12px; font-weight:700; background:#C99A2E; color:#fff;
      text-decoration:none; }
    .promo-icon { font-size:60px; opacity:.8; }

    /* FEATURES */
    .features-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px;
      padding-top:8px; padding-bottom:40px; }
    .feat { background:#FFFBF4; border:1px solid #E2D5BE; border-radius:10px;
      padding:20px; display:flex; gap:14px; align-items:flex-start;
      transition:.2s; }
    .feat:hover { border-color:#E8580A; }
    .feat-icon { font-size:28px; flex-shrink:0; }
    .feat-title { font-size:14px; font-weight:600; margin-bottom:4px; }
    .feat-desc { font-size:12px; color:#7A6855; line-height:1.5; }

    /* NEWSLETTER */
    .nl-section { padding-bottom:60px; }
    .nl-inner { background:linear-gradient(135deg,#E8580A,#7A1E2E);
      border-radius:16px; padding:48px 40px;
      display:flex; justify-content:space-between; align-items:center; gap:40px; }
    .nl-text h3 { font-family:'Playfair Display',serif; font-size:26px; color:#fff;
      font-weight:700; margin-bottom:8px; }
    .nl-text p { color:rgba(255,255,255,.8); font-size:15px; }
    .nl-form { display:flex; gap:10px; flex-shrink:0; }
    .nl-input { padding:12px 18px; border-radius:8px;
      border:2px solid rgba(255,255,255,.3); background:rgba(255,255,255,.15);
      color:#fff; font-size:14px; width:240px; outline:none; font-family:inherit; }
    .nl-input::placeholder { color:rgba(255,255,255,.6); }
    .nl-btn { padding:12px 22px; background:#fff; color:#E8580A; border:none;
      border-radius:8px; font-size:14px; font-weight:700; cursor:pointer;
      transition:.2s; font-family:inherit; white-space:nowrap; }
    .nl-btn:hover { background:#FDF6EC; }

    @media(max-width:768px) {
      .hero-books,.hero-stats{display:none}
      .promo-row,.features-row{grid-template-columns:1fr}
      .nl-inner{flex-direction:column}
      .nl-form{flex-direction:column;width:100%}
      .nl-input{width:100%}
    }
  `]
})
export class HomeComponent implements OnInit {
  bookSvc = inject(BookService);
  featuredBooks: Book[] = [];
  newBooks: Book[] = [];
  categories: Category[] = [];
  nlEmail = ''; nlDone = false;

  features = [
    { icon:'🚚', title:'Free Delivery', desc:'Free shipping on orders above ₹499. Pan India delivery in 2–5 days.' },
    { icon:'🔁', title:'Easy Returns', desc:'7-day hassle-free return policy on all eligible books.' },
    { icon:'🔒', title:'Secure Payments', desc:'UPI, Net Banking, Cards, COD — all 100% secure.' },
    { icon:'📞', title:'24/7 Support', desc:'Dedicated support via chat, email & phone.' },
  ];

  coverBgs = [
    'linear-gradient(135deg,#FFD6B0,#FFA875)',
    'linear-gradient(135deg,#B5DCFF,#6BB5F5)',
    'linear-gradient(135deg,#B5FFCA,#5FC97E)',
    'linear-gradient(135deg,#FFB5C8,#FF6B8A)',
    'linear-gradient(135deg,#FFEDB5,#FFD460)',
    'linear-gradient(135deg,#D4B5FF,#A06BFF)',
    'linear-gradient(135deg,#B5F0FF,#5FCFEF)',
    'linear-gradient(135deg,#C5E8C5,#78C878)',
  ];

  ngOnInit() {
    this.bookSvc.getBooks({ featured: true, limit: 8 }).subscribe(r => this.featuredBooks = r.data || []);
    this.bookSvc.getBooks({ sort: 'created_at', order: 'desc', limit: 6 }).subscribe(r => this.newBooks = r.data || []);
    this.bookSvc.getCategories().subscribe(r => this.categories = r.data || []);
  }

  coverBg(id: string): string {
    const idx = id ? id.charCodeAt(0) % this.coverBgs.length : 0;
    return this.coverBgs[idx];
  }

  discount(b: Book): number {
    return b.mrp > b.selling_price ? Math.round((1 - b.selling_price / b.mrp) * 100) : 0;
  }

  stars(r: number): string {
    const full = Math.floor(r || 0);
    return '★'.repeat(full) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - full - (r % 1 >= 0.5 ? 1 : 0));
  }

  subscribeNl() {
    if (this.nlEmail) { this.nlDone = true; this.nlEmail = ''; }
  }
}