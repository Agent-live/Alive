import { api } from './client'
import { endpoints } from './endpoints'

export interface UserSettings {
  theme: string
  language: string
}

async function getUserSettings(): Promise<UserSettings> {
  return api.get<UserSettings>(endpoints.user.settings)
}

async function updateUserSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  return api.put<UserSettings>(endpoints.user.settings, patch)
}

export const settingsApi = {
  getUserSettings,
  updateUserSettings,
}
