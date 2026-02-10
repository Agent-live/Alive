import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../utils/storage';
import { ApiError } from '../types';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 30000;

// 创建 Axios 实例
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加认证 Token
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

// 响应拦截器
client.interceptors.response.use(
  (response) => {
    // 直接返回数据
    return response.data;
  },
  (error: AxiosError<ApiError>) => {
    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response;

      // 401 未授权 - 清除登录状态并跳转登录页
      if (status === 401) {
        tokenStorage.remove();
        // 使用事件通知应用处理登出
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // 403 禁止访问
      if (status === 403) {
        console.error('Access forbidden');
      }

      // 返回 API 错误信息
      const apiError: ApiError = {
        code: data?.code || `HTTP_${status}`,
        message: data?.message || getDefaultErrorMessage(status),
        details: data?.details,
      };

      return Promise.reject(apiError);
    }

    // 网络错误
    if (error.request) {
      const apiError: ApiError = {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
      };
      return Promise.reject(apiError);
    }

    // 其他错误
    const apiError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || '发生未知错误',
    };
    return Promise.reject(apiError);
  }
);

// 默认错误消息
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: '请求参数错误',
    401: '请先登录',
    403: '没有权限访问',
    404: '请求的资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
  };
  return messages[status] || `请求失败 (${status})`;
}

// 导出实例
export default client;

// 导出请求方法
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
