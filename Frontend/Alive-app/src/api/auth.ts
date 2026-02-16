import { LoginRequest, LoginResponse, SendCodeResponse, SocialLoginRequest } from '../types';
import { api } from './client';
import { mapUser } from './mappers';

const REFRESH_TOKEN_STORAGE_KEY = 'alive_refresh_token';

interface RawLoginResponse {
  token: string;
  refreshToken?: string;
  user: unknown;
  expiresIn: number;
}

interface RawRefreshResponse {
  token: string;
  expiresIn: number;
}

function saveRefreshToken(token?: string) {
  if (!token) return;
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
}

function readRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

async function sendCode(phone: string): Promise<SendCodeResponse> {
  return api.post<SendCodeResponse>('/auth/send-code', { phone });
}

async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<RawLoginResponse>('/auth/login', data);
  saveRefreshToken(res.refreshToken);
  return {
    user: mapUser(res.user),
    token: res.token,
    expiresIn: res.expiresIn,
  };
}

async function socialLogin(data: SocialLoginRequest): Promise<LoginResponse> {
  const res = await api.post<RawLoginResponse>('/auth/social-login', data);
  saveRefreshToken(res.refreshToken);
  return {
    user: mapUser(res.user),
    token: res.token,
    expiresIn: res.expiresIn,
  };
}

async function logout(): Promise<void> {
  try {
    await api.post<{ success: boolean }>('/auth/logout');
  } finally {
    clearRefreshToken();
  }
}

async function refreshToken(): Promise<{ token: string; expiresIn: number }> {
  const refreshTokenValue = readRefreshToken();
  if (!refreshTokenValue) {
    throw { code: 'NO_REFRESH_TOKEN', message: 'No refresh token available' };
  }
  const res = await api.post<RawRefreshResponse>('/auth/refresh', {
    refreshToken: refreshTokenValue,
  });
  return {
    token: res.token,
    expiresIn: res.expiresIn,
  };
}

export const authApi = {
  sendCode,
  login,
  socialLogin,
  logout,
  refreshToken,
};
