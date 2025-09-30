// src/app/events/events-list/events-list.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../event.service';
import { IEvent, IEventResponseDTO } from '../../core/models/event.models';
import { HeaderComponent } from '../../core/components/header/header';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EventFormModalComponent } from '../event-form-modal/event-form-modal';

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

  eventData: IEventResponseDTO | null = null;
  events: IEvent[] = [];
  currentPage: number = 1;
  limit: number = 10; // Nombre d'éléments par page

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
        this.events = data.events;
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

    modalRef.result.then((result) => {
      if (result === true) {
        this.loadEvents(); // Rafraîchir la liste après modification
      }
    }, () => {}); // Ignorer la fermeture par 'dismiss'
  }

  /**
   * Gère la suppression après confirmation.
   */
  deleteEvent(id: number, titre: string): void {
    // ⚠️ Message de confirmation selon votre demande
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${titre}" ? Cette action est irréversible.`);

    if (confirmDelete) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          console.log(`Événement ${id} supprimé.`);
          // Tente de rester sur la page courante, ou revient à la précédente si elle devient vide
          if (this.events.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.loadEvents(); // Rafraîchir la liste
        },
        error: (err) => {
          console.error("Erreur lors de la suppression:", err);
          alert("Échec de la suppression de l'événement.");
        }
      });
    }
  }
}