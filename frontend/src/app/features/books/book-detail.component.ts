import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService, CartService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Book } from '../../core/models';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="detail-wrap" *ngIf="book; else loading">
      <div class="breadcrumb">
        <a routerLink="/">Home</a> / <a routerLink="/books">Books</a> /
        <a *ngIf="book.category_slug" [routerLink]="['/books']" [queryParams]="{category:book.category_slug}">{{ book.category_name }}</a>
        / {{ book.title }}
      </div>

      <div class="detail-grid">
        <!-- COVER -->
        <div class="cover-col">
          <div class="main-cover" [style.background]="coverBg()">
            <span class="cover-emoji">{{ emoji }}</span>
            <span class="cover-badge" *ngIf="discount()>0">{{ discount() }}% OFF</span>
          </div>
          <div class="store-info" *ngIf="book.store_name">
            <span>🏪</span>
            <a [routerLink]="['/sellers', book.store_slug, 'public']">{{ book.store_name }}</a>
          </div>
        </div>

        <!-- INFO -->
        <div class="info-col">
          <div class="cat-chip" *ngIf="book.category_name">{{ book.category_name }}</div>
          <h1 class="book-title">{{ book.title }}</h1>
          <p class="subtitle" *ngIf="book.subtitle">{{ book.subtitle }}</p>
          <p class="authors">by <strong>{{ book.authors?.join(', ') }}</strong></p>

          <div class="rating-row">
            <span class="stars">{{ stars() }}</span>
            <span class="rating-val">{{ book.rating | number:'1.1-1' }}</span>
            <span class="rating-cnt">({{ book.rating_count | number }} ratings)</span>
            <span class="sold">{{ book.total_sold | number }} sold</span>
          </div>

          <div class="price-box">
            <span class="price-main">₹{{ book.selling_price | number:'1.0-0' }}</span>
            <span class="price-mrp" *ngIf="book.mrp>book.selling_price">MRP ₹{{ book.mrp | number:'1.0-0' }}</span>
            <span class="price-save" *ngIf="discount()>0">Save ₹{{ (book.mrp - book.selling_price) | number:'1.0-0' }}</span>
          </div>

          <div class="shipping-info">
            <span class="si-tag" [class.free]="book.selling_price>=499">
              {{ book.selling_price>=499 ? '✅ FREE Delivery' : '🚚 ₹49 Delivery' }}
            </span>
            <span class="si-tag" [class.instock]="book.stock_quantity>0">
              {{ book.stock_quantity>0 ? '✅ In Stock ('+book.stock_quantity+' left)' : '❌ Out of Stock' }}
            </span>
          </div>

          <div class="qty-row">
            <label>Qty:</label>
            <button class="qb" (click)="qty=qty>1?qty-1:1">−</button>
            <span class="qval">{{ qty }}</span>
            <button class="qb" (click)="qty=qty<(book.stock_quantity||1)?qty+1:qty">+</button>
          </div>

          <div class="action-row">
            <button class="btn-cart" (click)="addToCart()" [disabled]="book.stock_quantity===0">
              🛒 Add to Cart
            </button>
            <button class="btn-wishlist" (click)="toggleWishlist()">
              {{ wishlisted ? '❤️' : '🤍' }}
            </button>
          </div>

          <div class="success-msg" *ngIf="cartMsg">✅ {{ cartMsg }}</div>

          <div class="meta-grid">
            <div class="mg-row" *ngIf="book.publisher"><span>Publisher</span><span>{{ book.publisher }}</span></div>
            <div class="mg-row" *ngIf="book.publication_year"><span>Year</span><span>{{ book.publication_year }}</span></div>
            <div class="mg-row" *ngIf="book.edition"><span>Edition</span><span>{{ book.edition }}</span></div>
            <div class="mg-row"><span>Language</span><span>{{ book.language }}</span></div>
            <div class="mg-row" *ngIf="book.pages"><span>Pages</span><span>{{ book.pages }}</span></div>
            <div class="mg-row" *ngIf="book.isbn"><span>ISBN</span><span>{{ book.isbn }}</span></div>
            <div class="mg-row"><span>Condition</span><span class="cond-tag">{{ book.condition }}</span></div>
          </div>
        </div>
      </div>

      <!-- DESCRIPTION -->
      <div class="desc-section" *ngIf="book.description">
        <h2>About this book</h2>
        <p [class.truncated]="!descExpanded">{{ book.description }}</p>
        <button class="read-more" (click)="descExpanded=!descExpanded">
          {{ descExpanded ? 'Show less' : 'Read more' }}
        </button>
      </div>

      <!-- REVIEWS -->
      <div class="reviews-section">
        <div class="reviews-header">
          <h2>Customer Reviews</h2>
          <div class="overall-rating" *ngIf="book.rating_count">
            <div class="or-score">{{ book.rating | number:'1.1-1' }}</div>
            <div class="or-stars">{{ stars() }}</div>
            <div class="or-count">{{ book.rating_count }} reviews</div>
          </div>
        </div>

        <!-- Add Review -->
        <div class="add-review" *ngIf="auth.isBuyer()">
          <h3>Write a Review</h3>
          <div class="star-picker">
            <button *ngFor="let s of [1,2,3,4,5]" class="sp-btn" [class.filled]="s<=reviewForm.rating"
              (click)="reviewForm.rating=s">★</button>
          </div>
          <input class="rv-input" type="text" placeholder="Review title" [(ngModel)]="reviewForm.title">
          <textarea class="rv-ta" placeholder="Share your thoughts…" rows="3" [(ngModel)]="reviewForm.body"></textarea>
          <button class="btn-review" (click)="submitReview()">Submit Review</button>
        </div>

        <!-- Reviews List -->
        <div class="reviews-list" *ngIf="book.reviews?.length">
          <div class="review-item" *ngFor="let r of book.reviews">
            <div class="rv-header">
              <div class="rv-avatar">{{ r.first_name[0] }}{{ r.last_name[0] }}</div>
              <div>
                <div class="rv-name">{{ r.first_name }} {{ r.last_name }}</div>
                <div class="rv-stars">{{ rvStars(r.rating) }}</div>
              </div>
              <div class="rv-date">{{ r.created_at | date:'mediumDate' }}</div>
              <span class="verified" *ngIf="r.is_verified_purchase">✅ Verified</span>
            </div>
            <div class="rv-title" *ngIf="r.title">{{ r.title }}</div>
            <div class="rv-body">{{ r.body }}</div>
          </div>
        </div>
        <div class="no-reviews" *ngIf="!book.reviews?.length">No reviews yet. Be the first!</div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-page">
        <div class="spinner"></div>
        <p>Loading book details…</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .detail-wrap{max-width:1280px;margin:0 auto;padding:32px 24px}
    .breadcrumb{font-size:13px;color:#7A6855;margin-bottom:24px}
    .breadcrumb a{color:#E8580A;text-decoration:none}
    .breadcrumb a:hover{text-decoration:underline}
    .detail-grid{display:grid;grid-template-columns:340px 1fr;gap:48px;margin-bottom:48px}
    .main-cover{height:420px;border-radius:12px;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 12px 40px rgba(0,0,0,.15)}
    .cover-emoji{font-size:80px}
    .cover-badge{position:absolute;top:16px;right:16px;background:#E8580A;color:#fff;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:700}
    .store-info{margin-top:12px;text-align:center;font-size:13px;color:#7A6855}
    .store-info a{color:#E8580A;text-decoration:none;font-weight:600}
    .cat-chip{display:inline-block;padding:4px 12px;background:#FFF0E6;color:#E8580A;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:12px}
    .book-title{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,34px);font-weight:900;line-height:1.2;margin-bottom:8px}
    .subtitle{font-size:16px;color:#7A6855;margin-bottom:8px}
    .authors{font-size:15px;color:#7A6855;margin-bottom:16px}
    .authors strong{color:#1A0F00}
    .rating-row{display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap}
    .stars{color:#C99A2E;font-size:18px;letter-spacing:1px}
    .rating-val{font-size:16px;font-weight:700;color:#1A0F00}
    .rating-cnt,.sold{font-size:13px;color:#7A6855}
    .price-box{display:flex;align-items:baseline;gap:12px;margin-bottom:16px;flex-wrap:wrap}
    .price-main{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;color:#7A1E2E}
    .price-mrp{font-size:18px;color:#7A6855;text-decoration:line-through}
    .price-save{font-size:14px;font-weight:700;color:#2D6A4F;background:#E8F5E9;padding:3px 10px;border-radius:20px}
    .shipping-info{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
    .si-tag{font-size:13px;padding:5px 12px;border-radius:20px;background:#F5ECD7;border:1px solid #E2D5BE}
    .si-tag.free{background:#E8F5E9;border-color:#9AE6B4;color:#276749}
    .si-tag.instock{background:#E8F5E9;border-color:#9AE6B4;color:#276749}
    .qty-row{display:flex;align-items:center;gap:10px;margin-bottom:20px;font-size:14px;font-weight:600}
    .qb{width:32px;height:32px;border-radius:6px;border:1.5px solid #E2D5BE;background:#F5ECD7;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s}
    .qb:hover{border-color:#E8580A;background:#FFF0E6}
    .qval{min-width:32px;text-align:center;font-size:16px}
    .action-row{display:flex;gap:12px;margin-bottom:16px}
    .btn-cart{flex:1;padding:14px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:.2s;font-family:inherit}
    .btn-cart:hover:not(:disabled){background:#7A1E2E}
    .btn-cart:disabled{opacity:.5;cursor:not-allowed}
    .btn-wishlist{width:52px;height:52px;border-radius:8px;border:1.5px solid #E2D5BE;background:#FFFBF4;font-size:22px;cursor:pointer;transition:.2s}
    .btn-wishlist:hover{border-color:#E8580A}
    .success-msg{background:#E8F5E9;color:#276749;border:1px solid #9AE6B4;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:12px}
    .meta-grid{border:1px solid #E2D5BE;border-radius:10px;overflow:hidden}
    .mg-row{display:flex;justify-content:space-between;padding:10px 14px;font-size:13px;border-bottom:1px solid #E2D5BE}
    .mg-row:last-child{border-bottom:none}
    .mg-row span:first-child{color:#7A6855;font-weight:600}
    .mg-row span:last-child{color:#1A0F00;text-align:right}
    .cond-tag{background:#FFF0E6;color:#E8580A;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:capitalize}
    .desc-section,.reviews-section{margin-bottom:40px}
    .desc-section h2,.reviews-section h2{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:16px}
    .desc-section p{font-size:15px;line-height:1.8;color:#3D2B1F}
    .truncated{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
    .read-more{background:none;border:none;color:#E8580A;font-weight:600;cursor:pointer;font-size:13px;margin-top:8px;font-family:inherit}
    .reviews-header{display:flex;align-items:center;gap:24px;margin-bottom:24px}
    .overall-rating{display:flex;align-items:center;gap:10px;background:#FFFBF4;border:1px solid #E2D5BE;border-radius:10px;padding:12px 20px}
    .or-score{font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:#C99A2E}
    .or-stars{color:#C99A2E;font-size:18px}
    .or-count{font-size:13px;color:#7A6855}
    .add-review{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px;margin-bottom:24px}
    .add-review h3{font-family:'Playfair Display',serif;font-size:18px;margin-bottom:14px}
    .star-picker{display:flex;gap:4px;margin-bottom:14px}
    .sp-btn{background:none;border:none;font-size:28px;color:#E2D5BE;cursor:pointer;transition:.2s}
    .sp-btn.filled{color:#C99A2E}
    .rv-input{width:100%;padding:10px 13px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#fff;outline:none;margin-bottom:10px;font-family:inherit;box-sizing:border-box}
    .rv-ta{width:100%;padding:10px 13px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#fff;outline:none;resize:vertical;font-family:inherit;box-sizing:border-box}
    .rv-input:focus,.rv-ta:focus{border-color:#E8580A}
    .btn-review{margin-top:12px;padding:10px 24px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .reviews-list{display:flex;flex-direction:column;gap:16px}
    .review-item{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:10px;padding:18px}
    .rv-header{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
    .rv-avatar{width:36px;height:36px;border-radius:50%;background:#E8580A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
    .rv-name{font-weight:600;font-size:14px}
    .rv-stars{color:#C99A2E;font-size:13px}
    .rv-date{margin-left:auto;font-size:12px;color:#7A6855}
    .verified{font-size:11px;color:#276749;font-weight:600}
    .rv-title{font-weight:700;font-size:14px;margin-bottom:6px}
    .rv-body{font-size:14px;color:#3D2B1F;line-height:1.6}
    .no-reviews{color:#7A6855;font-size:14px;padding:20px 0}
    .loading-page{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px;color:#7A6855}
    .spinner{width:40px;height:40px;border:3px solid #E2D5BE;border-top-color:#E8580A;border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media(max-width:768px){.detail-grid{grid-template-columns:1fr}}
  `]
})
export class BookDetailComponent implements OnInit {
  bookSvc = inject(BookService);
  cartSvc = inject(CartService);
  auth    = inject(AuthService);
  route   = inject(ActivatedRoute);
  router  = inject(Router);

  book: Book | null = null;
  qty = 1; wishlisted = false; cartMsg = ''; descExpanded = false;
  emoji = '📖';
  reviewForm = { rating: 5, title: '', body: '' };

  emojis = ['📖','📚','📘','📙','📗','📕','📓','📔'];
  bgs = ['linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)',
         'linear-gradient(135deg,#B5FFCA,#5FC97E)','linear-gradient(135deg,#FFB5C8,#FF6B8A)',
         'linear-gradient(135deg,#FFEDB5,#FFD460)','linear-gradient(135deg,#D4B5FF,#A06BFF)'];

  ngOnInit() {
    this.route.params.subscribe(p => {
      this.bookSvc.getBook(p['slug']).subscribe({
        next: r => {
          this.book = r.data;
          const idx = (this.book?.id?.charCodeAt(0) || 0) % this.emojis.length;
          this.emoji = this.emojis[idx];
        },
        error: () => this.router.navigate(['/books'])
      });
    });
  }

  coverBg() {
    const idx = (this.book?.id?.charCodeAt(0) || 0) % this.bgs.length;
    return this.bgs[idx];
  }

  discount() {
    if (!this.book) return 0;
    return this.book.mrp > this.book.selling_price ? Math.round((1 - this.book.selling_price/this.book.mrp)*100) : 0;
  }

  stars() {
    const r = this.book?.rating || 0;
    const f = Math.floor(r);
    return '★'.repeat(f) + (r%1>=.5?'½':'') + '☆'.repeat(Math.max(0,5-f-(r%1>=.5?1:0)));
  }

  rvStars(r: number) { const f=Math.floor(r); return '★'.repeat(f)+'☆'.repeat(5-f); }

  addToCart() {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.cartSvc.addToCart(this.book!.id, this.qty).subscribe({
      next: () => { this.cartMsg = `${this.book!.title} added to cart!`; setTimeout(()=>this.cartMsg='',3000); },
      error: err => this.cartMsg = err.error?.message || 'Failed'
    });
  }

  toggleWishlist() {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.cartSvc.toggleWishlist(this.book!.id).subscribe((r: any) => this.wishlisted = r.data?.wishlisted);
  }

  submitReview() {
    if (!this.reviewForm.body) return;
    this.bookSvc.addReview(this.book!.id, this.reviewForm).subscribe({
      next: (r: any) => {
        this.book!.reviews = [r.data, ...(this.book!.reviews || [])];
        this.reviewForm = { rating: 5, title: '', body: '' };
      },
      error: err => alert(err.error?.message || 'Failed to submit review')
    });
  }
}
