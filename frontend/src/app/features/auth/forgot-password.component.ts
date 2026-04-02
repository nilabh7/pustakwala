import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-name">Pustakwala</div>
          <div class="auth-title">Reset your password</div>
        </div>
        <div class="success-msg" *ngIf="sent">
          ✅ If that email exists, a reset link has been sent. Check your inbox.
        </div>
        <form (ngSubmit)="onSubmit()" *ngIf="!sent">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required>
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Sending…' : 'Send Reset Link' }}
          </button>
        </form>
        <div class="auth-footer"><a routerLink="/auth/login" class="link">← Back to Login</a></div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7A1E2E,#1A0810);padding:24px}
    .auth-card{background:#FDF6EC;border-radius:16px;padding:40px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.3)}
    .auth-logo{text-align:center;margin-bottom:24px}
    .logo-name{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;color:#E8580A}
    .auth-title{font-size:15px;color:#7A6855;margin-top:4px}
    .success-msg{background:#F0FFF4;color:#276749;border:1px solid #9AE6B4;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px}
    .form-group{margin-bottom:18px}
    .form-group label{display:block;font-size:13px;font-weight:600;color:#1A0F00;margin-bottom:5px}
    .form-group input{width:100%;padding:11px 14px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#F5ECD7;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box}
    .form-group input:focus{border-color:#E8580A;background:#fff}
    .btn-primary{width:100%;padding:13px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .auth-footer{text-align:center;margin-top:18px}
    .link{color:#E8580A;text-decoration:none;font-weight:600;font-size:13px}
  `]
})
export class ForgotPasswordComponent {
  auth = inject(AuthService);
  email = ''; loading = false; sent = false;
  onSubmit() {
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.sent = true; this.loading = false; }
    });
  }
}

// ── RESET PASSWORD ────────────────────────────────────────────
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-name">Pustakwala</div>
          <div class="auth-title">Set a new password</div>
        </div>
        <div class="error-msg" *ngIf="error">{{ error }}</div>
        <div class="success-msg" *ngIf="done">✅ Password reset! <a routerLink="/auth/login" class="link">Sign in</a></div>
        <form (ngSubmit)="onReset()" *ngIf="!done">
          <div class="form-group">
            <label>New Password</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="Min 8 characters" required>
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Resetting…' : 'Reset Password' }}
          </button>
        </form>
        <div class="auth-footer"><a routerLink="/auth/login" class="link">← Back to Login</a></div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7A1E2E,#1A0810);padding:24px}
    .auth-card{background:#FDF6EC;border-radius:16px;padding:40px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.3)}
    .auth-logo{text-align:center;margin-bottom:24px}
    .logo-name{font-family:'Playfair Display',serif;font-size:26px;font-weight:900;color:#E8580A}
    .auth-title{font-size:15px;color:#7A6855;margin-top:4px}
    .error-msg{background:#FFF0F0;color:#C0392B;border:1px solid #FFCDD2;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px}
    .success-msg{background:#F0FFF4;color:#276749;border:1px solid #9AE6B4;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px}
    .form-group{margin-bottom:18px}
    .form-group label{display:block;font-size:13px;font-weight:600;color:#1A0F00;margin-bottom:5px}
    .form-group input{width:100%;padding:11px 14px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#F5ECD7;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box}
    .form-group input:focus{border-color:#E8580A;background:#fff}
    .btn-primary{width:100%;padding:13px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .auth-footer{text-align:center;margin-top:18px}
    .link{color:#E8580A;text-decoration:none;font-weight:600;font-size:13px}
  `]
})
export class ResetPasswordComponent {
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  password = ''; loading = false; done = false; error = '';
  token = '';
  ngOnInit() { this.token = this.route.snapshot.queryParamMap.get('token') || ''; }
  onReset() {
    this.loading = true; this.error = '';
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => { this.done = true; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Reset failed'; this.loading = false; }
    });
  }
}
