// src/app/events/event-form-modal/event-form-modal.component.ts

import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap'; // ⚠️ NgbActiveModal pour gérer la modale
import { EventService } from '../event.service';
import { IEvent, IParticipant } from '../../core/models/event.models';

@Component({
  selector: 'app-event-form-modal',
  standalone: true,
  // ⚠️ Import des modules nécessaires, notamment ReactiveFormsModule
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-form-modal.html',
  styleUrls: ['./event-form-modal.scss'] // ⚠️ Utilisation de SCSS
})
export class EventFormModalComponent implements OnInit {
  
  // ⚠️ Input pour l'édition : l'événement à modifier
  @Input() eventToEdit: IEvent | null = null;
  @Input() initialDate: string | null = null; // Date cliquée pour la création rapide

  private fb = inject(FormBuilder);
  // Service pour interagir avec la modale elle-même (fermer, annuler)
  public activeModal = inject(NgbActiveModal); 
  private eventService = inject(EventService);
  
  eventForm!: FormGroup;

  // Accesseur pour le FormArray des participants (facilite l'usage dans le template)
  get participants(): FormArray {
    return this.eventForm.get('participants') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
    if (this.eventToEdit) {
      this.populateForm(this.eventToEdit);
    } else if (this.initialDate) {
      // Pour une création rapide basée sur un clic dans le calendrier
      const dateHeure = `${this.initialDate}T10:00:00`; // Exemple d'heure par défaut
      this.eventForm.patchValue({
        dateDebut: dateHeure,
        dateFin: dateHeure
      });
    }
    
    // S'assurer qu'il y a au moins un champ participant pour l'UX si on n'est pas en édition
    if (this.participants.length === 0) {
        this.addParticipant();
    }
  }

  /**
   * Initialise la structure du formulaire avec les validateurs.
   */
  initForm(): void {
    // ⚠️ CRÉATION DE LA STRUCTURE RÉACTIVE
    this.eventForm = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      lieu: [''],
      // ⚠️ IMPORTANT : Les dates doivent être des strings au format attendu par Spring Boot
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      // ⚠️ FormArray pour la liste des participants
      participants: this.fb.array([]) 
    });
  }
  
  /**
   * Crée un nouveau FormGroup pour un participant.
   */
  createParticipantGroup(participant: IParticipant = { nom: '', prenom: '', email: '' }): FormGroup {
    return this.fb.group({
      // L'ID est inclus si l'entité existe déjà (édition)
      id: [participant.id], 
      nom: [participant.nom, Validators.required],
      prenom: [participant.prenom, Validators.required],
      email: [participant.email, [Validators.required, Validators.email]],
    });
  }

  /**
   * Ajoute un champ participant vide au FormArray.
   */
  addParticipant(): void {
    this.participants.push(this.createParticipantGroup());
  }

  /**
   * Retire un participant du FormArray.
   * @param index Index du participant à retirer.
   */
  removeParticipant(index: number): void {
    this.participants.removeAt(index);
  }

  /**
   * Prépare les données pour l'édition.
   */
  populateForm(event: IEvent): void {
    // Remplissage des champs de base
    this.eventForm.patchValue({
      titre: event.titre,
      description: event.description,
      lieu: event.lieu,
      // ⚠️ Les dates sont au format ISO 8601 (ex: 2024-06-15T10:00) pour les champs HTML 'datetime-local'
      dateDebut: this.formatDateForInput(event.dateDebut),
      dateFin: this.formatDateForInput(event.dateFin),
    });

    // Remplissage du FormArray des participants
    event.participants.forEach(participant => {
      this.participants.push(this.createParticipantGroup(participant));
    });
  }

  /**
   * Convertit la chaîne de date/heure du backend ("YYYY-MM-DD HH:MM")
   * au format requis par <input type="datetime-local"> ("YYYY-MM-DDTHH:MM").
   * @param dateString La date/heure brute du backend.
   */
  private formatDateForInput(dateString: string): string {
    // Si votre backend retourne "2024-01-01 10:00", il faut le transformer en "2024-01-01T10:00"
    if (dateString && dateString.includes(' ')) {
      return dateString.replace(' ', 'T');
    }
    return dateString;
  }
  
  /**
   * Inverse la conversion pour l'envoi au backend.
   * @param dateInput La valeur de l'input datetime-local ("YYYY-MM-DDTHH:MM").
   */
  private formatDateForBackend(dateInput: string): string {
    // Si l'input est "2024-01-01T10:00", on le re-transforme en "2024-01-01 10:00"
     if (dateInput && dateInput.includes('T')) {
      return dateInput.replace('T', ' ');
    }
    return dateInput;
  }
  
  /**
   * Soumission du formulaire (Création ou Mise à jour).
   */
  onSubmit(): void {
    if (this.eventForm.invalid) {
      // Marquer tous les champs comme 'touchés' pour afficher les erreurs
      this.eventForm.markAllAsTouched(); 
      return;
    }

    // ⚠️ On récupère les données brutes du formulaire
    const rawFormValue = this.eventForm.getRawValue();
    
    // ⚠️ On reconstruit l'objet IEvent en corrigeant le format des dates pour le backend
    const eventPayload: IEvent = {
        titre: rawFormValue.titre,
        description: rawFormValue.description,
        lieu: rawFormValue.lieu,
        dateDebut: this.formatDateForBackend(rawFormValue.dateDebut),
        dateFin: this.formatDateForBackend(rawFormValue.dateFin),
        // Le FormArray fournit déjà les objets IParticipant
        participants: rawFormValue.participants
    };
    
    // Si on est en mode édition, on inclut l'ID
    if (this.eventToEdit?.id) {
        eventPayload.id = this.eventToEdit.id;
        this.updateEvent(this.eventToEdit.id, eventPayload);
    } else {
        this.createEvent(eventPayload);
    }
  }
  
  // --- Gestion du CRUD via Service (Méthodes à implémenter au Service) ---
  
  createEvent(event: IEvent): void {
       console.log("L'evènement envoyé est : ", event); 
      this.eventService.createEvent(event).subscribe({
          next: () => {
              // 'true' indique à la modale d'origine que l'opération a réussi
            
              this.activeModal.close(true); 
          },
          error: (err) => {
              console.error('Erreur de création d\'événement:', err);
              alert('Échec de la création de l\'événement.');
          }
      });
  }
  
  updateEvent(id: number, event: IEvent): void {
      this.eventService.updateEvent(id, event).subscribe({
          next: () => {
              this.activeModal.close(true); 
          },
          error: (err) => {
              console.error('Erreur de mise à jour d\'événement:', err);
              alert('Échec de la mise à jour de l\'événement.');
          }
      });
  }
}