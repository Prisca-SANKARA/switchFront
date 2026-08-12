// src/app/core/models/auth.models.ts
// Ces interfaces reflètent EXACTEMENT les DTO du backend Spring Boot.

// Correspond à RegisterRequest.java (username est obligatoire côté backend).
export interface IRegisterRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Correspond à LoginRequest.java
export interface ILoginRequest {
  email: string;
  password: string;
}

// Correspond à UserResponse.java
export interface IUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  isActive?: boolean;
  mfaEnabled?: boolean;
  // Rôle applicatif ('USER' | 'ADMIN') renvoyé par le backend.
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Correspond à AuthResponse.java
export interface IAuthResponse {
  success: boolean;
  message: string;
  user?: IUser;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  // Renseigné quand la MFA est active : aucun token définitif tant que le
  // second facteur n'a pas été validé via /auth/mfa/verify.
  mfaRequired?: boolean;
  mfaToken?: string;
}

// Corps de /auth/mfa/verify
export interface IMfaVerifyRequest {
  mfaToken: string;
  code: string;
}

// Corps de /auth/refresh
export interface IRefreshRequest {
  refreshToken: string;
}

// Réponse de /api/mfa/setup
export interface IMfaSetupResponse {
  secret: string;
  qrCodeDataUri: string;
  otpAuthUri: string;
}

// Réponse de /api/mfa/enable : les codes de secours (affichés une seule fois).
export interface IMfaEnableResponse {
  success: boolean;
  message: string;
  recoveryCodes: string[];
}
