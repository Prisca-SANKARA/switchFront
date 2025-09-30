import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  // ⚠️ ReactiveFormsModule est nécessaire pour utiliser les formulaires réactifs
  imports: [CommonModule, ReactiveFormsModule, RouterLink], 
  templateUrl: './register.html', // Corrigé pour correspondre au nom de fichier 'register.html'
  styleUrls: ['./register.scss'] // Corrigé pour correspondre au nom de fichier 'register.scss'
})
export class RegisterComponent implements OnInit {
  
  registerForm: FormGroup;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // Champ de confirmation de mot de passe (si vous en avez besoin)
      // confirmPassword: ['', Validators.required] 
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const user = this.registerForm.value;
      
      this.authService.register(user).subscribe({
        next: (response) => {
          console.log('Inscription réussie', response);
          // Redirection vers la page de login après inscription
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error("Échec de l'inscription", error);
          // ⚠️ Afficher un message d'erreur
          alert("Échec de l'inscription. L'utilisateur existe peut-être déjà ou un problème est survenu.");
        }
      });
    }
  }

  get f() { return this.registerForm.controls; }
}
