import { create } from 'zustand';
import { Conversation, ConversationMessage } from '../types';
import { conversationApi } from '../api/conversations';
import { notificationApi } from '../api/notifications';

interface ConversationState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeAgentId?: string;
  messages: ConversationMessage[];
  loading: boolean;
  messagesLoading: boolean;
  hasMoreMessages: boolean;
  messagePage: number;
  unreadCounts: Record<string, number>;

  fetchConversations: (chatType?: 'human-bot' | 'bot-bot', agentId?: string) => Promise<void>;
  selectConversation: (id: string, agentId?: string) => Promise<void>;
  fetchMessages: (id: string, agentId?: string) => Promise<void>;
  loadMoreMessages: (agentId?: string) => Promise<void>;
  refreshMessages: (agentId?: string) => Promise<void>;
  markRead: (id: string, agentId?: string) => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  activeAgentId: undefined,
  messages: [],
  loading: false,
  messagesLoading: false,
  hasMoreMessages: true,
  messagePage: 1,
  unreadCounts: {},

  fetchConversations: async (chatType?: 'human-bot' | 'bot-bot', agentId?: string) => {
    set({ loading: true });
    try {
      const result = await conversationApi.getConversations(chatType, agentId);
      // Sync unread counts from conversation list response
      const unreadCounts: Record<string, number> = {};
      for (const conv of result.items) {
        if ((conv.unreadCount ?? 0) > 0) {
          unreadCounts[conv.id] = conv.unreadCount ?? 0;
        }
      }
      set({ conversations: result.items, loading: false, unreadCounts });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch conversations:', error);
    }
  },

  selectConversation: async (id: string, agentId?: string) => {
    set({ messagesLoading: true });
    try {
      const [conv, msgs] = await Promise.all([
        conversationApi.getDetail(id, agentId),
        conversationApi.getMessages(id, 1, 20, agentId),
      ]);
      set({
        activeConversation: conv,
        activeAgentId: agentId,
        messages: msgs.items,
        hasMoreMessages: msgs.hasMore,
        messagePage: 1,
        messagesLoading: false,
      });
      // Mark as read when selecting
      get().markRead(id, agentId).catch(() => {});
    } catch (error) {
      set({ messagesLoading: false });
      console.error('Failed to select conversation:', error);
    }
  },

  markRead: async (id: string, agentId?: string) => {
    try {
      await conversationApi.markRead(id, agentId);
      set((state) => ({
        unreadCounts: { ...state.unreadCounts, [id]: 0 },
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  },

  fetchUnreadCounts: async () => {
    try {
      const result = await notificationApi.getUnreadCount();
      const unreadCounts: Record<string, number> = {};
      for (const item of result.conversationUnreads ?? []) {
        unreadCounts[item.conversationId] = item.unreadCount;
      }
      set({ unreadCounts });
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  },

  fetchMessages: async (id: string, agentId?: string) => {
    set({ messagesLoading: true });
    try {
      const msgs = await conversationApi.getMessages(id, 1, 20, agentId);
      set({
        activeAgentId: agentId,
        messages: msgs.items,
        hasMoreMessages: msgs.hasMore,
        messagePage: 1,
        messagesLoading: false,
      });
    } catch (error) {
      set({ messagesLoading: false });
      console.error('Failed to fetch messages:', error);
    }
  },

  loadMoreMessages: async (agentId?: string) => {
    const { activeConversation, activeAgentId, messagePage, hasMoreMessages, messagesLoading } = get();
    if (!activeConversation || !hasMoreMessages || messagesLoading) return;
    set({ messagesLoading: true });
    try {
      const nextPage = messagePage + 1;
      const resolvedAgentId = agentId || activeAgentId;
      const msgs = await conversationApi.getMessages(activeConversation.id, nextPage, 20, resolvedAgentId);
      set((state) => ({
        activeAgentId: resolvedAgentId,
        messages: [...state.messages, ...msgs.items],
        hasMoreMessages: msgs.hasMore,
        messagePage: nextPage,
        messagesLoading: false,
      }));
    } catch (error) {
      set({ messagesLoading: false });
      console.error('Failed to load more messages:', error);
    }
  },

  refreshMessages: async (agentId?: string) => {
    const { activeConversation, activeAgentId } = get();
    if (!activeConversation) return;
    set({ messagesLoading: true });
    try {
      const resolvedAgentId = agentId || activeAgentId;
      const msgs = await conversationApi.getMessages(activeConversation.id, 1, 20, resolvedAgentId);
      set({
        activeAgentId: resolvedAgentId,
        messages: msgs.items,
        hasMoreMessages: msgs.hasMore,
        messagePage: 1,
        messagesLoading: false,
      });
    } catch (error) {
      set({ messagesLoading: false });
      console.error('Failed to refresh messages:', error);
    }
  },
}));
