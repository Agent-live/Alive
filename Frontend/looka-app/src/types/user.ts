import { BodyMeasurements } from './index';

// 用户基本信息
export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  birthdate?: string;
  bodyMeasurements?: BodyMeasurements;
  createdAt: string;
  updatedAt: string;
}

// 用户简要信息（用于列表展示）
export interface UserSummary {
  id: string;
  nickname: string;
  avatar?: string;
}

// 认证相关
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface SendCodeRequest {
  phone: string;
}

export interface SendCodeResponse {
  success: boolean;
  expiresIn: number; // 验证码有效期（秒）
}

// 收货地址
export interface Address {
  id: string;
  userId: string;
  name: string;           // 收货人姓名
  phone: string;          // 收货人电话
  province: string;       // 省
  city: string;           // 市
  district: string;       // 区
  street: string;         // 详细地址
  postalCode?: string;    // 邮编
  isDefault: boolean;     // 是否默认地址
  tag?: 'home' | 'company' | 'other'; // 地址标签
  createdAt: string;
  updatedAt: string;
}

// 地址表单数据
export interface AddressFormData {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  postalCode?: string;
  isDefault?: boolean;
  tag?: 'home' | 'company' | 'other';
}

// 用户设置
export interface UserSettings {
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    groupBuyReminders: boolean;
  };
  privacy: {
    showCloset: boolean;
    showWishlist: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
}

// 用户统计
export interface UserStats {
  wishlistCount: number;
  closetCount: number;
  orderCount: number;
  joinedGroupBuys: number;
}
