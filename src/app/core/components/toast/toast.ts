import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RealtimeService, EventNotification } from '../../services/realtime.service';

interface Toast extends EventNotification {
  _id: number;
}

/**
 * Pile de notifications temps réel (WebSocket). Monté globalement dans App,
 * il établit la connexion STOMP au démarrage et affiche chaque événement reçu.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite">
      <div *ngFor="let t of toasts" class="toast-card" [ngClass]="t.type?.toLowerCase()">
        <div class="toast-ic">{{ icon(t.type) }}</div>
        <div class="toast-body">
          <p class="toast-title">{{ label(t.type) }}</p>
          <p class="toast-msg">{{ t.message || t.title }}</p>
        </div>
        <button class="toast-close" (click)="dismiss(t)" aria-label="Fermer">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 1080;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 340px;
      }
      .toast-card {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: var(--surface, #fff);
        border: 1px solid var(--line, #e9e7f0);
        border-left: 4px solid var(--brand, #7c3aed);
        border-radius: 14px;
        box-shadow: 0 18px 40px rgba(76, 29, 149, 0.18);
        padding: 12px 14px;
        animation: toastIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .toast-card.created { border-left-color: #10b981; }
      .toast-card.updated { border-left-color: #f59e0b; }
      .toast-card.deleted { border-left-color: #ef4444; }
      .toast-ic {
        font-size: 1.2rem;
        line-height: 1.4;
      }
      .toast-body { flex: 1; min-width: 0; }
      .toast-title {
        font-family: var(--font-display, sans-serif);
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--ink, #1e1b2e);
      }
      .toast-msg {
        font-size: 0.85rem;
        color: var(--muted, #6b6780);
        overflow-wrap: anywhere;
      }
      .toast-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
        color: var(--faint, #9a95ac);
      }
      .toast-close:hover { color: var(--ink, #1e1b2e); }
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .toast-card { animation: none; }
      }
    `,
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  private realtime = inject(RealtimeService);
  private sub?: Subscription;

  toasts: Toast[] = [];

  ngOnInit(): void {
    // La connexion est pilotée par l'état d'auth dans RealtimeService (effect).
    // Injecter le service suffit à l'instancier ; on s'abonne juste au flux.
    this.sub = this.realtime.notifications$.subscribe((n) => this.push(n));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private push(n: EventNotification): void {
    const toast: Toast = { ...n, _id: Date.now() + Math.random() };
    this.toasts = [toast, ...this.toasts].slice(0, 4);
    setTimeout(() => this.dismiss(toast), 6000);
  }

  dismiss(t: Toast): void {
    this.toasts = this.toasts.filter((x) => x._id !== t._id);
  }

  icon(type?: string): string {
    switch (type) {
      case 'DELETED':
        return '🗑️';
      case 'UPDATED':
        return '✏️';
      case 'RSVP':
        return '📩';
      case 'REMINDER':
        return '⏰';
      default:
        return '🔔';
    }
  }

  label(type?: string): string {
    switch (type) {
      case 'CREATED':
        return 'Nouvel événement';
      case 'UPDATED':
        return 'Événement modifié';
      case 'DELETED':
        return 'Événement annulé';
      case 'RSVP':
        return "Réponse à l'invitation";
      case 'REMINDER':
        return 'Rappel';
      default:
        return 'Notification';
    }
  }
}
