import { User, UserStats } from '../types';
import { api } from './client';
import { mapUser } from './mappers';

async function getCurrentUser(): Promise<User> {
  const me = await api.get<unknown>('/user/me');
  try {
    const agents = await api.get<unknown>('/user/agents');
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
  const me = await api.put<unknown>('/user/me', payload);
  try {
    const agents = await api.get<unknown>('/user/agents');
    return mapUser(me, agents);
  } catch {
    return mapUser(me);
  }
}

async function getUserStats(): Promise<UserStats> {
  const res = await api.get<Record<string, unknown>>('/user/stats');
  return {
    agentsCreated: Number(res.agentsCreated || 0),
    agentsLost: Number(res.agentsLost || 0),
    totalTimerGiven: Number(res.totalTimerGiven || 0),
    dailyLoginStreak: Number(res.dailyLoginStreak || 0),
  };
}

export const userApi = {
  getCurrentUser,
  updateUser,
  getUserStats,
};
