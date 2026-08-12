import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Écran atterri depuis le lien de l'email de confirmation (?token=…).
 * Vérifie le jeton, active le compte, puis connecte et redirige.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-shell">
      <aside class="auth-brand">
        <div class="brand-logo"><span class="dot"></span> e-Agenda</div>
        <div>
          <h1 class="brand-headline">Activation de votre compte.</h1>
          <p class="brand-sub">Nous confirmons votre adresse email pour sécuriser votre accès.</p>
        </div>
        <span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>
      </aside>

      <main class="auth-main">
        <div class="auth-card" style="text-align:center;">
          <div *ngIf="state === 'verifying'">
            <div class="big-ic">⏳</div>
            <h2 class="card-title">Vérification en cours…</h2>
            <p class="card-subtitle">Un instant, on active votre compte.</p>
          </div>

          <div *ngIf="state === 'success'">
            <div class="big-ic">✅</div>
            <h2 class="card-title">Compte activé !</h2>
            <p class="card-subtitle">Vous allez être redirigé(e)…</p>
          </div>

          <div *ngIf="state === 'error'">
            <div class="big-ic">⚠️</div>
            <h2 class="card-title">Lien invalide</h2>
            <p class="card-subtitle">{{ message }}</p>
            <a [routerLink]="['/login']" class="btn btn-primary btn-block" style="margin-top:12px;">Aller à la connexion</a>
            <p class="auth-switch"><a [routerLink]="['/register']">Créer un nouveau compte</a></p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`.big-ic { font-size: 3rem; margin-bottom: 8px; }`],
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  state: 'verifying' | 'success' | 'error' = 'verifying';
  message = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'error';
      this.message = 'Jeton de vérification manquant dans le lien.';
      return;
    }
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.state = 'success';
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: (e) => {
        this.state = 'error';
        this.message = e.error?.message || 'Lien de vérification invalide ou déjà utilisé.';
      },
    });
  }
}
