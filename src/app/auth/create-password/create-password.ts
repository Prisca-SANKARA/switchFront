import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { passwordPolicyValidator } from '../../core/validators/password.validator';
import { PasswordRequirementsComponent } from '../../core/components/password-requirements/password-requirements';

type Mode = 'invite' | 'reset';

/**
 * Écran unique pour :
 *  - /set-password  (mode 'invite') : un invité active son compte ;
 *  - /reset-password (mode 'reset')  : un utilisateur réinitialise son mot de passe.
 * Le jeton est lu dans le query param ?token=…
 */
@Component({
  selector: 'app-create-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordRequirementsComponent],
  template: `
    <div class="auth-shell">
      <aside class="auth-brand">
        <div class="brand-logo"><span class="dot"></span> e-Agenda</div>
        <div>
          <h1 class="brand-headline">{{ mode === 'invite' ? 'Activez votre compte.' : 'Choisissez un nouveau mot de passe.' }}</h1>
          <p class="brand-sub">
            {{ mode === 'invite'
              ? 'Définissez votre mot de passe pour accéder à l’événement auquel vous avez été invité(e).'
              : 'Créez un mot de passe sûr pour sécuriser votre compte.' }}
          </p>
        </div>
        <span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>
      </aside>

      <main class="auth-main">
        <div class="auth-card">
          <h2 class="card-title">{{ mode === 'invite' ? 'Bienvenue 🎉' : 'Nouveau mot de passe 🔒' }}</h2>
          <p class="card-subtitle">Votre mot de passe doit respecter les règles ci-dessous.</p>

          <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>

          <div *ngIf="!token" class="error-message">
            Lien invalide : jeton manquant. Vérifiez le lien reçu par email.
          </div>

          <form *ngIf="token" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input id="password" type="password" formControlName="password" class="form-control"
                     placeholder="••••••••" autocomplete="new-password">
              <app-password-requirements [value]="form.get('password')?.value || ''"></app-password-requirements>
            </div>

            <div class="form-group">
              <label for="confirm">Confirmer le mot de passe</label>
              <input id="confirm" type="password" formControlName="confirm" class="form-control"
                     placeholder="••••••••" autocomplete="new-password">
              <div *ngIf="form.get('confirm')?.touched && form.hasError('mismatch')" class="validation-error">
                Les mots de passe ne correspondent pas.
              </div>
            </div>

            <button type="submit" [disabled]="form.invalid || loading" class="btn btn-primary btn-block">
              {{ loading ? 'Validation…' : (mode === 'invite' ? 'Activer mon compte' : 'Réinitialiser') }}
            </button>
          </form>

          <p class="auth-switch"><a routerLink="/login">← Retour à la connexion</a></p>
        </div>
      </main>
    </div>
  `,
})
export class CreatePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  mode: Mode = 'reset';
  token: string | null = null;
  loading = false;
  errorMessage: string | null = null;

  form: FormGroup = this.fb.group(
    {
      password: ['', [Validators.required, passwordPolicyValidator]],
      confirm: ['', [Validators.required]],
    },
    { validators: (group) => (group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true }) },
  );

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as Mode) || 'reset';
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.form.invalid || !this.token) {
      return;
    }
    this.loading = true;
    const password = this.form.value.password;
    const call =
      this.mode === 'invite'
        ? this.authService.setPassword(this.token, password)
        : this.authService.resetPassword(this.token, password);

    call.subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Lien invalide ou expiré.';
      },
    });
  }
}
