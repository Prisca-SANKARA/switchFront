// src/app/events/events-list/events-list.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../event.service';
import { IEvent, IEventResponseDTO, IParticipant, RsvpStatus } from '../../core/models/event.models';
import { HeaderComponent } from '../../core/components/header/header';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EventFormModalComponent } from '../event-form-modal/event-form-modal';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  // ⚠️ NgbModal est un service, pas un module, donc il est géré par injection
  imports: [CommonModule, RouterLink, HeaderComponent],
  templateUrl: './events-list.html',
  styleUrls: ['./events-list.scss'] // ⚠️ SCSS
})
export class EventsListComponent implements OnInit {
  
  private eventService = inject(EventService);
  private modalService = inject(NgbModal);
  private authService = inject(AuthService);

  /** L'utilisateur n'est propriétaire (donc éditeur) que des événements qu'il a créés. */
  isOwner(event: IEvent): boolean {
    const uid = this.authService.getCurrentUser()?.id;
    return !!uid && event.creatorId === uid;
  }

  /**
   * Entrée « participant » de l'utilisateur connecté dans un événement
   * (identifiée par l'email). Sert à afficher/mettre à jour son RSVP.
   */
  myParticipation(event: IEvent): IParticipant | undefined {
    const email = this.authService.getCurrentUser()?.email?.toLowerCase();
    if (!email) {
      return undefined;
    }
    return event.participant?.find((p) => p.email?.toLowerCase() === email);
  }

  /** L'utilisateur peut répondre s'il est participant (et non le créateur). */
  canRespond(event: IEvent): boolean {
    return !this.isOwner(event) && !!this.myParticipation(event);
  }

  /** Envoie la réponse RSVP puis rafraîchit la liste. */
  respond(event: IEvent, status: RsvpStatus): void {
    if (!event.id) {
      return;
    }
    this.eventService.respondRsvp(event.id, status).subscribe({
      next: () => this.loadEvents(),
      error: (err) => {
        console.error('Erreur RSVP:', err);
        alert("Impossible d'enregistrer votre réponse.");
      },
    });
  }

  /** Libellé lisible d'un statut RSVP. */
  rsvpLabel(status?: RsvpStatus): string {
    switch (status) {
      case 'ACCEPTED':
        return 'Accepté';
      case 'DECLINED':
        return 'Refusé';
      case 'TENTATIVE':
        return 'Peut-être';
      default:
        return 'En attente';
    }
  }

  /** Classe CSS (pastille de couleur) associée à un statut RSVP. */
  rsvpClass(status?: RsvpStatus): string {
    switch (status) {
      case 'ACCEPTED':
        return 'rsvp-accepted';
      case 'DECLINED':
        return 'rsvp-declined';
      case 'TENTATIVE':
        return 'rsvp-tentative';
      default:
        return 'rsvp-pending';
    }
  }

  /** Ouvre la modale en LECTURE SEULE (pour un participant non-créateur). */
  viewEvent(event: IEvent): void {
    const modalRef = this.modalService.open(EventFormModalComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.eventToEdit = event;
    modalRef.componentInstance.readOnly = true;
  }

  eventData: IEventResponseDTO | null = null;
  events: IEvent[] = [];
  currentPage: number = 1;
  limit: number = 10; // Nombre d'éléments par page

  /** Filtre d'affichage : à venir (défaut) / passés / tous. */
  filter: 'upcoming' | 'past' | 'all' = 'upcoming';

  /** Un événement est « passé » quand sa date de fin est antérieure à maintenant. */
  private isPast(event: IEvent): boolean {
    return new Date(event.dateFin).getTime() < Date.now();
  }

  /** Liste effectivement affichée, selon le filtre sélectionné. */
  get displayedEvents(): IEvent[] {
    if (this.filter === 'upcoming') {
      return this.events.filter((e) => !this.isPast(e));
    }
    if (this.filter === 'past') {
      return this.events.filter((e) => this.isPast(e));
    }
    return this.events;
  }

  setFilter(f: 'upcoming' | 'past' | 'all'): void {
    this.filter = f;
  }

  ngOnInit(): void {
    this.loadEvents();
    
    
  }

  /**
   * Charge les événements paginés depuis le backend.
   */
loadEvents(): void {
  this.eventService.getAllEvents(this.currentPage, this.limit).subscribe({
    next: (data) => {
      this.eventData = data;
      this.events = data.events;  // stocke les événements
      console.log("Événements chargés:", this.events);
                  console.log("Premier événement chargé (pour inspection):", this.events[0]); 


      // ici events n'est plus vide
      this.events.forEach(event => console.log("dd " + event));
    },
    error: (err) => {
      console.error("Erreur lors du chargement des événements:", err);
    }
  });
}



  // --- Gestion de la Pagination ---
  
  /**
   * Change la page actuelle et recharge les événements.
   */
  changePage(page: number): void {
    if (page >= 1 && page <= (this.eventData?.totalPages || 1)) {
      this.currentPage = page;
      this.loadEvents();
    }
  }
  
  get totalPagesArray(): number[] {
    // Crée un tableau [1, 2, 3, ...] pour l'itération des boutons de pagination
    return Array(this.eventData?.totalPages).fill(0).map((x, i) => i + 1);
  }

  // --- Interactions CRUD ---

  /**
   * Ouvre la modale d'édition.
   */
  editEvent(event: IEvent): void {

    const modalRef = this.modalService.open(EventFormModalComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.eventToEdit = event;
    console.log(`Événement ${event.id} a edité.`);
    modalRef.result.then((result) => {
      if (result === true) {
        this.loadEvents(); // Rafraîchir la liste après modification
      }
    }, () => {}); // Ignorer la fermeture par 'dismiss'
  }

  /**
   * Gère la suppression après confirmation.
   */
  deleteEvent(event: IEvent): void {
    if (!event.id) {
      return;
    }
    let scope: 'occurrence' | 'series' = 'occurrence';

    if (event.seriesId) {
      // Événement récurrent : série entière ou occurrence unique ?
      const whole = confirm(
        `« ${event.titre} » fait partie d'une série récurrente.\n\nOK = supprimer TOUTE la série\nAnnuler = choisir cette occurrence`,
      );
      if (whole) {
        scope = 'series';
      } else {
        if (!confirm(`Supprimer seulement cette occurrence de « ${event.titre} » ?`)) {
          return;
        }
        scope = 'occurrence';
      }
    } else {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.titre}" ? Cette action est irréversible.`)) {
        return;
      }
    }

    this.eventService.deleteEvent(event.id, scope).subscribe({
      next: () => {
        if (this.events.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadEvents(); // Rafraîchir la liste
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        alert("Échec de la suppression de l'événement.");
      },
    });
  }
}