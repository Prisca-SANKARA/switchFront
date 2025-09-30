// src/app/events/calendar-view/calendar-view.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventApi, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Service pour ouvrir la modale
import { EventService } from '../event.service';
import { IEvent } from '../../core/models/event.models';
import { HeaderComponent } from '../../core/components/header/header';
import { EventFormModalComponent } from '../event-form-modal/event-form-modal';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    HeaderComponent, 
    FullCalendarModule // ⚠️ Le module FullCalendar doit être importé
  ],
  templateUrl: './calendar-view.html',
  styleUrls: ['./calendar-view.scss'] // ⚠️ SCSS
})
export class CalendarViewComponent implements OnInit {
  
  private eventService = inject(EventService);
  private modalService = inject(NgbModal);

  calendarOptions: CalendarOptions = {};
  currentMonth: string = '';
  
  // Contient la liste des événements récents pour la card latérale (selon votre demande)
  recentEvents: IEvent[] = []; 

  ngOnInit(): void {
    this.configureCalendar();
    this.loadEvents();
  }

  /**
   * Configure les options de FullCalendar (plugins, vues, interactions).
   */
  configureCalendar(): void {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth', // Vue initiale (Mois)
      locale: 'fr', // Pour avoir les noms en français
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay' // Vues disponibles
      },
      editable: true, // Permet le drag-and-drop des événements
      selectable: true, // Permet la sélection de plage de dates
      selectMirror: true, // Affiche un aperçu lors de la sélection
      
      // ⚠️ Gestion des interactions
      eventClick: this.handleEventClick.bind(this), // Clic sur un événement existant (Édition)
      select: this.handleDateSelect.bind(this),     // Sélection d'une plage (Création)
      
      events: [], // Le tableau sera rempli par loadEvents()
      datesSet: this.handleDatesSet.bind(this) // Pour mettre à jour le titre du mois
    };
  }
  
  /**
   * Met à jour le titre affiché au-dessus du calendrier (Mois Actuel).
   */
  handleDatesSet(arg: any) {
    // Le titre contient le mois et l'année (ex: "Juin 2025")
    this.currentMonth = arg.view.title; 
    // On peut aussi mettre à jour les événements récents à chaque changement de mois si désiré,
    // mais pour l'instant, nous le ferons une fois au chargement.
  }
  
  /**
   * 1. Charge les événements du backend.
   * 2. Mappe les IEvent aux objets FullCalendar Event.
   * 3. Met à jour le calendrier.
   */
  loadEvents(): void {
    // Récupération de tous les événements (avec une limite haute comme pour le Dashboard)
    this.eventService.getAllEvents(1, 1000).subscribe({
      next: (response) => {
        const fullCalendarEvents = response.events.map(event => ({
          id: event.id?.toString(),
          title: event.titre,
          start: event.dateDebut.replace(' ', 'T'), // Format ISO : YYYY-MM-DDTHH:MM
          end: event.dateFin.replace(' ', 'T'),     // Format ISO
          allDay: false, // On suppose que les événements ont une heure
          extendedProps: {
            // Stocker l'objet IEvent complet pour l'édition ultérieure
            eventData: event 
          }
        }));
        
        // Mise à jour de la propriété 'events' du calendrier
        this.calendarOptions = { ...this.calendarOptions, events: fullCalendarEvents };
        
        // Mise à jour de la card des événements récents (simplement les 5 premiers pour l'exemple)
        this.recentEvents = response.events.slice(0, 5);
      },
      error: (err) => {
        console.error("Erreur de chargement des événements:", err);
      }
    });
  }

  // --- Gestion des Interactions (Création et Édition) ---

  /**
   * Gestion de la sélection d'une plage de dates (Création d'événement).
   */
  handleDateSelect(selectInfo: DateSelectArg) {
    // selectInfo.startStr donne la date/heure de début sélectionnée
    this.openEventModal(null, selectInfo.startStr); 
  }

  /**
   * Gestion du clic sur un événement (Édition d'événement).
   */
  handleEventClick(clickInfo: EventClickArg) {
    // On récupère l'objet IEvent complet stocké dans extendedProps
    const eventToEdit: IEvent = clickInfo.event.extendedProps['eventData'];
    this.openEventModal(eventToEdit);
  }

  /**
   * Ouvre la modale EventFormModal pour créer ou éditer un événement.
   * @param eventToEdit L'objet IEvent si mode édition, sinon null.
   * @param initialDate Date/heure pour préremplir le champ (si mode création).
   */
  openEventModal(eventToEdit: IEvent | null, initialDate: string | null = null): void {
    const modalRef = this.modalService.open(EventFormModalComponent, { size: 'lg', centered: true });
    
    // Passage des données à la modale
    modalRef.componentInstance.eventToEdit = eventToEdit;
    modalRef.componentInstance.initialDate = initialDate;

    // Traitement du résultat après fermeture de la modale
    modalRef.result.then((result) => {
      // Si la modale est fermée avec succès (création/édition), le résultat est 'true'
      if (result === true) {
        this.loadEvents(); // ⚠️ Recharger les événements pour rafraîchir le calendrier
      }
    }, (reason) => {
      // Logique pour l'annulation (dismiss) si nécessaire
    });
  }
}