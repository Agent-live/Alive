/**
 * 用户相关 API
 */

import { User, Address, UserStats } from '../types';
import { mockDelay, mockUser, mockAddresses, generateMockId } from './mock';

// 是否使用 Mock API
const USE_MOCK = true;

// 模拟数据存储
let addresses = [...mockAddresses];

/**
 * 获取当前用户信息
 */
async function getCurrentUser(): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(300, 600);
    return mockUser;
  }

  // return api.get('/user/me');
  throw new Error('Real API not implemented');
}

/**
 * 更新用户信息
 */
async function updateUser(data: Partial<User>): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(400, 800);
    return {
      ...mockUser,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  // return api.put('/user/me', data);
  throw new Error('Real API not implemented');
}

/**
 * 获取用户统计
 */
async function getUserStats(): Promise<UserStats> {
  if (USE_MOCK) {
    await mockDelay(200, 400);
    return {
      wishlistCount: 12,
      closetCount: 8,
      orderCount: 5,
      joinedGroupBuys: 3,
    };
  }

  // return api.get('/user/stats');
  throw new Error('Real API not implemented');
}

/**
 * 获取地址列表
 */
async function getAddresses(): Promise<Address[]> {
  if (USE_MOCK) {
    await mockDelay(300, 500);
    return addresses;
  }

  // return api.get('/user/addresses');
  throw new Error('Real API not implemented');
}

/**
 * 添加地址
 */
async function addAddress(
  data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Address> {
  if (USE_MOCK) {
    await mockDelay(400, 700);

    // 如果是默认地址，取消其他默认
    if (data.isDefault) {
      addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
    }

    const newAddress: Address = {
      ...data,
      id: generateMockId('addr'),
      userId: mockUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addresses.push(newAddress);
    return newAddress;
  }

  // return api.post('/user/addresses', data);
  throw new Error('Real API not implemented');
}

/**
 * 更新地址
 */
async function updateAddress(id: string, data: Partial<Address>): Promise<Address> {
  if (USE_MOCK) {
    await mockDelay(400, 700);

    const index = addresses.findIndex((addr) => addr.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: '地址不存在' };
    }

    // 如果设为默认，取消其他默认
    if (data.isDefault) {
      addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
    }

    const updatedAddress: Address = {
      ...addresses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    addresses[index] = updatedAddress;
    return updatedAddress;
  }

  // return api.put(`/user/addresses/${id}`, data);
  throw new Error('Real API not implemented');
}

/**
 * 删除地址
 */
async function deleteAddress(id: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(300, 500);

    const index = addresses.findIndex((addr) => addr.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: '地址不存在' };
    }

    addresses.splice(index, 1);
    return;
  }

  // return api.delete(`/user/addresses/${id}`);
  throw new Error('Real API not implemented');
}

/**
 * 设置默认地址
 */
async function setDefaultAddress(id: string): Promise<void> {
  if (USE_MOCK) {
    await mockDelay(300, 500);

    const index = addresses.findIndex((addr) => addr.id === id);
    if (index === -1) {
      throw { code: 'NOT_FOUND', message: '地址不存在' };
    }

    addresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));
    return;
  }

  // return api.post(`/user/addresses/${id}/default`);
  throw new Error('Real API not implemented');
}

/**
 * 更新身材数据
 */
async function updateBodyMeasurements(
  data: User['bodyMeasurements']
): Promise<User> {
  if (USE_MOCK) {
    await mockDelay(400, 700);
    return {
      ...mockUser,
      bodyMeasurements: data,
      updatedAt: new Date().toISOString(),
    };
  }

  // return api.put('/user/body-measurements', data);
  throw new Error('Real API not implemented');
}

export const userApi = {
  getCurrentUser,
  updateUser,
  getUserStats,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  updateBodyMeasurements,
};
