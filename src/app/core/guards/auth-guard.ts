// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * Fonction Guard pour protéger les routes nécessitant une authentification.
 */
export const authGuard: CanActivateFn = (route, state) => {
  // 1. Injection des dépendances
  const authService = inject(AuthService);
  const router = inject(Router);

  // 2. Vérification de l'état d'authentification
  if (authService.isAuthenticated()) {
    // L'utilisateur a un token, il peut accéder à la page.
    return true;
  } else {
    // L'utilisateur n'est pas connecté.
    // 3. Redirection vers la page de connexion
    router.navigate(['/login']);
    // Bloque l'accès à la route demandée
    return false;
  }
};