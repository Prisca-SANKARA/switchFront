import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../core/components/header/header';
import { AdminService, IAdminUser } from './admin.service';
import { AuthService } from '../auth/auth.service';

/**
 * Back-office administrateur : liste des inscrits + activation/désactivation
 * et suppression de comptes. Route protégée par adminGuard.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="admin-wrap">
      <header class="admin-head">
        <div>
          <h1>Administration</h1>
          <p class="sub">Gestion des comptes inscrits.</p>
        </div>
        <div class="stats" *ngIf="!loading">
          <span class="stat"><strong>{{ users.length }}</strong> inscrits</span>
          <span class="stat"><strong>{{ activeCount }}</strong> actifs</span>
        </div>
      </header>

      <div *ngIf="loading" class="info">Chargement…</div>
      <div *ngIf="error" class="error">{{ error }}</div>

      <div class="table-scroll" *ngIf="!loading && !error">
        <table class="users-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>MFA</th>
              <th>Événements</th>
              <th>Inscrit le</th>
              <th>Statut</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users" [class.inactive]="!u.isActive">
              <td>{{ u.id }}</td>
              <td>
                <div class="who">
                  <span class="avatar">{{ (u.firstName || u.username || '?').charAt(0) }}</span>
                  <div>
                    <div class="name">{{ u.firstName }} {{ u.lastName }}</div>
                    <div class="uname">{{ u.username }}</div>
                  </div>
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>
                <span class="pill" [class.admin]="u.role === 'ADMIN'">{{ u.role }}</span>
              </td>
              <td>{{ u.mfaEnabled ? '🔐' : '—' }}</td>
              <td>{{ u.eventsCreated }}</td>
              <td>{{ u.createdAt | date: 'dd/MM/yyyy' }}</td>
              <td>
                <span class="pill" [class.ok]="u.isActive" [class.ko]="!u.isActive">
                  {{ u.isActive ? 'Actif' : 'Désactivé' }}
                </span>
              </td>
              <td class="actions-col">
                <button
                  *ngIf="u.id !== currentUserId"
                  class="btn ghost"
                  (click)="toggleActive(u)">
                  {{ u.isActive ? 'Désactiver' : 'Réactiver' }}
                </button>
                <button
                  *ngIf="u.id !== currentUserId"
                  class="btn danger"
                  (click)="remove(u)">
                  Supprimer
                </button>
                <span *ngIf="u.id === currentUserId" class="self">vous</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="users.length === 0" class="info">Aucun inscrit.</div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-wrap { padding: 28px; max-width: 1100px; margin: 0 auto; }
      .admin-head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
      h1 { margin: 0; color: #512DA8; font-weight: 800; }
      .sub { color: #757575; margin: 4px 0 0; }
      .stats { display: flex; gap: 10px; }
      .stat { background: #f3eefb; color: #4527A0; border-radius: 999px; padding: 6px 14px; font-size: 0.9rem; }
      .info { color: #757575; padding: 20px 0; }
      .error { color: #c0392b; padding: 12px 16px; background: #fdeaea; border-radius: 10px; }
      .table-scroll { overflow-x: auto; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,.06); background: #fff; }
      .users-table { width: 100%; border-collapse: collapse; min-width: 860px; }
      th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #f0eef6; font-size: 0.9rem; }
      th { background: #faf8ff; color: #4527A0; font-weight: 700; white-space: nowrap; }
      tr.inactive { opacity: 0.6; }
      .who { display: flex; align-items: center; gap: 10px; }
      .avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 700; text-transform: uppercase; background: linear-gradient(135deg,#7c3aed,#6366f1); }
      .name { font-weight: 600; color: #212121; }
      .uname { color: #9a95ac; font-size: 0.8rem; }
      .pill { padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: #eee; color: #555; }
      .pill.admin { background: #ede9fe; color: #6d28d9; }
      .pill.ok { background: #e6f7ee; color: #0f7a45; }
      .pill.ko { background: #fdeaea; color: #c0392b; }
      .actions-col { white-space: nowrap; }
      .btn { padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; border: 1px solid transparent; cursor: pointer; margin-left: 6px; }
      .btn.ghost { background: #fff; border-color: #d6d0e6; color: #4527A0; }
      .btn.ghost:hover { background: #f3eefb; }
      .btn.danger { background: #fff; border-color: #f0b4ae; color: #c0392b; }
      .btn.danger:hover { background: #fdeaea; }
      .self { color: #9a95ac; font-style: italic; font-size: 0.85rem; }
      @media (max-width: 640px) { .admin-wrap { padding: 16px; } }
    `,
  ],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  users: IAdminUser[] = [];
  loading = true;
  error = '';

  get currentUserId(): number | undefined {
    return this.authService.getCurrentUser()?.id;
  }

  get activeCount(): number {
    return this.users.filter((u) => u.isActive).length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getUsers().subscribe({
      next: (list) => {
        this.users = list;
        this.loading = false;
      },
      error: (err) => {
        this.error = "Impossible de charger la liste des inscrits.";
        this.loading = false;
        console.error(err);
      },
    });
  }

  toggleActive(u: IAdminUser): void {
    this.adminService.setActive(u.id, !u.isActive).subscribe({
      next: (updated) => {
        u.isActive = updated.isActive;
      },
      error: (err) => {
        alert(err?.error?.message || "Action impossible.");
      },
    });
  }

  remove(u: IAdminUser): void {
    const ok = confirm(
      `Supprimer définitivement le compte de ${u.email} ? Cette action est irréversible et supprime aussi ses événements.`,
    );
    if (!ok) {
      return;
    }
    this.adminService.deleteUser(u.id).subscribe({
      next: () => {
        this.users = this.users.filter((x) => x.id !== u.id);
      },
      error: (err) => {
        alert(err?.error?.message || "Suppression impossible.");
      },
    });
  }
}
