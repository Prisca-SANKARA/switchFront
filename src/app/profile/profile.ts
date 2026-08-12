import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../core/components/header/header';
import { AuthService } from '../auth/auth.service';
import { IUser } from '../core/models/auth.models';
import { passwordPolicyValidator } from '../core/validators/password.validator';
import { PasswordRequirementsComponent } from '../core/components/password-requirements/password-requirements';

/**
 * Page Profil : informations personnelles + section Sécurité
 * (statut MFA — obligatoire — et changement de mot de passe).
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, PasswordRequirementsComponent],
  template: `
    <app-header></app-header>

    <div class="profile-page">
      <!-- Identité -->
      <section class="card">
        <div class="identity">
          <div class="avatar">{{ initials() }}</div>
          <div>
            <h1>{{ user?.firstName }} {{ user?.lastName }}</h1>
            <p class="muted">{{ user?.email }}</p>
          </div>
        </div>
        <div class="info-grid">
          <div><span class="k">Nom d'utilisateur</span><span class="v">{{ user?.username }}</span></div>
          <div><span class="k">Email</span><span class="v">{{ user?.email }}</span></div>
          <div><span class="k">Prénom</span><span class="v">{{ user?.firstName }}</span></div>
          <div><span class="k">Nom</span><span class="v">{{ user?.lastName }}</span></div>
        </div>
      </section>

      <!-- Sécurité -->
      <section class="card">
        <h2>Sécurité</h2>

        <div class="row">
          <div>
            <h3>Authentification à deux facteurs (2FA)</h3>
            <p class="muted">Obligatoire — un code de votre application est demandé à chaque connexion.</p>
          </div>
          <span class="status on">✓ Activée</span>
        </div>

        <hr />

        <h3>Changer le mot de passe</h3>
        <div *ngIf="pwdError" class="error-message">{{ pwdError }}</div>
        <div *ngIf="pwdSuccess" class="info-message">{{ pwdSuccess }}</div>

        <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" class="pwd-form">
          <div class="form-group">
            <label for="current">Mot de passe actuel</label>
            <input id="current" type="password" formControlName="current" class="form-control"
                   autocomplete="current-password" />
          </div>
          <div class="form-group">
            <label for="new">Nouveau mot de passe</label>
            <input id="new" type="password" formControlName="newPassword" class="form-control"
                   autocomplete="new-password" />
            <app-password-requirements [value]="pwdForm.get('newPassword')?.value || ''"></app-password-requirements>
          </div>
          <div class="form-group">
            <label for="confirm">Confirmer</label>
            <input id="confirm" type="password" formControlName="confirm" class="form-control"
                   autocomplete="new-password" />
            <div *ngIf="pwdForm.get('confirm')?.touched && pwdForm.hasError('mismatch')" class="validation-error">
              Les mots de passe ne correspondent pas.
            </div>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="pwdForm.invalid || pwdLoading">
            {{ pwdLoading ? 'Modification…' : 'Mettre à jour le mot de passe' }}
          </button>
        </form>
      </section>
    </div>
  `,
  styles: [
    `
      .profile-page { max-width: 760px; margin: 0 auto; padding: clamp(1.5rem,4vw,2.75rem) clamp(1rem,4vw,2rem) 4rem; display: flex; flex-direction: column; gap: var(--sp-5, 24px); }
      .card { background: var(--surface,#fff); border: 1px solid var(--line,#e9e7f0); border-radius: var(--r-lg,20px); box-shadow: var(--sh-md,0 6px 18px rgba(76,29,149,.1)); padding: clamp(1.5rem,4vw,2.25rem); }
      .card h1 { font-size: 1.5rem; }
      .card h2 { font-size: 1.2rem; margin-bottom: 1rem; }
      .card h3 { font-size: 1rem; }
      .muted { color: var(--muted,#6b6780); font-size: 0.92rem; }
      .identity { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
      .avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--grad-brand, linear-gradient(135deg,#7c3aed,#6366f1,#ec4899)); color: #fff; display: grid; place-items: center; font-family: var(--font-display,sans-serif); font-weight: 800; font-size: 1.4rem; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
      .info-grid > div { display: flex; flex-direction: column; gap: 2px; }
      .info-grid .k { font-size: 0.78rem; text-transform: uppercase; letter-spacing: .05em; color: var(--faint,#9a95ac); font-family: var(--font-mono,monospace); }
      .info-grid .v { font-weight: 600; color: var(--ink,#1e1b2e); }
      .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
      .status { flex: none; font-family: var(--font-display,sans-serif); font-weight: 600; font-size: 0.85rem; padding: 5px 12px; border-radius: 999px; }
      .status.on { background: color-mix(in srgb, var(--success,#10b981) 15%, transparent); color: var(--success,#10b981); }
      hr { border: none; border-top: 1px solid var(--line,#e9e7f0); margin: 1.5rem 0; }
      .pwd-form { max-width: 420px; }
      .info-message { background: color-mix(in srgb, var(--success,#10b981) 10%, var(--surface,#fff)); border: 1px solid color-mix(in srgb, var(--success,#10b981) 35%, transparent); color: #0f7a54; border-radius: 12px; padding: 0.7rem 0.9rem; margin-bottom: 1rem; }
      @media (max-width: 520px) { .info-grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  user: IUser | null = null;

  pwdForm: FormGroup = this.fb.group(
    {
      current: ['', Validators.required],
      newPassword: ['', [Validators.required, passwordPolicyValidator]],
      confirm: ['', Validators.required],
    },
    {
      validators: (g) =>
        g.get('newPassword')?.value === g.get('confirm')?.value ? null : { mismatch: true },
    },
  );
  pwdLoading = false;
  pwdError: string | null = null;
  pwdSuccess: string | null = null;

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
  }

  initials(): string {
    const f = this.user?.firstName?.[0] ?? '';
    const l = this.user?.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
  }

  changePassword(): void {
    this.pwdError = null;
    this.pwdSuccess = null;
    if (this.pwdForm.invalid) {
      return;
    }
    this.pwdLoading = true;
    const { current, newPassword } = this.pwdForm.value;
    this.authService.changePassword(current, newPassword).subscribe({
      next: () => {
        this.pwdLoading = false;
        this.pwdSuccess = 'Mot de passe mis à jour.';
        this.pwdForm.reset();
      },
      error: (e) => {
        this.pwdLoading = false;
        this.pwdError = e.error?.message || 'Impossible de changer le mot de passe.';
      },
    });
  }
}
