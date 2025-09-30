// src/app/core/components/header/header.component.ts

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Pourrait être stocké dans le service et lu ici. 
  // Pour l'instant, on prend les infos stockées lors du login.
  // Idéalement, on utiliserait un BehaviorSubject dans AuthService pour les maintenir à jour.
  userName: string | null = localStorage.getItem('userFirstname'); // Nom de l'utilisateur connecté
  userLastname: string | null = localStorage.getItem('userLastname');

  constructor() {
    // Si vous avez stocké le prénom et le nom lors du login (dans AuthService),
    // vous pouvez les lire ici. Si non, nous devrons modifier AuthService pour le faire.
  }

  logout(): void {
    // Pourquoi : Appelle le service d'authentification pour supprimer le token.
    this.authService.logout();
    // Pourquoi : Redirige l'utilisateur vers la page de connexion.
    this.router.navigate(['/login']);
  }
}