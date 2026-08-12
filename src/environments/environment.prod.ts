// src/environments/environment.prod.ts
// Utilisé automatiquement pour le build de production (voir angular.json > fileReplacements).
//
// ⚠️ AVANT DE DÉPLOYER : remplace l'URL ci-dessous par l'URL PUBLIQUE de ton
// backend Render (ex. https://e-agenda-backend.onrender.com/api).
// Le "/api" final est important. Le WebSocket est dérivé automatiquement
// (https -> wss) par RealtimeService.
export const environment = {
  production: true,
  apiUrl: 'https://VOTRE-BACKEND.onrender.com/api',
};
