// src/app/core/interceptors/jwt.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Pourquoi : L'intercepteur doit être sélectif. Nous n'ajoutons le token
  // que si un token est disponible ET si la requête vise notre API backend.
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  if (token && isApiUrl) {
    // Pourquoi : Cloner la requête pour ajouter le header d'autorisation requis par Spring Security.
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  // Si pas de token ou si ce n'est pas notre API (ex: appel à une API tierce),
  // on laisse la requête passer sans modification.
  return next(req);
};