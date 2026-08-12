import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <aside class="auth-brand">
        <div class="brand-logo"><span class="dot"></span> e-Agenda</div>
        <div>
          <h1 class="brand-headline">Mot de passe oublié ? Aucun souci.</h1>
          <p class="brand-sub">
            Indiquez votre email : si un compte existe, vous recevrez un lien pour définir un
            nouveau mot de passe.
          </p>
        </div>
        <span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>
      </aside>

      <main class="auth-main">
        <div class="auth-card">
          <h2 class="card-title">Réinitialiser 🔑</h2>
          <p class="card-subtitle">On vous envoie un lien par email.</p>

          <div *ngIf="sent" class="info-message">
            {{ message }}
          </div>

          <form *ngIf="!sent" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" class="form-control"
                     placeholder="vous@exemple.com">
              <div *ngIf="form.get('email')?.invalid && form.get('email')?.touched" class="validation-error">
                Veuillez entrer un email valide.
              </div>
            </div>
            <button type="submit" [disabled]="form.invalid || loading" class="btn btn-primary btn-block">
              {{ loading ? 'Envoi…' : 'Envoyer le lien' }}
            </button>
          </form>

          <p class="auth-switch"><a routerLink="/login">← Retour à la connexion</a></p>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .info-message {
        background: color-mix(in srgb, var(--success, #10b981) 10%, var(--surface, #fff));
        border: 1px solid color-mix(in srgb, var(--success, #10b981) 35%, transparent);
        color: #0f7a54;
        border-radius: var(--r-md, 14px);
        padding: 0.9rem 1rem;
        font-size: 0.92rem;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  loading = false;
  sent = false;
  message = '';

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.sent = true;
        this.message = res.message || 'Si un compte existe, un email vient d’être envoyé.';
      },
      error: () => {
        // Même en cas d'erreur on reste générique (anti-énumération).
        this.loading = false;
        this.sent = true;
        this.message = 'Si un compte existe pour cet email, un lien vient d’être envoyé.';
      },
    });
  }
}
