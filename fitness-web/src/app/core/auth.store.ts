import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API } from './api';
import { AuthResponse, LoginRequest, RegisterRequest, Session } from './models';

const STORAGE_KEY = 'fitness.session';

/**
 * Global auth state (signals).
 * Keeps the logged-in user and JWT token, saves them in localStorage
 * so the user stays logged in after a page refresh.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session = signal<Session | null>(this.restore());

  readonly session = this._session.asReadonly();
  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly isAdmin = computed(() => this._session()?.role === 'Admin');
  readonly userId = computed(() => this._session()?.userID ?? 0);
  readonly userName = computed(() => this._session()?.userName ?? '');
  readonly token = computed(() => this._session()?.token ?? null);

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/Auth/login`, body).pipe(tap((res) => this.start(res)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/Auth/register`, body).pipe(tap((res) => this.start(res)));
  }

  /** Called after the user changes their name in Profile */
  updateName(userName: string): void {
    const s = this._session();
    if (!s) return;
    this.save({ ...s, userName });
  }

  logout(reason?: 'expired'): void {
    this._session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    this.router.navigate(['/login'], reason ? { queryParams: { reason } } : undefined);
  }

  private start(res: AuthResponse): void {
    this.save({ ...res, exp: readExpiry(res.token) });
  }

  private save(session: Session): void {
    this._session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* storage unavailable: session lives in memory only */
    }
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      // Expired token -> start logged out
      if (!session.token || session.exp * 1000 < Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
}

/** Reads the "exp" claim from a JWT (seconds since 1970). */
function readExpiry(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(payload));
    return typeof json.exp === 'number' ? json.exp : 0;
  } catch {
    return 0;
  }
}
