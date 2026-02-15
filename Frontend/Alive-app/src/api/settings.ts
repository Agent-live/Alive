import { api } from './client'

export interface UserSettings {
  theme: string
  language: string
}

async function getUserSettings(): Promise<UserSettings> {
  return api.get<UserSettings>('/user/settings')
}

async function updateUserSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  return api.put<UserSettings>('/user/settings', patch)
}

export const settingsApi = {
  getUserSettings,
  updateUserSettings,
}

