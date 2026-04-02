import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;
  private readonly TOKEN_KEY = 'pw_token';
  private readonly REFRESH_KEY = 'pw_refresh';
  private readonly USER_KEY = 'pw_user';

  // Signals for reactive auth state
  currentUser = signal<User | null>(this.loadUser());
  isLoggedIn  = computed(() => !!this.currentUser());
  isAdmin     = computed(() => this.currentUser()?.role === 'admin');
  isSeller    = computed(() => this.currentUser()?.role === 'seller');
  isBuyer     = computed(() => this.currentUser()?.role === 'buyer');

  constructor(private http: HttpClient, private router: Router) {}

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/auth/register`, data).pipe(
      tap(res => this.storeSession(res.data))
    );
  }

  login(data: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/auth/login`, data).pipe(
      tap(res => this.storeSession(res.data))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<ApiResponse<{ accessToken: string }>> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<ApiResponse<{ accessToken: string }>>(`${this.API}/auth/refresh`, { refreshToken }).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.data.accessToken))
    );
  }

  fetchMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API}/auth/me`).pipe(
      tap(res => {
        this.currentUser.set(res.data);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
      })
    );
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.API}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post(`${this.API}/auth/reset-password`, { token, password });
  }

  verifyEmail(token: string) {
    return this.http.post(`${this.API}/auth/verify-email`, { token });
  }

  changePassword(current_password: string, new_password: string) {
    return this.http.put(`${this.API}/auth/change-password`, { current_password, new_password });
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  getRefreshToken(): string | null { return localStorage.getItem(this.REFRESH_KEY); }

  private storeSession(data: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.REFRESH_KEY, data.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    this.currentUser.set(data.user);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  redirectAfterLogin(): void {
    const user = this.currentUser();
    if (!user) return;
    if (user.role === 'admin') this.router.navigate(['/admin/dashboard']);
    else if (user.role === 'seller') this.router.navigate(['/seller/dashboard']);
    else this.router.navigate(['/']);
  }
}
