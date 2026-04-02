import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BookService, CartService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Book, Category, BookFilters } from '../../core/models';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrap">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="filter-group">
          <h4>Categories</h4>
          <label class="filter-opt" *ngFor="let c of categories">
            <input type="radio" name="cat" [value]="c.slug" [(ngModel)]="filters.category"
              (change)="applyFilters()">
            {{ c.icon }} {{ c.name }}
            <span class="fc">{{ c.book_count }}</span>
          </label>
          <label class="filter-opt">
            <input type="radio" name="cat" value="" [(ngModel)]="filters.category" (change)="applyFilters()">
            All Categories
          </label>
        </div>
        <div class="filter-group">
          <h4>Price Range</h4>
          <div class="price-inputs">
            <input type="number" placeholder="Min ₹" [(ngModel)]="filters.min_price" (change)="applyFilters()">
            <span>–</span>
            <input type="number" placeholder="Max ₹" [(ngModel)]="filters.max_price" (change)="applyFilters()">
          </div>
        </div>
        <div class="filter-group">
          <h4>Language</h4>
          <label class="filter-opt" *ngFor="let l of languages">
            <input type="radio" name="lang" [value]="l" [(ngModel)]="filters.language" (change)="applyFilters()">
            {{ l }}
          </label>
          <label class="filter-opt">
            <input type="radio" name="lang" value="" [(ngModel)]="filters.language" (change)="applyFilters()"> All
          </label>
        </div>
        <div class="filter-group">
          <h4>Condition</h4>
          <label class="filter-opt" *ngFor="let c of conditions">
            <input type="radio" name="cond" [value]="c.val" [(ngModel)]="filters.condition" (change)="applyFilters()">
            {{ c.label }}
          </label>
          <label class="filter-opt">
            <input type="radio" name="cond" value="" [(ngModel)]="filters.condition" (change)="applyFilters()"> All
          </label>
        </div>
        <button class="clear-btn" (click)="clearFilters()">Clear All Filters</button>
      </aside>

      <!-- MAIN -->
      <div class="main-col">
        <!-- TOOLBAR -->
        <div class="toolbar">
          <div class="result-info">
            <span *ngIf="!loading">{{ total | number }} book{{ total !== 1 ? 's' : '' }} found</span>
            <span *ngIf="loading">Loading…</span>
          </div>
          <div class="sort-wrap">
            <label>Sort by:</label>
            <select [(ngModel)]="sortKey" (change)="onSortChange()">
              <option value="created_at-desc">Newest First</option>
              <option value="selling_price-asc">Price: Low to High</option>
              <option value="selling_price-desc">Price: High to Low</option>
              <option value="rating-desc">Top Rated</option>
              <option value="total_sold-desc">Bestsellers</option>
            </select>
          </div>
        </div>

        <!-- ACTIVE FILTERS -->
        <div class="active-filters" *ngIf="hasActiveFilters()">
          <span class="af-chip" *ngIf="filters.search">Search: "{{ filters.search }}" <button (click)="removeFilter('search')">✕</button></span>
          <span class="af-chip" *ngIf="filters.category">Category: {{ filters.category }} <button (click)="removeFilter('category')">✕</button></span>
          <span class="af-chip" *ngIf="filters.min_price">Min: ₹{{ filters.min_price }} <button (click)="removeFilter('min_price')">✕</button></span>
          <span class="af-chip" *ngIf="filters.max_price">Max: ₹{{ filters.max_price }} <button (click)="removeFilter('max_price')">✕</button></span>
          <span class="af-chip" *ngIf="filters.language">Lang: {{ filters.language }} <button (click)="removeFilter('language')">✕</button></span>
        </div>

        <!-- GRID -->
        <div class="books-grid" *ngIf="!loading && books.length">
          <div class="book-card" *ngFor="let b of books">
            <a [routerLink]="['/books', b.slug]" class="card-link">
              <div class="book-cover" [style.background]="coverBg(b.id)">
                <span class="book-emoji">{{ bookEmoji(b) }}</span>
                <span class="badge badge-new" *ngIf="isNew(b)">New</span>
                <span class="badge badge-off" *ngIf="discount(b)>0">{{ discount(b) }}% off</span>
              </div>
              <div class="book-info">
                <div class="book-title">{{ b.title }}</div>
                <div class="book-author">{{ b.authors?.join(', ') }}</div>
                <div class="book-meta">
                  <span class="stars">{{ stars(b.rating) }}</span>
                  <span class="rc">({{ b.rating_count }})</span>
                  <span class="cat-tag">{{ b.category_name }}</span>
                </div>
                <div class="book-price">
                  <span class="price-now">₹{{ b.selling_price | number:'1.0-0' }}</span>
                  <span class="price-mrp" *ngIf="b.mrp > b.selling_price">₹{{ b.mrp | number:'1.0-0' }}</span>
                </div>
              </div>
            </a>
            <button class="cart-btn" (click)="addToCart(b)" [disabled]="!auth.isBuyer() || b.stock_quantity === 0">
              {{ b.stock_quantity === 0 ? 'Out of Stock' : '+ Add to Cart' }}
            </button>
          </div>
        </div>

        <!-- EMPTY -->
        <div class="empty-state" *ngIf="!loading && !books.length">
          <span class="empty-icon">📚</span>
          <h3>No books found</h3>
          <p>Try adjusting your filters or search term.</p>
          <button class="btn-primary" (click)="clearFilters()">Clear Filters</button>
        </div>

        <!-- SKELETON -->
        <div class="books-grid" *ngIf="loading">
          <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6,7,8,9,10,11,12]"></div>
        </div>

        <!-- PAGINATION -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="currentPage===1" (click)="goPage(currentPage-1)">‹ Prev</button>
          <button *ngFor="let p of pageNumbers()" [class.active]="p===currentPage" (click)="goPage(p)">{{ p }}</button>
          <button [disabled]="currentPage===totalPages" (click)="goPage(currentPage+1)">Next ›</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div class="toast" [class.show]="toastMsg">{{ toastMsg }}</div>
  `,
  styles: [`
    .page-wrap{max-width:1280px;margin:0 auto;padding:32px 24px;display:flex;gap:28px;align-items:flex-start}
    .sidebar{width:220px;flex-shrink:0;background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:20px;position:sticky;top:140px}
    .filter-group{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #E2D5BE}
    .filter-group:last-of-type{border-bottom:none}
    .filter-group h4{font-size:13px;font-weight:700;color:#1A0F00;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
    .filter-opt{display:flex;align-items:center;gap:8px;font-size:13px;color:#1A0F00;margin-bottom:7px;cursor:pointer}
    .filter-opt input{accent-color:#E8580A;cursor:pointer}
    .fc{margin-left:auto;font-size:11px;color:#7A6855}
    .price-inputs{display:flex;gap:8px;align-items:center;font-size:13px}
    .price-inputs input{flex:1;padding:6px 8px;border:1.5px solid #E2D5BE;border-radius:6px;font-size:12px;background:#F5ECD7;outline:none;width:70px}
    .price-inputs input:focus{border-color:#E8580A}
    .clear-btn{width:100%;padding:8px;background:transparent;border:1.5px solid #E8580A;color:#E8580A;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;font-family:inherit}
    .clear-btn:hover{background:#E8580A;color:#fff}
    .main-col{flex:1;min-width:0}
    .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px}
    .result-info{font-size:14px;color:#7A6855}
    .sort-wrap{display:flex;align-items:center;gap:8px;font-size:13px;color:#7A6855}
    .sort-wrap select{padding:7px 12px;border:1.5px solid #E2D5BE;border-radius:6px;font-size:13px;background:#FFFBF4;outline:none;cursor:pointer;font-family:inherit}
    .active-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .af-chip{display:flex;align-items:center;gap:4px;background:#FFF0E6;border:1px solid #E8580A;color:#E8580A;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
    .af-chip button{background:none;border:none;cursor:pointer;color:#E8580A;font-size:12px;padding:0}
    .books-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(172px,1fr));gap:16px}
    .book-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:10px;overflow:hidden;transition:.25s;display:flex;flex-direction:column}
    .book-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(26,15,0,.12);border-color:#E8580A}
    .card-link{text-decoration:none;color:inherit;flex:1}
    .book-cover{height:200px;display:flex;align-items:center;justify-content:center;position:relative}
    .book-emoji{font-size:48px}
    .badge{position:absolute;top:8px;left:8px;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase}
    .badge-new{background:#2D6A4F;color:#fff}
    .badge-off{background:#E8580A;color:#fff;left:auto;right:8px}
    .book-info{padding:10px 12px 8px}
    .book-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;line-height:1.3;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .book-author{font-size:11px;color:#7A6855;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .book-meta{display:flex;align-items:center;gap:4px;margin-bottom:7px}
    .stars{color:#C99A2E;font-size:11px}
    .rc{font-size:10px;color:#7A6855}
    .cat-tag{margin-left:auto;font-size:9px;background:#F5ECD7;padding:2px 6px;border-radius:4px;color:#7A6855}
    .book-price{display:flex;align-items:center;gap:6px}
    .price-now{font-size:14px;font-weight:700;color:#7A1E2E}
    .price-mrp{font-size:11px;color:#7A6855;text-decoration:line-through}
    .cart-btn{width:100%;padding:8px;background:transparent;border:1.5px solid #E8580A;border-top:none;color:#E8580A;font-size:12px;font-weight:600;cursor:pointer;transition:.2s;font-family:inherit}
    .cart-btn:hover:not(:disabled){background:#E8580A;color:#fff}
    .cart-btn:disabled{opacity:.5;cursor:not-allowed}
    .empty-state{text-align:center;padding:80px 20px}
    .empty-icon{font-size:64px;display:block;margin-bottom:16px}
    .empty-state h3{font-family:'Playfair Display',serif;font-size:22px;margin-bottom:8px}
    .empty-state p{color:#7A6855;margin-bottom:20px}
    .btn-primary{padding:11px 24px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
    .skeleton-card{height:280px;background:linear-gradient(90deg,#F5ECD7 25%,#FDF6EC 50%,#F5ECD7 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:10px}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .pagination{display:flex;gap:8px;justify-content:center;margin-top:32px;flex-wrap:wrap}
    .pagination button{padding:8px 14px;border:1.5px solid #E2D5BE;border-radius:6px;background:#FFFBF4;font-size:13px;cursor:pointer;transition:.2s;font-family:inherit}
    .pagination button:hover:not(:disabled){border-color:#E8580A;color:#E8580A}
    .pagination button.active{background:#E8580A;color:#fff;border-color:#E8580A}
    .pagination button:disabled{opacity:.4;cursor:not-allowed}
    .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1A0F00;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;opacity:0;transition:.3s;pointer-events:none;z-index:9999}
    .toast.show{opacity:1}
    @media(max-width:768px){.sidebar{display:none}.page-wrap{padding:16px}}
  `]
})
export class BookListComponent implements OnInit {
  bookSvc = inject(BookService);
  cartSvc = inject(CartService);
  auth    = inject(AuthService);
  route   = inject(ActivatedRoute);
  router  = inject(Router);

  books: Book[] = []; categories: Category[] = [];
  filters: BookFilters = {}; sortKey = 'created_at-desc';
  loading = false; total = 0; currentPage = 1; totalPages = 1;
  toastMsg = ''; toastTimer: any;

  languages = ['English','Hindi','Bengali','Tamil','Telugu','Marathi','Gujarati','Kannada','Malayalam','Punjabi'];
  conditions = [
    { val:'new', label:'New' }, { val:'like_new', label:'Like New' },
    { val:'good', label:'Good' }, { val:'acceptable', label:'Acceptable' }
  ];

  coverBgs = [
    'linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)',
    'linear-gradient(135deg,#B5FFCA,#5FC97E)','linear-gradient(135deg,#FFB5C8,#FF6B8A)',
    'linear-gradient(135deg,#FFEDB5,#FFD460)','linear-gradient(135deg,#D4B5FF,#A06BFF)',
    'linear-gradient(135deg,#B5F0FF,#5FCFEF)','linear-gradient(135deg,#C5E8C5,#78C878)',
  ];
  bookEmojis = ['📖','📚','📘','📙','📗','📕','📓','📔'];

  ngOnInit() {
    this.bookSvc.getCategories().subscribe(r => this.categories = r.data || []);
    this.route.queryParams.subscribe(params => {
      this.filters = {
        search: params['search'] || '',
        category: params['category'] || '',
        min_price: params['min_price'] || undefined,
        max_price: params['max_price'] || undefined,
        language: params['language'] || '',
        condition: params['condition'] || '',
        sort: params['sort'] || 'created_at',
        order: (params['order'] as 'asc'|'desc') || 'desc',
        featured: params['featured'] === 'true' ? true : undefined,
      };
      this.sortKey = `${this.filters.sort}-${this.filters.order}`;
      this.currentPage = parseInt(params['page'] || '1');
      this.loadBooks();
    });
  }

  loadBooks() {
    this.loading = true;
    this.bookSvc.getBooks({ ...this.filters, page: this.currentPage, limit: 24 }).subscribe({
      next: r => {
        this.books = r.data || [];
        this.total = r.pagination?.total || 0;
        this.totalPages = r.pagination?.pages || 1;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.router.navigate([], { queryParams: this.cleanFilters(), queryParamsHandling: 'merge' });
  }

  cleanFilters() {
    const p: any = {};
    if (this.filters.search) p['search'] = this.filters.search;
    if (this.filters.category) p['category'] = this.filters.category;
    if (this.filters.min_price) p['min_price'] = this.filters.min_price;
    if (this.filters.max_price) p['max_price'] = this.filters.max_price;
    if (this.filters.language) p['language'] = this.filters.language;
    if (this.filters.condition) p['condition'] = this.filters.condition;
    if (this.filters.sort) p['sort'] = this.filters.sort;
    if (this.filters.order) p['order'] = this.filters.order;
    if (this.filters.featured) p['featured'] = 'true';
    return p;
  }

  onSortChange() {
    const [sort, order] = this.sortKey.split('-');
    this.filters.sort = sort; this.filters.order = order as 'asc'|'desc';
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {}; this.sortKey = 'created_at-desc'; this.currentPage = 1;
    this.router.navigate([], { queryParams: {} });
  }

  removeFilter(key: keyof BookFilters) {
    (this.filters as any)[key] = undefined;
    this.applyFilters();
  }

  hasActiveFilters() {
    return !!(this.filters.search || this.filters.category || this.filters.min_price || this.filters.max_price || this.filters.language);
  }

  goPage(p: number) {
    this.currentPage = p;
    this.router.navigate([], { queryParams: { ...this.cleanFilters(), page: p }, queryParamsHandling: 'merge' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  addToCart(b: Book) {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.cartSvc.addToCart(b.id).subscribe({
      next: () => this.showToast(`📚 "${b.title}" added to cart!`),
      error: err => this.showToast(err.error?.message || 'Failed to add to cart')
    });
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg = '', 2500);
  }

  coverBg(id: string) { return this.coverBgs[(id?.charCodeAt(0) || 0) % this.coverBgs.length]; }
  bookEmoji(b: Book) { return this.bookEmojis[(b.id?.charCodeAt(0) || 0) % this.bookEmojis.length]; }
  discount(b: Book) { return b.mrp > b.selling_price ? Math.round((1 - b.selling_price/b.mrp)*100) : 0; }
  stars(r: number) { const f=Math.floor(r||0); return '★'.repeat(f)+(r%1>=.5?'½':'')+'☆'.repeat(Math.max(0,5-f-(r%1>=.5?1:0))); }
  isNew(b: Book) { return new Date(b.created_at) > new Date(Date.now()-7*24*3600*1000); }
}
