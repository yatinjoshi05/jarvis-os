/**
 * Structure of a credential-based login request.
 */
export interface LoginRequest {
  username: string;
  password?: string;
  mfaCode?: string;
}

/**
 * Structure of a registration request.
 */
export interface RegisterRequest {
  email: string;
  username: string;
  password?: string;
}
