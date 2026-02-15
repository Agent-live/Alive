import { api } from './client';

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
    const res = await api.get<ChannelListResp>(`/channels/${agentId}`);
    return res.channels || [];
  },

  connect: async (agentId: string, channelType: ChannelType): Promise<ChannelConnectResp> => {
    return api.post<ChannelConnectResp>(`/channels/${agentId}/${channelType}/connect`);
  },

  disconnect: async (agentId: string, channelType: ChannelType): Promise<void> => {
    await api.delete<{ success: boolean }>(`/channels/${agentId}/${channelType}/disconnect`);
  },
};

