import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
          <div class="auth-title">
            {{ verificationMode ? 'Verify your email to activate your account' : 'Create your reader account' }}
          </div>
        </div>

        <div class="error-msg" *ngIf="error">{{ error }}</div>
        <div class="success-msg" *ngIf="success">{{ success }}</div>

        <ng-container *ngIf="!verificationMode; else otpStep">
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
                <button type="button" [class.active]="form.role === 'buyer'" (click)="form.role = 'buyer'">
                  Buy Books
                </button>
                <button type="button" [class.active]="form.role === 'seller'" (click)="form.role = 'seller'">
                  Sell Books
                </button>
              </div>
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ loading ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>
        </ng-container>

        <ng-template #otpStep>
          <div class="otp-copy">
            We sent a 6-digit OTP to <strong>{{ pendingEmail }}</strong>.
            Enter it below to finish setting up your account.
          </div>

          <form (ngSubmit)="onVerifyOtp()">
            <div class="form-group">
              <label>Verification OTP</label>
              <input
                type="text"
                [(ngModel)]="otp"
                name="otp"
                placeholder="123456"
                inputmode="numeric"
                maxlength="6"
                required>
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ loading ? 'Verifying...' : 'Verify Email' }}
            </button>

            <button type="button" class="btn-secondary" [disabled]="resending" (click)="onResendOtp()">
              {{ resending ? 'Sending new OTP...' : 'Resend OTP' }}
            </button>

            <button type="button" class="text-link" (click)="goBackToSignup()">
              Change email or signup details
            </button>
          </form>
        </ng-template>

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
    .otp-copy { background:#FFF8E8; color:#6B4E16; border:1px solid #F2D7A1;
      border-radius:10px; padding:14px; margin-bottom:18px; font-size:14px; line-height:1.5; }
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
    .btn-primary, .btn-secondary { width:100%; padding:13px; border:none; border-radius:8px;
      font-size:15px; font-weight:700; cursor:pointer; transition:.2s; font-family:inherit; }
    .btn-primary { background:#E8580A; color:#fff; margin-top:4px; }
    .btn-primary:hover:not(:disabled) { background:#7A1E2E; }
    .btn-secondary { background:#F5ECD7; color:#7A1E2E; border:1.5px solid #E2D5BE; margin-top:10px; }
    .btn-secondary:hover:not(:disabled) { background:#EFE0C1; }
    .btn-primary:disabled, .btn-secondary:disabled { opacity:.6; cursor:not-allowed; }
    .text-link { display:block; margin:14px auto 0; background:none; border:none; color:#E8580A;
      font-weight:600; cursor:pointer; text-align:center; font-family:inherit; }
    .auth-footer { text-align:center; margin-top:18px; font-size:14px; color:#7A6855; }
    .link { color:#E8580A; text-decoration:none; font-weight:600; }
  `]
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form = { first_name: '', last_name: '', email: '', phone: '', password: '', role: 'buyer' as 'buyer' | 'seller' };
  loading = false;
  resending = false;
  error = '';
  success = '';
  verificationMode = false;
  pendingEmail = '';
  otp = '';

  onRegister() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.register(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        this.pendingEmail = res.data.email;
        this.verificationMode = !!res.data.verificationRequired;
        this.otp = '';
        this.success = `Account created. Enter the OTP sent to ${res.data.email}. It expires in ${res.data.expiresInMinutes} minutes.`;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }

  onVerifyOtp() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.verifyEmail({ email: this.pendingEmail, otp: this.otp.trim() }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message || 'Email verified successfully. You can sign in now.';
        this.router.navigate(['/auth/login'], {
          state: {
            verifiedEmail: this.pendingEmail,
            successMessage: this.success
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'OTP verification failed';
      }
    });
  }

  onResendOtp() {
    this.resending = true;
    this.error = '';
    this.success = '';

    this.auth.resendVerificationOtp(this.pendingEmail).subscribe({
      next: (res) => {
        this.resending = false;
        const expiryText = res.data?.expiresInMinutes ? ` It expires in ${res.data.expiresInMinutes} minutes.` : '';
        this.success = `${res.message || 'A new verification OTP has been sent.'}${expiryText}`;
      },
      error: (err) => {
        this.resending = false;
        this.error = err.error?.message || 'Could not resend OTP';
      }
    });
  }

  goBackToSignup() {
    this.verificationMode = false;
    this.otp = '';
    this.error = '';
    this.success = '';
  }
}
