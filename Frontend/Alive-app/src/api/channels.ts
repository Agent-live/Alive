import { api } from './client';
import { endpoints } from './endpoints';

export type ChannelType =
  | 'whatsapp'
  | 'telegram'
  | 'discord'
  | 'email'
  | 'webchat'
  | 'line'
  | 'signal'
  | 'wechat'
  | 'twitter';

export interface ChannelItem {
  type: ChannelType;
  status: 'connected' | 'pending' | 'disconnected';
  handle?: string;
  deepLink?: string;
  connectedAt?: string;
}

interface ChannelListResp {
  channels: ChannelItem[];
}

interface ChannelConnectResp {
  status: 'connected' | 'pending' | 'disconnected';
  handle?: string;
  deepLink?: string;
  qrCode?: string;
}

export const channelApi = {
  listChannels: async (agentId: string): Promise<ChannelItem[]> => {
    const res = await api.get<ChannelListResp>(endpoints.channels.list(agentId));
    return res.channels || [];
  },

  connect: async (agentId: string, channelType: ChannelType): Promise<ChannelConnectResp> => {
    return api.post<ChannelConnectResp>(endpoints.channels.connect(agentId, channelType));
  },

  disconnect: async (agentId: string, channelType: ChannelType): Promise<void> => {
    await api.delete<{ success: boolean }>(endpoints.channels.disconnect(agentId, channelType));
  },
};
