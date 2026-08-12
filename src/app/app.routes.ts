import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { mfaGuard } from './core/guards/mfa-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent) },
  { path: 'register',
      loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent) },

  { path: 'forgot-password',
      loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'set-password', data: { mode: 'invite' },
      loadComponent: () => import('./auth/create-password/create-password').then(m => m.CreatePasswordComponent) },
  { path: 'reset-password', data: { mode: 'reset' },
      loadComponent: () => import('./auth/create-password/create-password').then(m => m.CreatePasswordComponent) },
  { path: 'verify-email',
      loadComponent: () => import('./auth/verify-email/verify-email').then(m => m.VerifyEmailComponent) },

  // Configuration MFA OBLIGATOIRE (première connexion) : authGuard seul, PAS mfaGuard (sinon boucle).
  {
    path: 'mfa-setup',
    loadComponent: () => import('./auth/mfa-setup/mfa-setup').then(m => m.MfaSetupComponent),
    canActivate: [authGuard]
  },

  // Routes protégées : authentifié ET MFA configurée (sinon redirigé vers /mfa-setup).
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard, mfaGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./events/calendar-view/calendar-view').then(m => m.CalendarViewComponent),
    canActivate: [authGuard, mfaGuard]
  },
  {
    path: 'events',
    loadComponent: () => import('./events/events-list/events-list').then(m => m.EventsListComponent),
    canActivate: [authGuard, mfaGuard]
  },
  {
    path: 'profile', // Profil : infos perso + Sécurité (MFA, mot de passe)
    loadComponent: () => import('./profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard, mfaGuard]
  },
  {
    path: 'admin', // Back-office : réservé aux administrateurs
    loadComponent: () => import('./admin/admin').then(m => m.AdminComponent),
    canActivate: [authGuard, mfaGuard, adminGuard]
  },

  { path: '**', redirectTo: 'login' }
];
