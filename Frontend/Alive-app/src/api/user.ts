import { User, UserStats } from '../types';
import { api } from './client';
import { endpoints } from './endpoints';
import { mapUser } from './mappers';
import { asNumber } from '../utils/coerce';

async function getCurrentUser(): Promise<User> {
  const me = await api.get<unknown>(endpoints.user.me);
  try {
    const agents = await api.get<unknown>(endpoints.user.agents);
    return mapUser(me, agents);
  } catch {
    return mapUser(me);
  }
}

async function updateUser(data: Partial<User>): Promise<User> {
  const payload = {
    nickname: data.nickname,
    avatar: data.avatar,
    email: data.email,
    bio: data.bio,
    gender: data.gender,
    birthdate: data.birthdate,
  };
  const me = await api.put<unknown>(endpoints.user.me, payload);
  try {
    const agents = await api.get<unknown>(endpoints.user.agents);
    return mapUser(me, agents);
  } catch {
    return mapUser(me);
  }
}

async function getUserStats(): Promise<UserStats> {
  const res = await api.get<Record<string, unknown>>(endpoints.user.stats);
  const src = (res ?? {}) as Record<string, unknown>;
  return {
    agentsCreated: asNumber(src.agentsCreated, 0),
    agentsLost: asNumber(src.agentsLost, 0),
    totalTimerGiven: asNumber(src.totalTimerGiven, 0),
    dailyLoginStreak: asNumber(src.dailyLoginStreak, 0),
  };
}

export const userApi = {
  getCurrentUser,
  updateUser,
  getUserStats,
};
