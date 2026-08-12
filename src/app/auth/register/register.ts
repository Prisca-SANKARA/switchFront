import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { IRegisterRequest } from '../../core/models/auth.models';
import { passwordPolicyValidator } from '../../core/validators/password.validator';
import { PasswordRequirementsComponent } from '../../core/components/password-requirements/password-requirements';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PasswordRequirementsComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string | null = null;
  registered = false;
  successMessage = '';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordPolicyValidator]],
    });
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.registerForm.invalid) {
      return;
    }

    const formValue = this.registerForm.value;

    // Mapping vers le contrat backend (RegisterRequest.java).
    const registerData: IRegisterRequest = {
      username: formValue.username,
      firstName: formValue.prenom,
      lastName: formValue.nom,
      email: formValue.email,
      password: formValue.password,
    };

    this.authService.register(registerData).subscribe({
      next: (res) => {
        // Compte créé mais INACTIF : l'utilisateur doit vérifier son email.
        this.registered = true;
        this.successMessage =
          res.message || 'Inscription réussie. Vérifiez votre email pour activer votre compte.';
      },
      error: (error) => {
        console.error("Échec de l'inscription", error);
        this.errorMessage =
          error.error?.message ||
          "Échec de l'inscription. L'email ou le nom d'utilisateur existe peut-être déjà.";
      },
    });
  }

  get f() {
    return this.registerForm.controls;
  }
}
