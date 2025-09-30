
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // Ajout des modules requis
  templateUrl: './login.html',
  styleUrl: './login.scss'
})

export class LoginComponent implements OnInit {

     // Injection des dépendances (Angular 20 style)
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  errorMessage: string | null = null; // Pour afficher les erreurs du backend

  ngOnInit(): void {
    // Pourquoi : Création du formulaire réactif pour la connexion.
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.errorMessage = 'Veuillez remplir correctement tous les champs.';
      return;
    }

    const request = this.loginForm.value;

    this.authService.login(request).subscribe({
      next: (response) => {
        console.log('Connexion réussie:', response);
        // Pourquoi : Redirection vers le tableau de bord après succès de la connexion.
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // Pourquoi : Gérer les erreurs de connexion (ex: identifiants invalides).
        console.error('Erreur de connexion:', err);
        // Afficher un message d'erreur plus convivial à l'utilisateur
        this.errorMessage = err.error?.message || 'Identifiants incorrects ou erreur serveur.';
      }
    });
  }
}
