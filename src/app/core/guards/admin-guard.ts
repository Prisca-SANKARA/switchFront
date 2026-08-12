import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * Réserve une route aux administrateurs. À placer APRÈS authGuard et mfaGuard.
 * Un non-admin est renvoyé vers le tableau de bord.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();
  if (user && user.role === 'ADMIN') {
    return true;
  }
  router.navigate(['/dashboard']);
  return false;
};
