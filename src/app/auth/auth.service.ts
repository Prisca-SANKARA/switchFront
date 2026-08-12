// src/app/auth/auth.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ILoginRequest,
  IRegisterRequest,
  IAuthResponse,
  IUser,
  IMfaVerifyRequest,
} from '../core/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';

  private readonly ACCESS_KEY = 'accessToken';
  private readonly REFRESH_KEY = 'refreshToken';
  private readonly USER_KEY = 'currentUser';

  // Utilisateur courant exposé en signal (Angular 20) pour l'UI (header, etc.).
  private readonly _currentUser = signal<IUser | null>(this.readUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  constructor(private http: HttpClient) {}

  /**
   * Inscription. Le backend renvoie directement une paire de tokens (auto-login),
   * on ouvre donc la session immédiatement.
   */
  register(request: IRegisterRequest): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(tap((res) => this.saveSession(res)));
  }

  /**
   * Connexion.
   * - Sans MFA : le backend renvoie access + refresh -> session ouverte.
   * - Avec MFA : le backend renvoie mfaRequired=true + un mfaToken (aucun token
   *   définitif). On NE sauvegarde rien ; le composant login demandera le code
   *   puis appellera verifyMfa().
   */
  login(request: ILoginRequest): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(tap((res) => this.saveSession(res)));
  }

  /**
   * Second facteur : échange le mfaToken + le code TOTP contre les vrais tokens.
   */
  /** Vérifie l'email d'inscription via le jeton reçu, puis connecte (tokens). */
  verifyEmail(token: string): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/verify-email`, { token })
      .pipe(tap((res) => this.saveSession(res)));
  }

  verifyMfa(request: IMfaVerifyRequest): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/mfa/verify`, request)
      .pipe(tap((res) => this.saveSession(res)));
  }

  /**
   * Renouvelle la paire de tokens à partir du refresh token stocké.
   */
  refresh(): Observable<IAuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(tap((res) => this.saveSession(res)));
  }

  /** Invité : définit son mot de passe depuis le jeton reçu par email (active + connecte). */
  setPassword(token: string, password: string): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/set-password`, { token, password })
      .pipe(tap((res) => this.saveSession(res)));
  }

  /** Demande un email de réinitialisation (réponse toujours générique). */
  forgotPassword(email: string): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  /** Réinitialise le mot de passe depuis le jeton reçu par email (connecte). */
  resetPassword(token: string, password: string): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/reset-password`, { token, password })
      .pipe(tap((res) => this.saveSession(res)));
  }

  /** Change le mot de passe de l'utilisateur connecté (endpoint protégé). */
  changePassword(currentPassword: string, newPassword: string): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${environment.apiUrl}/account/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
  }

  /** Utilisé par l'intercepteur JWT : renvoie l'access token. */
  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getCurrentUser(): IUser | null {
    return this._currentUser();
  }

  /** Rafraîchit l'utilisateur courant depuis /me (ex : après activation MFA). */
  refreshCurrentUser(): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this._currentUser.set(user);
      }),
    );
  }

  /** Utilisé par l'Auth Guard. */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Persiste la session à partir d'une réponse d'auth. Ne fait rien si la
   * réponse ne contient pas d'access token (cas du challenge MFA).
   */
  private saveSession(res: IAuthResponse): void {
    if (!res || !res.accessToken) {
      return;
    }
    localStorage.setItem(this.ACCESS_KEY, res.accessToken);
    if (res.refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    }
    if (res.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      this._currentUser.set(res.user);
    }
  }

  private readUser(): IUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as IUser;
    } catch {
      return null;
    }
  }
}
