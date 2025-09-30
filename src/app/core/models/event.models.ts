// src/app/core/models/event.models.ts

// Correspond à votre Participant.java
export interface IParticipant {
  id?: number; // Optionnel car non fourni lors de la création
  nom: string;
  prenom: string;
  email: string;
}

// Correspond à votre Event.java et EventDTO.java
export interface IEvent {
  id?: number; // Optionnel car non fourni lors de la création
  titre: string;
  description: string;
  lieu: string;
  // Les dates/heures sont transmises en STRING par l'API REST
  // Format attendu (basé sur votre @JsonFormat) : "YYYY-MM-DD HH:MM"
  dateDebut: string;
  dateFin: string;
  
  // Le backend attend une liste de l'entité Participant complète
  participants: IParticipant[];
}

// Correspond à votre EventResponseDTO.java (pour les requêtes paginées)
export interface IEventResponseDTO {
  events: IEvent[];
  total: number;
  currentPage: number;
  totalPages: number;
}