import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  mfaForm!: FormGroup;
  errorMessage: string | null = null;

  // Passe en mode "second facteur" quand le backend renvoie mfaRequired=true.
  mfaRequired = false;
  private mfaToken: string | null = null;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.mfaForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.errorMessage = 'Veuillez remplir correctement tous les champs.';
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.mfaRequired && response.mfaToken) {
          // Étape 1 validée (mot de passe). On demande le code à 6 chiffres.
          this.mfaRequired = true;
          this.mfaToken = response.mfaToken;
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erreur de connexion:', err);
        this.errorMessage = err.error?.message || 'Identifiants incorrects ou erreur serveur.';
      },
    });
  }

  onVerifyMfa(): void {
    this.errorMessage = null;

    if (this.mfaForm.invalid || !this.mfaToken) {
      this.errorMessage = 'Entrez le code à 6 chiffres de votre application.';
      return;
    }

    this.authService
      .verifyMfa({ mfaToken: this.mfaToken, code: this.mfaForm.value.code })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          console.error('Erreur MFA:', err);
          this.errorMessage = err.error?.message || 'Code incorrect ou expiré.';
        },
      });
  }

  /** Revenir à l'écran mot de passe (annuler la MFA en cours). */
  cancelMfa(): void {
    this.mfaRequired = false;
    this.mfaToken = null;
    this.errorMessage = null;
    this.mfaForm.reset();
  }
}
