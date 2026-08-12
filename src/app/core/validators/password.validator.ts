import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Règles de politique de mot de passe — miroir exact de `PasswordPolicy` côté backend.
 * Réutilisées par le validateur ET par l'affichage en direct des exigences.
 */
export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Au moins 8 caractères', test: (v) => (v || '').length >= 8 },
  { label: 'Une lettre minuscule', test: (v) => /[a-z]/.test(v || '') },
  { label: 'Une lettre majuscule', test: (v) => /[A-Z]/.test(v || '') },
  { label: 'Un chiffre', test: (v) => /\d/.test(v || '') },
  { label: 'Un caractère spécial', test: (v) => /[^A-Za-z0-9]/.test(v || '') },
];

/** Validateur Angular : invalide tant qu'une règle n'est pas satisfaite. */
export const passwordPolicyValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value || '';
  const unmet = PASSWORD_RULES.filter((r) => !r.test(value));
  return unmet.length ? { passwordPolicy: true } : null;
};
