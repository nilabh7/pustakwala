import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/api.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <h1 class="page-title">❤️ My Wishlist</h1>
      <div class="loading-state" *ngIf="loading()">Loading wishlist…</div>
      <div class="empty-state" *ngIf="!loading() && !items().length">
        <div class="empty-icon">❤️</div>
        <h2>Your wishlist is empty</h2>
        <p>Save books you love to buy them later.</p>
        <a routerLink="/books" class="btn-primary">Explore Books</a>
      </div>
      <div class="book-grid" *ngIf="!loading() && items().length">
        <div *ngFor="let b of items()" class="book-card">
          <div class="book-cover" [style.background]="coverGrad(b.book_id)">📚</div>
          <div class="book-info">
            <a [routerLink]="['/books', b.slug]" class="btitle">{{ b.title }}</a>
            <div class="bauthor">{{ b.authors?.join(', ') }}</div>
            <div class="bprice"><span class="price-now">₹{{ b.selling_price }}</span></div>
            <div class="card-actions">
              <a [routerLink]="['/books', b.slug]" class="btn-view">View Book</a>
              <button (click)="remove(b.id)" class="btn-remove">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container{max-width:1280px;margin:0 auto;padding:40px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:32px}
    .loading-state,.empty-state{text-align:center;padding:60px;color:#7A6855}
    .empty-icon{font-size:60px;margin-bottom:16px}
    .empty-state h2{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-bottom:8px;color:#1A0F00}
    .btn-primary{background:#E8580A;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;margin-top:12px}
    .book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px}
    .book-card{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:10px;overflow:hidden;transition:.2s}
    .book-card:hover{border-color:#E8580A;transform:translateY(-2px)}
    .book-cover{height:200px;display:flex;align-items:center;justify-content:center;font-size:48px}
    .book-info{padding:12px 14px}
    .btitle{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;text-decoration:none;color:#1A0F00;display:block;margin-bottom:4px}
    .bauthor{font-size:12px;color:#7A6855;margin-bottom:8px}
    .price-now{font-size:16px;font-weight:700;color:#7A1E2E}
    .card-actions{display:flex;gap:6px;margin-top:10px}
    .btn-view{flex:1;padding:7px;background:#E8580A;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;text-align:center;cursor:pointer}
    .btn-remove{padding:7px 10px;background:#FFEBEE;color:#C62828;border:1px solid #FFCDD2;border-radius:6px;font-size:12px;cursor:pointer}
  `]
})
export class WishlistComponent implements OnInit {
  private cartSvc = inject(CartService);
  items   = signal<any[]>([]);
  loading = signal(true);
  ngOnInit() { this.load(); }
  load() { this.cartSvc.getWishlist().subscribe(r => { this.items.set(r.data); this.loading.set(false); }); }
  remove(wishlistId: string) { this.cartSvc.removeItem(wishlistId).subscribe(() => this.load()); }
  coverGrad(id: string): string {
    const g = ['linear-gradient(135deg,#FFD6B0,#FFA875)','linear-gradient(135deg,#B5DCFF,#6BB5F5)','linear-gradient(135deg,#B5FFCA,#5FC97E)'];
    return g[(parseInt(id?.replace(/-/g,'').slice(0,4)||'0',16)) % g.length];
  }
}
