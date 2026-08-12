// src/app/events/event.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  IEvent,
  IParticipant,
  IEventResponseDTO,
  RsvpStatus,
  RecurrenceFrequency,
} from '../core/models/event.models';

/**
 * Forme réelle d'un événement côté backend Spring Boot (champs anglais).
 * Le service traduit vers/depuis le modèle français (IEvent) utilisé par l'UI.
 */
interface BackendParticipant {
  id?: number;
  nom: string;
  email: string;
  rsvpStatus?: RsvpStatus;
}
interface BackendEvent {
  id?: number;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO "2026-09-01T10:00:00"
  endDate: string;
  status?: string;
  priority?: string;
  color?: string;
  creatorId?: number;
  participants?: BackendParticipant[];
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceEndDate?: string;
  seriesId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  // Endpoint correct : /events (pluriel), scopé à l'utilisateur côté backend.
  private apiUrl = environment.apiUrl + '/events';
  private http = inject(HttpClient);

  /**
   * Agenda de l'utilisateur (créateur ou participant). Le backend renvoie un
   * tableau ; on l'enveloppe dans IEventResponseDTO pour l'UI existante.
   * (La pagination est côté client : une seule page.)
   */
  getAllEvents(page: number = 1, limit: number = 10): Observable<IEventResponseDTO> {
    return this.http.get<BackendEvent[]>(this.apiUrl).pipe(
      map((arr) => {
        const events = (arr || []).map((e) => this.toFrontend(e));
        return {
          events,
          total: events.length,
          currentPage: 1,
          totalPages: 1,
        } as IEventResponseDTO;
      }),
    );
  }

  createEvent(event: IEvent): Observable<IEvent> {
    return this.http
      .post<BackendEvent>(this.apiUrl, this.toBackend(event))
      .pipe(map((e) => this.toFrontend(e)));
  }

  /** scope='series' met à jour toute la série récurrente ; sinon cette occurrence. */
  updateEvent(id: number, event: IEvent, scope: 'occurrence' | 'series' = 'occurrence'): Observable<IEvent> {
    return this.http
      .put<BackendEvent>(`${this.apiUrl}/${id}?scope=${scope}`, this.toBackend(event))
      .pipe(map((e) => this.toFrontend(e)));
  }

  /** scope='series' supprime toute la série récurrente ; sinon cette occurrence. */
  deleteEvent(id: number, scope: 'occurrence' | 'series' = 'occurrence'): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}?scope=${scope}`);
  }

  /**
   * RSVP : le participant connecté répond à l'invitation (ACCEPTED/DECLINED/TENTATIVE).
   * Renvoie l'événement mis à jour (avec le nouveau statut du participant).
   */
  respondRsvp(eventId: number, status: RsvpStatus): Observable<IEvent> {
    return this.http
      .post<BackendEvent>(`${this.apiUrl}/${eventId}/rsvp`, { status })
      .pipe(map((e) => this.toFrontend(e)));
  }

  // ----- Traduction backend (EN) -> UI (FR) -----
  private toFrontend(e: BackendEvent): IEvent {
    return {
      id: e.id,
      titre: e.title,
      description: e.description ?? '',
      lieu: e.location ?? '',
      creatorId: e.creatorId,
      dateDebut: e.startDate,
      dateFin: e.endDate,
      recurrence: e.recurrenceFrequency ?? 'NONE',
      recurrenceEndDate: e.recurrenceEndDate,
      seriesId: e.seriesId,
      participant: (e.participants || []).map(
        (p) =>
          ({
            id: p.id,
            nom: p.nom,
            prenom: '',
            email: p.email,
            rsvpStatus: p.rsvpStatus ?? 'PENDING',
          }) as IParticipant,
      ),
    };
  }

  // ----- Traduction UI (FR) -> backend (EN) -----
  private toBackend(ev: IEvent): BackendEvent {
    return {
      id: ev.id,
      title: ev.titre,
      description: ev.description,
      location: ev.lieu,
      startDate: this.toIso(ev.dateDebut),
      endDate: this.toIso(ev.dateFin),
      recurrenceFrequency: ev.recurrence ?? 'NONE',
      recurrenceEndDate: ev.recurrenceEndDate ? this.toIso(ev.recurrenceEndDate) : undefined,
      participants: (ev.participant || []).map((p) => ({
        nom: [p.prenom, p.nom].filter((x) => x && x.trim()).join(' ').trim() || p.nom,
        email: p.email,
      })),
    };
  }

  /** Normalise une date en ISO-8601 avec 'T' et secondes (attendu par LocalDateTime). */
  private toIso(s: string): string {
    if (!s) {
      return s;
    }
    let iso = s.replace(' ', 'T');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso)) {
      iso += ':00';
    }
    return iso;
  }
}
