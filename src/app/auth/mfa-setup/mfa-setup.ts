import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MfaService } from '../../core/services/mfa.service';
import { AuthService } from '../auth.service';
import { IMfaSetupResponse } from '../../core/models/auth.models';

/**
 * Écran de configuration MFA OBLIGATOIRE, imposé à la première connexion
 * (via mfaGuard). Tant que l'utilisateur n'a pas activé la 2FA, il est bloqué ici.
 */
@Component({
  selector: 'app-mfa-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-shell">
      <aside class="auth-brand">
        <div class="brand-logo"><span class="dot"></span> e-Agenda</div>
        <div>
          <h1 class="brand-headline">Sécurisez votre compte.</h1>
          <p class="brand-sub">
            Pour protéger votre agenda, l'authentification à deux facteurs est
            requise. Scannez le QR code avec Google Authenticator, Authy ou une
            application équivalente, puis saisissez le code généré.
          </p>
          <ul class="brand-points">
            <li><span class="tick">1</span> Installez une app d'authentification</li>
            <li><span class="tick">2</span> Scannez le QR code</li>
            <li><span class="tick">3</span> Entrez le code à 6 chiffres</li>
          </ul>
        </div>
        <span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>
      </aside>

      <main class="auth-main">
        <div class="auth-card">
          <h2 class="card-title">Activation obligatoire 🔐</h2>
          <p class="card-subtitle">Dernière étape avant d'accéder à votre espace.</p>

          <div *ngIf="error" class="error-message">{{ error }}</div>

          <div *ngIf="loadingSetup" class="muted">Préparation de la configuration…</div>

          <div *ngIf="setupData && !recoveryCodes">
            <img [src]="setupData.qrCodeDataUri" alt="QR code 2FA" class="qr" />
            <p class="secret">Clé manuelle : <code>{{ setupData.secret }}</code></p>

            <div class="form-group">
              <label for="code">Code de vérification</label>
              <input id="code" type="text" inputmode="numeric" maxlength="6" [(ngModel)]="code"
                     class="form-control code-input" autocomplete="one-time-code" placeholder="123456" />
            </div>

            <button class="btn btn-primary btn-block" (click)="confirm()" [disabled]="loading || code.length !== 6">
              {{ loading ? 'Activation…' : 'Activer la 2FA' }}
            </button>
          </div>

          <!-- Codes de secours affichés UNE seule fois après activation -->
          <div *ngIf="recoveryCodes">
            <p style="color:#2f7a4f;font-weight:600;">✅ 2FA activée !</p>
            <p>Conservez ces <strong>codes de secours</strong> en lieu sûr. Chacun est utilisable
              <strong>une seule fois</strong> pour vous connecter si vous perdez votre téléphone.</p>
            <ul class="codes">
              <li *ngFor="let c of recoveryCodes"><code>{{ c }}</code></li>
            </ul>
            <p class="muted" style="font-size:13px;">Ils ne seront plus affichés. Notez-les maintenant.</p>
            <button class="btn btn-primary btn-block" (click)="continueToApp()">J'ai sauvegardé mes codes — continuer</button>
          </div>

          <p *ngIf="!recoveryCodes" class="auth-switch">
            <a href="javascript:void(0)" (click)="logout()">Se déconnecter</a>
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .qr { width: 190px; height: 190px; border: 1px solid var(--line, #e9e7f0); border-radius: 14px; padding: 8px; background: #fff; display: block; margin: 0 auto 0.6rem; }
      .secret { text-align: center; color: var(--muted, #6b6780); font-size: 0.88rem; margin-bottom: 1rem; }
      .secret code { font-family: var(--font-mono, monospace); background: var(--surface-2, #f7f6fc); border: 1px solid var(--line, #e9e7f0); border-radius: 6px; padding: 2px 7px; letter-spacing: 0.05em; }
      .code-input { text-align: center; letter-spacing: 0.4em; font-size: 1.15rem; }
      .muted { color: var(--muted, #6b6780); }
      .codes { list-style: none; padding: 0; margin: 12px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .codes li { background: var(--surface-2, #f7f6fc); border: 1px solid var(--line, #e9e7f0); border-radius: 8px; padding: 8px; text-align: center; }
      .codes code { font-family: var(--font-mono, monospace); font-size: 15px; letter-spacing: 1px; color: #1e1b2e; }
    `,
  ],
})
export class MfaSetupComponent implements OnInit {
  private mfaService = inject(MfaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  setupData?: IMfaSetupResponse;
  code = '';
  loading = false;
  loadingSetup = true;
  error: string | null = null;
  recoveryCodes: string[] | null = null;

  ngOnInit(): void {
    // Si la MFA est déjà active, inutile de rester ici.
    if (this.authService.getCurrentUser()?.mfaEnabled) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.mfaService.setup().subscribe({
      next: (data) => {
        this.setupData = data;
        this.loadingSetup = false;
      },
      error: (e) => {
        this.loadingSetup = false;
        this.error = e.error?.message || 'Impossible de démarrer la configuration.';
      },
    });
  }

  confirm(): void {
    this.error = null;
    this.loading = true;
    this.mfaService.enable(this.code).subscribe({
      next: (res) => {
        this.loading = false;
        this.recoveryCodes = res.recoveryCodes || [];
        // MFA active côté serveur : on rafraîchit l'utilisateur pour que le guard laisse passer,
        // mais on reste sur l'écran pour afficher les codes de secours.
        this.authService.refreshCurrentUser().subscribe({ next: () => {}, error: () => {} });
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || 'Code incorrect, réessayez.';
      },
    });
  }

  /** L'utilisateur a sauvegardé ses codes -> on entre dans l'application. */
  continueToApp(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
