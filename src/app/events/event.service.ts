// src/app/events/event.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IEvent, IEventResponseDTO } from '../core/models/event.models';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = environment.apiUrl + '/event';
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Récupère la liste paginée des événements de l'utilisateur.
   * Cet endpoint est utilisé par la vue Liste (EventsList) et,
   * avec une grande limite, pour charger le Dashboard.
   * @param page Numéro de la page (commence à 1).
   * @param limit Nombre d'éléments par page.
   */
  getAllEvents(page: number = 1, limit: number = 10): Observable<IEventResponseDTO> {
    // Pourquoi : Construit les paramètres de la requête paginée attendus par votre EventController.
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<IEventResponseDTO>(this.apiUrl, { params });
  }

  /**
   * Crée un nouvel événement.
   * @param event L'objet événement (IEvent) à envoyer au backend.
   */
  createEvent(event: IEvent): Observable<IEvent> {
    // Pourquoi : Appel POST pour la création d'une nouvelle ressource.
    // L'interceptor s'occupe d'ajouter le JWT token.
    return this.http.post<IEvent>(this.apiUrl, event);
  }

  /**
   * Modifie un événement existant.
   * @param id L'ID de l'événement à modifier.
   * @param event L'objet événement (IEvent) modifié.
   */
  updateEvent(id: number, event: IEvent): Observable<IEvent> {
    // Pourquoi : Appel PUT pour la mise à jour complète de la ressource.
    return this.http.put<IEvent>(`${this.apiUrl}/${id}`, event);
  }

    /**
   * Supprime un événement par son ID.
   * @param id L'ID de l'événement à supprimer.
   */
  deleteEvent(id: number): Observable<void> {
    // Pourquoi : Appel DELETE vers l'endpoint Spring Boot.
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  
  // getEventById(id: number): Observable<IEvent> {
  //   return this.http.get<IEvent>(`${this.apiUrl}/${id}`);
  // }

  // --- CRUD (à compléter plus tard dans la Phase 4 et 6) ---

  // getEventById(id: number): Observable<IEvent> { ... }
  // createEvent(event: IEvent): Observable<IEvent> { ... }
  // updateEvent(id: number, event: IEvent): Observable<IEvent> { ... }
  // deleteEvent(id: number): Observable<void> { ... }
}