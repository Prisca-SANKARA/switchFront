import { Injectable, effect, inject, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

/** Charge utile poussée par le backend (voir EventNotification.java). */
export interface EventNotification {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | string;
  eventId?: number;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Client WebSocket/STOMP CIBLÉ : s'authentifie au CONNECT avec le JWT et
 * s'abonne à /user/queue/events (destination propre à l'utilisateur).
 * La connexion suit l'état d'authentification (connect à la connexion, disconnect à la déconnexion).
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private client?: Client;
  private auth = inject(AuthService);

  readonly connected = signal(false);
  readonly notifications$ = new Subject<EventNotification>();

  constructor() {
    // (Re)connecte quand l'utilisateur est connecté ; déconnecte sinon.
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.reconnect();
      } else {
        this.disconnect();
      }
    });
  }

  /** ws://localhost:8081/ws/websocket (transport WS brut de SockJS). */
  private brokerUrl(): string {
    const base = environment.apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
    return base + '/ws/websocket';
  }

  private reconnect(): void {
    this.disconnect();
    this.connect();
  }

  connect(): void {
    const token = this.auth.getToken();
    if (!token || this.client?.active) {
      return;
    }
    this.client = new Client({
      brokerURL: this.brokerUrl(),
      connectHeaders: { Authorization: 'Bearer ' + token },
      reconnectDelay: 4000,
      onConnect: () => {
        this.connected.set(true);
        this.client!.subscribe('/user/queue/events', (msg: IMessage) => {
          try {
            this.notifications$.next(JSON.parse(msg.body) as EventNotification);
          } catch {
            /* message non-JSON ignoré */
          }
        });
      },
      onWebSocketClose: () => this.connected.set(false),
      onStompError: () => this.connected.set(false),
    });
    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = undefined;
    }
    this.connected.set(false);
  }
}
