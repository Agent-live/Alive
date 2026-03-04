import { api } from './client';
import { endpoints } from './endpoints';

export interface ConvUnreadItem {
  conversationId: string;
  unreadCount: number;
}

export interface UnreadCountResp {
  totalUnread: number;
  conversationUnreads?: ConvUnreadItem[];
}

export const notificationApi = {
  getUnreadCount: async (): Promise<UnreadCountResp> => {
    const result = await api.get<UnreadCountResp>(endpoints.notifications.unreadCount);
    return result ?? { totalUnread: 0, conversationUnreads: [] };
  },
};
