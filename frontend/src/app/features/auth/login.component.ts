import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-name">Pustakwala</div>
          <div class="auth-title">Welcome back, Reader</div>
        </div>

        <div class="error-msg" *ngIf="error">{{ error }}</div>
        <div class="success-msg" *ngIf="success">{{ success }}</div>

        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <div class="pw-wrap">
              <input
                [type]="showPw ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="........"
                required
              >
              <button type="button" class="pw-toggle" (click)="showPw = !showPw">
                {{ showPw ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>
          <div class="form-row">
            <a routerLink="/auth/forgot-password" class="link">Forgot password?</a>
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/auth/register" class="link">Create one</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center;
      background:linear-gradient(135deg,#7A1E2E,#1A0810); padding:24px; }
    .auth-card { background:#FDF6EC; border-radius:16px; padding:40px;
      width:100%; max-width:420px; box-shadow:0 24px 64px rgba(0,0,0,.3); }
    .auth-logo { text-align:center; margin-bottom:28px; }
    .logo-name { font-family:'Playfair Display',serif; font-size:28px;
      font-weight:900; color:#E8580A; }
    .auth-title { font-size:16px; color:#7A6855; margin-top:6px; }
    .error-msg { background:#FFF0F0; color:#C0392B; border:1px solid #FFCDD2;
      border-radius:8px; padding:12px; margin-bottom:16px; font-size:14px; }
    .success-msg { background:#F0FFF4; color:#276749; border:1px solid #9AE6B4;
      border-radius:8px; padding:12px; margin-bottom:16px; font-size:14px; }
    .form-group { margin-bottom:18px; }
    .form-group label { display:block; font-size:13px; font-weight:600;
      color:#1A0F00; margin-bottom:6px; }
    .form-group input { width:100%; padding:11px 14px; border:1.5px solid #E2D5BE;
      border-radius:8px; font-size:14px; background:#F5ECD7; outline:none;
      font-family:inherit; transition:.2s; box-sizing:border-box; }
    .form-group input:focus { border-color:#E8580A; background:#fff; }
    .pw-wrap { position:relative; }
    .pw-wrap input { padding-right:66px; }
    .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer; font-size:12px; font-weight:700; color:#7A1E2E; }
    .form-row { display:flex; justify-content:flex-end; margin-bottom:20px; }
    .link { color:#E8580A; text-decoration:none; font-size:13px; font-weight:600; }
    .link:hover { text-decoration:underline; }
    .btn-primary { width:100%; padding:13px; background:#E8580A; color:#fff;
      border:none; border-radius:8px; font-size:15px; font-weight:700;
      cursor:pointer; transition:.2s; font-family:inherit; }
    .btn-primary:hover:not(:disabled) { background:#7A1E2E; }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    .auth-footer { text-align:center; margin-top:20px; font-size:14px; color:#7A6855; }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);
  email = '';
  password = '';
  showPw = false;
  loading = false;
  error = '';
  success = '';

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { verifiedEmail?: string; successMessage?: string } | undefined;
    if (state?.verifiedEmail) this.email = state.verifiedEmail;
    if (state?.successMessage) this.success = state.successMessage;
  }

  onLogin() {
    this.loading = true;
    this.error = '';
    this.success = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.auth.redirectAfterLogin(),
      error: (err) => {
        this.error = err.error?.message || 'Login failed';
        this.loading = false;
      }
    });
  }
}
