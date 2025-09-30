// src/app/dashboard/dashboard/dashboard.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../../core/components/header/header';
import { CommonModule } from '@angular/common';
import { EventService } from '../../events/event.service'; // ⚠️ Import
import { IEvent } from '../../core/models/event.models'; // ⚠️ Import
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // ⚠️ Ajout de RouterLink pour la navigation
  imports: [CommonModule, HeaderComponent, RouterLink], 
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'] // ⚠️ Utilisation de SCSS
})
export class DashboardComponent implements OnInit {
  private eventService = inject(EventService);

  allEvents: IEvent[] = [];
  eventsToday: number = 0;
  eventsThisWeek: number = 0;
  recentEvents: IEvent[] = [];
  
  // Constantes pour le filtrage
  private readonly RECENT_EVENTS_LIMIT = 5;
  
  ngOnInit(): void {
    this.loadEventsForDashboard();
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
    
    // Pour les événements récents/futurs (entre J-2 et J+3)
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 4); // +4 car c'est exclusif

    const eventsForRecentList: IEvent[] = [];

    this.allEvents.forEach(event => {
      // Les dates du backend sont des strings "YYYY-MM-DD HH:MM", on crée des objets Date
      const startDate = new Date(event.dateDebut);
      startDate.setHours(0, 0, 0, 0);

      // 1. Événements du jour (aujourd'hui)
      if (startDate.getTime() === today.getTime()) {
        this.eventsToday++;
      }

      // 2. Événements de la semaine (entre weekStart et weekStart + 7 jours)
      if (startDate.getTime() >= weekStart.getTime() && startDate.getTime() < weekStart.getTime() + (7 * 24 * 60 * 60 * 1000)) {
        this.eventsThisWeek++;
      }

      // 3. Événements pour la liste "Récents" (passés de 2 jours ou futurs jusqu'à 3 jours)
      if (startDate.getTime() >= twoDaysAgo.getTime() && startDate.getTime() < threeDaysFromNow.getTime()) {
        eventsForRecentList.push(event);
      }
    });
    
    // Triez et limitez les événements récents/futurs
    this.recentEvents = eventsForRecentList
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
      .slice(0, this.RECENT_EVENTS_LIMIT);
  }
}