import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * MFA obligatoire : tout utilisateur authentifié dont la MFA n'est pas encore
 * activée est redirigé de force vers l'écran de configuration (/mfa-setup).
 * Il ne peut pas accéder au reste de l'application tant que ce n'est pas fait.
 * À placer APRÈS authGuard sur les routes protégées.
 */
export const mfaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  if (authService.isAuthenticated() && user && !user.mfaEnabled) {
    router.navigate(['/mfa-setup']);
    return false;
  }
  return true;
};
