import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Vue administrateur d'un compte (miroir de AdminUserDto.java, sans données sensibles). */
export interface IAdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  mfaEnabled: boolean;
  role: string;
  createdAt: string;
  eventsCreated: number;
}

/** Appels au back-office /api/admin/** (réservé au rôle ADMIN côté backend). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/admin';

  getUsers(): Observable<IAdminUser[]> {
    return this.http.get<IAdminUser[]>(`${this.apiUrl}/users`);
  }

  setActive(id: number, active: boolean): Observable<IAdminUser> {
    return this.http.patch<IAdminUser>(`${this.apiUrl}/users/${id}/active?active=${active}`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }
}
