import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../../core/components/header/header';
import { CommonModule } from '@angular/common';
import { EventService } from '../../events/event.service';
import { IEvent } from '../../core/models/event.models'; 
import { RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // <--- 1. NOUVEL IMPORT NÉCESSAIRE
import { EventFormModalComponent } from '../../events/event-form-modal/event-form-modal'; // <--- 2. NOUVEL IMPORT NÉCESSAIRE
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Ajoutez NgbModal et EventFormModalComponent comme dépendances dans imports 
  // si vous les utilisez (NgbModal n'est pas un composant mais un service)
  imports: [CommonModule, HeaderComponent, RouterLink], 
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  private eventService = inject(EventService);
  private modalService = inject(NgbModal); // <--- 3. INJECTION DU SERVICE MODALE

  // Utilisateur courant (signal) pour l'accueil personnalisé du tableau de bord.
  readonly user = inject(AuthService).currentUser;

  allEvents: IEvent[] = [];
  eventsToday: number = 0;
  eventsThisWeek: number = 0;
  upcomingCount: number = 0;
  recentEvents: IEvent[] = [];
  
  private readonly RECENT_EVENTS_LIMIT = 5;
  
  ngOnInit(): void {
    this.loadEventsForDashboard();
  }

  /**
   * Ouvre la modale du formulaire d'événement pour la création.
   * C'est la même logique que dans CalendarViewComponent.
   */
  openNewEventModal(): void { // <--- 4. NOUVELLE MÉTHODE
    const modalRef = this.modalService.open(EventFormModalComponent, { size: 'lg', centered: true });
    
    // Si l'utilisateur crée ou modifie un événement, on rafraîchit le tableau de bord
    modalRef.result.then((result) => {
        if (result === true) {
            // Recharger les données si l'événement a été créé/modifié
            this.loadEventsForDashboard(); 
        }
    }, () => {
        // Annulation ou clic en dehors
    });
  }
  
  // Pourquoi : On récupère potentiellement tous les événements (avec une limite très haute) 
  // pour faire le calcul des KPIs côté client.
  loadEventsForDashboard(): void {
    // On utilise une limite très large (ex: 1000) pour s'assurer d'avoir tous les événements.
    this.eventService.getAllEvents(1, 1000).subscribe({
      next: (response) => {
        this.allEvents = response.events;
        this.calculateKpis();
      },
      error: (err) => {
        console.error("Erreur lors du chargement des événements du dashboard:", err);
      }
    });
  }

  // Pourquoi : Calcule les métriques demandées (jour, semaine, récents/futurs).
  calculateKpis(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    // Début de semaine (Lundi) - Ajustez si votre semaine commence un dimanche
    const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    weekStart.setDate(diff);

    // Initialisation
    this.eventsToday = 0;
    this.eventsThisWeek = 0;

    // Instant présent. Un événement est « pas encore terminé » si sa date de FIN
    // est dans le futur -> les compteurs diminuent au fil de la journée quand un
    // événement se termine (et pas seulement au changement de jour).
    const now = new Date();
    const weekEnd = weekStart.getTime() + 7 * 24 * 60 * 60 * 1000;
    const upcoming: IEvent[] = [];

    this.allEvents.forEach(event => {
      const startDate = new Date(event.dateDebut);
      const endDate = new Date(event.dateFin);
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);

      const notFinished = endDate.getTime() >= now.getTime();
      if (!notFinished) {
        return; // événement passé : ignoré dans tous les compteurs du dashboard
      }

      // 1. Aujourd'hui (démarre aujourd'hui et pas encore terminé)
      if (startDay.getTime() === today.getTime()) {
        this.eventsToday++;
      }

      // 2. Cette semaine (démarre dans la semaine en cours et pas encore terminé)
      if (startDay.getTime() >= weekStart.getTime() && startDay.getTime() < weekEnd) {
        this.eventsThisWeek++;
      }

      // 3. À venir / en cours : tout ce qui n'est pas terminé.
      upcoming.push(event);
    });

    // Tri du plus proche au plus lointain.
    upcoming.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());

    // Compteur « À venir » = TOTAL des événements non terminés (pas la liste tronquée).
    this.upcomingCount = upcoming.length;
    // La liste affichée reste limitée pour l'UI.
    this.recentEvents = upcoming.slice(0, this.RECENT_EVENTS_LIMIT);
  }
}
