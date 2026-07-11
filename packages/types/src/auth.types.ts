import { Role } from '@school-saas/config';

export interface IJwtPayload {
  sub: string;
  email: string;
  role: Role;
  schoolId: string | null;
}

export interface IRefreshTokenPayload {
  sub: string;
  tokenType: 'refresh';
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string | null;
}
