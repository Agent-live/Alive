import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Capacitor } from '@capacitor/core';
import { tokenStorage } from '../utils/storage';
import { ApiError } from '../types';

// API base configuration
const DEFAULT_API_BASE_URL = '/api/v1';
const DEFAULT_IOS_NATIVE_API_BASE_URL = 'http://127.0.0.1:8888/api/v1';
const API_TIMEOUT = 30000;

function isIosNativePlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

function resolveApiBaseUrl(): string {
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (isIosNativePlatform()) {
    return (
      import.meta.env.VITE_IOS_NATIVE_API_BASE_URL?.trim() ||
      import.meta.env.VITE_IOS_SIMULATOR_API_BASE_URL?.trim() ||
      DEFAULT_IOS_NATIVE_API_BASE_URL
    );
  }

  return DEFAULT_API_BASE_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

// Create Axios instance
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response) => {
    // Return data directly
    return response.data;
  },
  (error: AxiosError<ApiError>) => {
    // Handle error response
    if (error.response) {
      const { status, data } = error.response;

      // 401 Unauthorized - clear auth state
      if (status === 401) {
        // Avoid repeated logout toasts when multiple in-flight requests return 401 at once.
        const hasToken = !!tokenStorage.get();
        if (hasToken) {
          tokenStorage.remove();
          // Notify app to handle logout
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }

      // 403 Forbidden
      if (status === 403) {
        console.error('Access forbidden');
      }

      // Return API error
      const apiError: ApiError = {
        code: data?.code || `HTTP_${status}`,
        message: data?.message || getDefaultErrorMessage(status),
        details: data?.details,
      };

      return Promise.reject(apiError);
    }

    // Network error
    if (error.request) {
      const apiError: ApiError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your network settings.',
      };
      return Promise.reject(apiError);
    }

    // Other errors
    const apiError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
    };
    return Promise.reject(apiError);
  }
);

// Default error messages
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad request',
    401: 'Please log in first',
    403: 'Access denied',
    404: 'Resource not found',
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service temporarily unavailable',
  };
  return messages[status] || `Request failed (${status})`;
}

// Export instance
export default client;

// Export request methods
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    client.get<unknown, T>(url, { params }),

  post: <T>(url: string, data?: unknown) =>
    client.post<unknown, T>(url, data),

  put: <T>(url: string, data?: unknown) =>
    client.put<unknown, T>(url, data),

  patch: <T>(url: string, data?: unknown) =>
    client.patch<unknown, T>(url, data),

  delete: <T>(url: string) =>
    client.delete<unknown, T>(url),
};
