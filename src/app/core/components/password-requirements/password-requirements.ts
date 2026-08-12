import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PASSWORD_RULES } from '../../validators/password.validator';

/**
 * Affiche la liste des exigences de mot de passe avec un état ✓ / • en direct.
 * Utilisé sur les écrans inscription, activation et réinitialisation.
 */
@Component({
  selector: 'app-password-requirements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul class="pwd-rules">
      <li *ngFor="let rule of rules" [class.ok]="rule.test(value)">
        <span class="mark">{{ rule.test(value) ? '✓' : '•' }}</span>{{ rule.label }}
      </li>
    </ul>
  `,
  styles: [
    `
      .pwd-rules {
        list-style: none;
        margin: 8px 0 4px;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 12px;
      }
      .pwd-rules li {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 0.8rem;
        color: var(--muted, #6b6780);
        transition: color 0.15s ease;
      }
      .pwd-rules li .mark {
        display: inline-grid;
        place-items: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        font-size: 0.7rem;
        background: rgba(107, 103, 128, 0.14);
        color: var(--muted, #6b6780);
      }
      .pwd-rules li.ok {
        color: var(--success, #10b981);
      }
      .pwd-rules li.ok .mark {
        background: color-mix(in srgb, var(--success, #10b981) 18%, transparent);
        color: var(--success, #10b981);
      }
      @media (max-width: 460px) {
        .pwd-rules {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PasswordRequirementsComponent {
  @Input() value: string = '';
  readonly rules = PASSWORD_RULES;
}
