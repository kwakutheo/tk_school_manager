/**
 * Auth API endpoints
 */
import { apiClient } from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  email: string;
  role: string;
  school_id: string | null;
  is_active: boolean;
  created_at: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken }),

  logout: (token: string) =>
    apiClient.post<void>('/auth/logout', {}, token),

  me: (token: string) =>
    apiClient.get<MeResponse>('/auth/me', token),
};
