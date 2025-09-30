// src/app/auth/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ILoginRequest, IRegisterRequest, IAuthResponse } from '../core/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'jwtToken'; // Clé pour le stockage local

     private readonly FIRSTNAME_KEY = 'userFirstname';
    private readonly LASTNAME_KEY = 'userLastname';

  constructor(private http: HttpClient) { }

  /**
   * Enregistre un nouvel utilisateur.
   * @param request Les données d'inscription (nom, prénom, email, mot de passe).
   */
  register(request: IRegisterRequest): Observable<IAuthResponse> {
    // Pourquoi : Appel POST vers l'endpoint Spring Boot pour la création de compte.
    return this.http.post<IAuthResponse>(`${this.apiUrl}/register`, request).pipe(
      // Stocke immédiatement le token après une inscription réussie pour connecter l'utilisateur
      tap(response => this.saveToken(response.token))
    );
  }

  /**
   * Connecte l'utilisateur.
   * @param request Les données de connexion (email, mot de passe).
   */
  login(request: ILoginRequest): Observable<IAuthResponse> {
    // Pourquoi : Appel POST vers l'endpoint Spring Boot pour l'authentification.
    return this.http.post<IAuthResponse>(`${this.apiUrl}/login`, request).pipe(
      // tap : opérateur RxJS pour effectuer une action (ici, le stockage) sans modifier le flux de données.
      tap(response => {
        this.saveToken(response.token);

       localStorage.setItem(this.FIRSTNAME_KEY, response.firstname);
        localStorage.setItem(this.LASTNAME_KEY, response.lastname);
      })
    );
  }

  /**
   * Déconnecte l'utilisateur et efface le token.
   * Pourquoi : Réinitialise l'état d'authentification dans le navigateur.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Sauvegarde le token JWT dans le localStorage.
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
     localStorage.removeItem(this.FIRSTNAME_KEY);
    localStorage.removeItem(this.LASTNAME_KEY);
  }

  /**
   * Récupère le token JWT stocké.
   * Pourquoi : Le JWT Interceptor en aura besoin pour sécuriser les requêtes.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Vérifie si l'utilisateur est connecté (présence du token).
   * Pourquoi : Utilisé par l'Auth Guard pour protéger les routes.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    // ⚠️ TODO : Implémenter une vérification de l'expiration du token si nécessaire
    return !!token;
  }
}