import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">👤 My Profile</h1>
      <div class="profile-grid">
        <div class="panel">
          <h2 class="panel-title">Personal Information</h2>
          <div class="success-msg" *ngIf="saved">✅ Profile updated successfully!</div>
          <div class="form-row-2">
            <div class="form-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="firstName" name="firstName">
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="lastName" name="lastName">
            </div>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [value]="user()?.email" disabled class="disabled-input">
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" [(ngModel)]="phone" name="phone" placeholder="+91 9876543210">
          </div>
          <button class="btn-primary" (click)="save()" [disabled]="saving">
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
        <div class="panel">
          <h2 class="panel-title">Account Details</h2>
          <div class="info-row"><span>Role</span><strong class="role-badge role-{{ user()?.role }}">{{ user()?.role }}</strong></div>
          <div class="info-row"><span>Email Verified</span><strong>{{ user()?.is_email_verified ? '✅ Verified' : '❌ Not Verified' }}</strong></div>
          <div class="info-row" *ngIf="user()?.role === 'seller'">
            <span>Store Status</span>
            <strong class="status-{{ user()?.seller_status }}">{{ user()?.seller_status }}</strong>
          </div>
          <div class="panel-divider"></div>
          <h3 class="panel-subtitle">Change Password</h3>
          <div class="success-msg" *ngIf="pwSaved">✅ Password changed!</div>
          <div class="error-msg" *ngIf="pwError">{{ pwError }}</div>
          <div class="form-group">
            <label>Current Password</label>
            <input type="password" [(ngModel)]="currentPw" name="currentPw">
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" [(ngModel)]="newPw" name="newPw" placeholder="Min 8 characters">
          </div>
          <button class="btn-outline" (click)="changePw()" [disabled]="pwSaving">
            {{ pwSaving ? 'Changing…' : 'Change Password' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container{max-width:900px;margin:0 auto;padding:40px 24px}
    .page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:32px}
    .profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
    .panel{background:#FFFBF4;border:1px solid #E2D5BE;border-radius:12px;padding:24px}
    .panel-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:20px}
    .panel-subtitle{font-size:15px;font-weight:700;margin-bottom:14px}
    .panel-divider{border:none;border-top:1px solid #E2D5BE;margin:20px 0}
    .form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .form-group{margin-bottom:16px}
    .form-group label{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
    .form-group input{width:100%;padding:10px 14px;border:1.5px solid #E2D5BE;border-radius:8px;font-size:14px;background:#F5ECD7;outline:none;font-family:inherit;box-sizing:border-box}
    .form-group input:focus{border-color:#E8580A;background:#fff}
    .disabled-input{opacity:.6;cursor:not-allowed}
    .success-msg{background:#F0FFF4;color:#2D6A4F;border:1px solid #C3E6CB;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:14px}
    .error-msg{background:#FFEBEE;color:#C62828;border:1px solid #FFCDD2;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:14px}
    .btn-primary{padding:11px 24px;background:#E8580A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-outline{padding:11px 24px;background:transparent;color:#E8580A;border:1.5px solid #E8580A;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
    .info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F0E8D8;font-size:14px}
    .info-row:last-of-type{border-bottom:none}
    .info-row span{color:#7A6855}
    .role-badge{padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;text-transform:uppercase}
    .role-buyer{background:#E3F2FD;color:#1565C0}
    .role-seller{background:#F3E5F5;color:#6A1B9A}
    .role-admin{background:#FFF3E0;color:#E65100}
    @media(max-width:768px){.profile-grid{grid-template-columns:1fr}}
  `]
})
export class ProfileComponent implements OnInit {
  private auth    = inject(AuthService);
  private userSvc = inject(UserService);
  user = this.auth.currentUser;
  firstName = ''; lastName = ''; phone = '';
  saving = false; saved = false;
  currentPw = ''; newPw = '';
  pwSaving = false; pwSaved = false; pwError = '';

  ngOnInit() {
    const u = this.user();
    if (u) { this.firstName = u.first_name; this.lastName = u.last_name; this.phone = u.phone || ''; }
  }

  save() {
    this.saving = true; this.saved = false;
    this.userSvc.updateProfile({ first_name: this.firstName, last_name: this.lastName, phone: this.phone })
      .subscribe({ next: () => { this.saving = false; this.saved = true; this.auth.fetchMe().subscribe(); }, error: () => this.saving = false });
  }

  changePw() {
    this.pwSaving = true; this.pwSaved = false; this.pwError = '';
    this.auth.changePassword(this.currentPw, this.newPw).subscribe({
      next: () => { this.pwSaving = false; this.pwSaved = true; this.currentPw = ''; this.newPw = ''; },
      error: (err) => { this.pwError = err.error?.message || 'Failed'; this.pwSaving = false; }
    });
  }
}
