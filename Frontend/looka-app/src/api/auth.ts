/**
 * 认证相关 API
 */

import { LoginRequest, LoginResponse, SendCodeResponse } from '../types';
import { mockDelay, mockUser, generateMockId } from './mock';

// 是否使用 Mock API
const USE_MOCK = true;

/**
 * 发送验证码
 */
async function sendCode(phone: string): Promise<SendCodeResponse> {
  if (USE_MOCK) {
    await mockDelay(500, 1000);
    console.log(`[Mock] 验证码已发送到 ${phone}: 123456`);
    return {
      success: true,
      expiresIn: 60,
    };
  }

  // 真实 API 调用
  // return api.post('/auth/send-code', { phone });
  throw new Error('Real API not implemented');
}

/**
 * 登录
 */
async function login(data: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK) {
    await mockDelay(800, 1500);

    // 模拟验证码验证（任意 6 位数字都可以）
    if (!/^\d{6}$/.test(data.code)) {
      throw { code: 'INVALID_CODE', message: '验证码格式错误' };
    }

    // 模拟手机号验证
    if (!/^1[3-9]\d{9}$/.test(data.phone)) {
      throw { code: 'INVALID_PHONE', message: '手机号格式错误' };
    }

    const token = `mock_token_${generateMockId('tk')}`;

    return {
      user: {
        ...mockUser,
        phone: data.phone,
      },
      token,
      expiresIn: 86400 * 7, // 7 天
    };
  }

  // 真实 API 调用
  // return api.post('/auth/login', data);
  throw new Error('Real API not implemented');
}

/**
 * 登出
 */
async function logout(): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return;
  }

  // 真实 API 调用
  // return api.post('/auth/logout');
  throw new Error('Real API not implemented');
}

/**
 * 刷新 Token
 */
async function refreshToken(): Promise<{ token: string; expiresIn: number }> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return {
      token: `mock_token_${generateMockId('tk')}`,
      expiresIn: 86400 * 7,
    };
  }

  // 真实 API 调用
  // return api.post('/auth/refresh');
  throw new Error('Real API not implemented');
}

export const authApi = {
  sendCode,
  login,
  logout,
  refreshToken,
};
