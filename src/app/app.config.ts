import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// ⚠️ CORRECTION : Le fichier est probablement nommé 'jwt-interceptor.ts' ou 'jwt-interceptor'
import { jwtInterceptor } from './core/interceptors/jwt-interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Utilisation de withInterceptors pour injecter l'intercepteur
    provideHttpClient(withInterceptors([jwtInterceptor])),
  ],
};
