import { Routes } from '@angular/router';
// ⚠️ CORRECTION : Le fichier est probablement nommé 'auth-guard.ts' ou 'auth-guard'
import { authGuard } from './core/guards/auth-guard'; 

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent) },
  { path: 'register',
      // Nous utilisons 'register' si votre fichier est nommé register.ts
      loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent) },

  // Routes protégées par l'AuthGuard
  {
    path: 'dashboard',
    // Nous utilisons 'dashboard' si votre fichier est nommé dashboard.ts
    loadComponent: () => import('./dashboard/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'calendar', // Route pour la page Calendrier
    loadComponent: () => import('./events/calendar-view/calendar-view').then(m => m.CalendarViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'events', // Route pour la page Mes Événements (Liste)
    loadComponent: () => import('./events/events-list/events-list').then(m => m.EventsListComponent),
    canActivate: [authGuard]
  },
  // Nous n'avons pas besoin d'une route '/new-event' distincte car nous utilisons la modale.

  { path: '**', redirectTo: 'login' }
];
