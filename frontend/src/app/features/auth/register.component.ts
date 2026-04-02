import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-name">Pustakwala</div>
          <div class="auth-title">Join millions of readers 📚</div>
        </div>
        <div class="error-msg" *ngIf="error">{{ error }}</div>
        <div class="success-msg" *ngIf="success">{{ success }}</div>
        <form (ngSubmit)="onRegister()">
          <div class="form-row-2">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="form.first_name" name="first_name" placeholder="Arjun" required>
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="form.last_name" name="last_name" placeholder="Sharma" required>
            </div>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="form.email" name="email" placeholder="arjun@example.com" required>
          </div>
          <div class="form-group">
            <label>Phone (optional)</label>
            <input type="tel" [(ngModel)]="form.phone" name="phone" placeholder="9876543210">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="form.password" name="password" placeholder="Min 8 characters" required>
          </div>
          <div class="form-group">
            <label>I want to</label>
            <div class="role-toggle">
              <button type="button" [class.active]="form.role==='buyer'" (click)="form.role='buyer'">
                🛒 Buy Books
              </button>
              <button type="button" [class.active]="form.role==='seller'" (click)="form.role='seller'">
                📦 Sell Books
              </button>
            </div>
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Creating account…' : 'Create Account' }}
          </button>
        </form>
        <div class="auth-footer">
          Already have an account? <a routerLink="/auth/login" class="link">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center;
      background:linear-gradient(135deg,#7A1E2E,#1A0810); padding:24px; }
    .auth-card { background:#FDF6EC; border-radius:16px; padding:40px;
      width:100%; max-width:460px; box-shadow:0 24px 64px rgba(0,0,0,.3); }
    .auth-logo { text-align:center; margin-bottom:24px; }
    .logo-name { font-family:'Playfair Display',serif; font-size:26px; font-weight:900; color:#E8580A; }
    .auth-title { font-size:15px; color:#7A6855; margin-top:4px; }
    .error-msg { background:#FFF0F0; color:#C0392B; border:1px solid #FFCDD2;
      border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:13px; }
    .success-msg { background:#F0FFF4; color:#276749; border:1px solid #9AE6B4;
      border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:13px; }
    .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .form-group { margin-bottom:16px; }
    .form-group label { display:block; font-size:13px; font-weight:600; color:#1A0F00; margin-bottom:5px; }
    .form-group input { width:100%; padding:10px 13px; border:1.5px solid #E2D5BE;
      border-radius:8px; font-size:14px; background:#F5ECD7; outline:none;
      font-family:inherit; transition:.2s; box-sizing:border-box; }
    .form-group input:focus { border-color:#E8580A; background:#fff; }
    .role-toggle { display:flex; gap:10px; }
    .role-toggle button { flex:1; padding:10px; border:1.5px solid #E2D5BE;
      border-radius:8px; background:#F5ECD7; font-size:13px; font-weight:600;
      cursor:pointer; transition:.2s; font-family:inherit; color:#1A0F00; }
    .role-toggle button.active { background:#E8580A; color:#fff; border-color:#E8580A; }
    .btn-primary { width:100%; padding:13px; background:#E8580A; color:#fff;
      border:none; border-radius:8px; font-size:15px; font-weight:700;
      cursor:pointer; transition:.2s; font-family:inherit; margin-top:4px; }
    .btn-primary:hover:not(:disabled) { background:#7A1E2E; }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    .auth-footer { text-align:center; margin-top:18px; font-size:14px; color:#7A6855; }
    .link { color:#E8580A; text-decoration:none; font-weight:600; }
  `]
})
export class RegisterComponent {
  auth = inject(AuthService);
  form = { first_name:'', last_name:'', email:'', phone:'', password:'', role:'buyer' as 'buyer'|'seller' };
  loading = false; error = ''; success = '';

  onRegister() {
    this.loading = true; this.error = '';
    this.auth.register(this.form).subscribe({
      next: () => this.auth.redirectAfterLogin(),
      error: err => { this.error = err.error?.message || 'Registration failed'; this.loading = false; }
    });
  }
}
