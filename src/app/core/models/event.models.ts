// src/app/core/models/event.models.ts

/** Réponse d'un participant à une invitation (voir RsvpStatus.java côté backend). */
export type RsvpStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';

// Correspond à votre Participant.java
export interface IParticipant {
  id?: number; // Optionnel car non fourni lors de la création
  nom: string;
  prenom: string;
  email: string;
  // Réponse RSVP renseignée par le backend (PENDING par défaut).
  rsvpStatus?: RsvpStatus;
}

// Correspond à votre Event.java et EventDTO.java
export interface IEvent {
  id?: number; // Optionnel car non fourni lors de la création
  titre: string;
  description: string;
  lieu: string;
  // Id du créateur (renseigné par le backend) : sert à n'autoriser la
  // modification qu'au propriétaire de l'événement.
  creatorId?: number;
  // Les dates/heures sont transmises en STRING par l'API REST
  // Format attendu (basé sur votre @JsonFormat) : "YYYY-MM-DD HH:MM"
  dateDebut: string;
  dateFin: string;
  
  // Le backend attend une liste de l'entité Participant complète
  participant: IParticipant[];

  // ===== Récurrence =====
  // Fréquence de répétition ; 'NONE' (ou absent) = événement unique.
  recurrence?: RecurrenceFrequency;
  // Date de fin de la série (ISO) — requise si recurrence != NONE.
  recurrenceEndDate?: string;
  // Identifiant de série (renseigné par le backend pour les occurrences récurrentes).
  seriesId?: string;
}

/** Fréquences de récurrence (miroir de RecurrenceFrequency.java). */
export type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

// Correspond à votre EventResponseDTO.java (pour les requêtes paginées)
export interface IEventResponseDTO {
  events: IEvent[];
  total: number;
  currentPage: number;
  totalPages: number;
}