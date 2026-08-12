import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAuthResponse, IMfaEnableResponse, IMfaSetupResponse } from '../models/auth.models';

/**
 * Gestion de la MFA (TOTP) par l'utilisateur authentifié.
 * Le jeton JWT est ajouté automatiquement par l'intercepteur.
 */
@Injectable({ providedIn: 'root' })
export class MfaService {
  private apiUrl = environment.apiUrl + '/mfa';
  private http = inject(HttpClient);

  /** Génère un secret + QR code (la MFA n'est pas encore active). */
  setup(): Observable<IMfaSetupResponse> {
    return this.http.post<IMfaSetupResponse>(`${this.apiUrl}/setup`, {});
  }

  /** Confirme le premier code TOTP, active la MFA et renvoie les codes de secours. */
  enable(code: string): Observable<IMfaEnableResponse> {
    return this.http.post<IMfaEnableResponse>(`${this.apiUrl}/enable`, { code });
  }

  /** Désactive la MFA après vérification d'un code. */
  disable(code: string): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.apiUrl}/disable`, { code });
  }
}
