// src/app/core/interceptors/jwt-interceptor.ts

import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

// État partagé (niveau module) pour coordonner un refresh unique :
// les requêtes qui tombent en 401 pendant un refresh en cours attendent
// le nouveau token au lieu de déclencher plusieurs refresh en parallèle.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

/** Les endpoints d'auth publics : un 401 ici n'est PAS une session expirée. */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/auth/');
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isApiUrl = req.url.startsWith(environment.apiUrl);
  const token = authService.getToken();

  const authReq = token && isApiUrl ? withToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const canRetry =
        error.status === 401 &&
        isApiUrl &&
        !isAuthEndpoint(req.url) &&
        !!authService.getRefreshToken();

      if (canRetry) {
        return handle401(req, next, authService, router);
      }
      return throwError(() => error);
    }),
  );
};

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<any> {
  // Un refresh est déjà en cours : on met la requête en attente du nouveau token.
  if (isRefreshing) {
    return refreshedToken$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((t) => next(withToken(req, t))),
    );
  }

  // On lance le refresh (et on invalide le token courant pour les suivants).
  isRefreshing = true;
  refreshedToken$.next(null);

  return authService.refresh().pipe(
    switchMap((res) => {
      isRefreshing = false;
      const newToken = res.accessToken ?? '';
      refreshedToken$.next(newToken);
      return next(withToken(req, newToken));
    }),
    catchError((err) => {
      // Refresh échoué (refresh token expiré/invalide) : déconnexion propre.
      isRefreshing = false;
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => err);
    }),
  );
}
