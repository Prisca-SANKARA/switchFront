// src/app/core/components/header/header.component.ts

import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signal exposé par AuthService : l'en-tête se met à jour automatiquement
  // à la connexion / déconnexion.
  readonly user = this.authService.currentUser;

  logout(): void {
    // Pourquoi : Appelle le service d'authentification pour supprimer le token.
    this.authService.logout();
    // Pourquoi : Redirige l'utilisateur vers la page de connexion.
    this.router.navigate(['/login']);
  }
}