import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { IRegisterRequest } from '../../core/models/auth.models';
//import { IRegisterRequest } from 'src/app/core/models/auth.models'; // Assurez-vous d'importer l'interface IRegisterRequest

@Component({
  selector: 'app-register',
  standalone: true,
  // ⚠️ ReactiveFormsModule est nécessaire pour utiliser les formulaires réactifs
  imports: [CommonModule, ReactiveFormsModule, RouterLink], 
  templateUrl: './register.html', // Corrigé pour correspondre au nom de fichier 'register.html'
  styleUrls: ['./register.scss'] // Corrigé pour correspondre au nom de fichier 'register.scss'
})
export class RegisterComponent implements OnInit {
  
  // Correction TS2564 : Ajout du '!'
  registerForm!: FormGroup; 
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      
      // 🚀 CORRECTION FINALE : On utilise 'firstname' et 'lastname'
      // pour correspondre à l'interface IRegisterRequest et au DTO du backend.
      const registerData: IRegisterRequest = {
        firstname: formValue.prenom, // Corrigé : 'firstname'
        lastname: formValue.nom,      // Corrigé : 'lastname'
        email: formValue.email,
        password: formValue.password,
      };
      
      this.authService.register(registerData).subscribe({ // Utilisation des données transformées
        next: (response) => {
          console.log('Inscription réussie', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error("Échec de l'inscription", error);
          alert("Échec de l'inscription. L'utilisateur existe peut-être déjà ou un problème est survenu.");
        }
      });
    }
  }

  get f() { return this.registerForm.controls; }
}
