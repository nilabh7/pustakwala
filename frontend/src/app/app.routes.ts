import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, sellerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'books',
    loadComponent: () => import('./features/books/book-list.component').then(m => m.BookListComponent)
  },
  {
    path: 'books/:slug',
    loadComponent: () => import('./features/books/book-detail.component').then(m => m.BookDetailComponent)
  },
  {
    path: 'categories/:slug',
    loadComponent: () => import('./features/books/book-list.component').then(m => m.BookListComponent)
  },

  // Auth routes
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login',    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password',  loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Buyer routes
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/buyer/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/buyer/order-detail.component').then(m => m.OrderDetailComponent)
  },
  {
    path: 'wishlist',
    canActivate: [authGuard],
    loadComponent: () => import('./features/buyer/wishlist.component').then(m => m.WishlistComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/buyer/profile.component').then(m => m.ProfileComponent)
  },

  // Seller routes
  {
    path: 'seller',
    children: [
      {
        path: 'register',
        canActivate: [authGuard],
        loadComponent: () => import('./features/seller/seller-register.component').then(m => m.SellerRegisterComponent)
      },
      {
        path: 'dashboard',
        canActivate: [authGuard, sellerGuard],
        loadComponent: () => import('./features/seller/seller-dashboard.component').then(m => m.SellerDashboardComponent)
      },
      {
        path: 'books',
        canActivate: [authGuard, sellerGuard],
        loadComponent: () => import('./features/seller/seller-books.component').then(m => m.SellerBooksComponent)
      },
      {
        path: 'books/new',
        canActivate: [authGuard, sellerGuard],
        loadComponent: () => import('./features/seller/book-form.component').then(m => m.BookFormComponent)
      },
      {
        path: 'books/:id/edit',
        canActivate: [authGuard, sellerGuard],
        loadComponent: () => import('./features/seller/book-form.component').then(m => m.BookFormComponent)
      },
      {
        path: 'orders',
        canActivate: [authGuard, sellerGuard],
        loadComponent: () => import('./features/seller/seller-orders.component').then(m => m.SellerOrdersComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard, sellerGuard],
        loadComponent: () => import('./features/seller/seller-profile.component').then(m => m.SellerProfileComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'sellers',   loadComponent: () => import('./features/admin/admin-sellers.component').then(m => m.AdminSellersComponent) },
      { path: 'sellers/:id', loadComponent: () => import('./features/admin/admin-seller-detail.component').then(m => m.AdminSellerDetailComponent) },
      { path: 'users',     loadComponent: () => import('./features/admin/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'orders',    loadComponent: () => import('./features/admin/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'books',     loadComponent: () => import('./features/admin/admin-books.component').then(m => m.AdminBooksComponent) },
      { path: 'coupons',   loadComponent: () => import('./features/admin/admin-coupons.component').then(m => m.AdminCouponsComponent) },
      { path: 'categories',loadComponent: () => import('./features/admin/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'audit-logs',loadComponent: () => import('./features/admin/admin-audit-logs.component').then(m => m.AdminAuditLogsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
