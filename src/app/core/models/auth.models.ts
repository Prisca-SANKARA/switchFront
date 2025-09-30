// src/app/core/models/auth.models.ts

// Correspond à votre RegisterRequest.java
export interface IRegisterRequest {
  lastname: string;
  firstname: string;
  email: string;
  password: string;
}

// Correspond à votre LoginRequest.java
export interface ILoginRequest {
  email: string;
  password: string;
}

// Correspond à votre AuthResponse.java
export interface IAuthResponse {
  token: string;
  lastname: string;
  firstname: string;
  email: string;
}