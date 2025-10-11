import { AuthenticatedUser } from './authenticated-user.interface';

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresIn: string | number;
  refreshToken: string;
  refreshTokenExpiresIn: string | number;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
