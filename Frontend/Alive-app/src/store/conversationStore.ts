import { create } from 'zustand';
import { Conversation, ConversationMessage } from '../types';
import { conversationApi } from '../api/conversations';

interface ConversationState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ConversationMessage[];
  loading: boolean;
  messagesLoading: boolean;
  hasMoreMessages: boolean;
  messagePage: number;

  fetchConversations: (chatType?: 'human-bot' | 'bot-bot') => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  fetchMessages: (id: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  messagesLoading: false,
  hasMoreMessages: true,
  messagePage: 1,

  fetchConversations: async (chatType?: 'human-bot' | 'bot-bot') => {
    set({ loading: true });
    try {
      const result = await conversationApi.getConversations(chatType);
      set({ conversations: result.items, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch conversations:', error);
    }
  },

  selectConversation: async (id: string) => {
    set({ messagesLoading: true });
    try {
      const conv = await conversationApi.getDetail(id);
      const msgs = await conversationApi.getMessages(id, 1, 20);
      set({
        activeConversation: conv,
        messages: msgs.items,
        hasMoreMessages: msgs.hasMore,
        messagePage: 1,
        messagesLoading: false,
      });
    } catch (error) {
      set({ messagesLoading: false });
      console.error('Failed to select conversation:', error);
    }
  },

  fetchMessages: async (id: string) => {
    set({ messagesLoading: true });
    try {
      const msgs = await conversationApi.getMessages(id, 1, 20);
      set({
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

  loadMoreMessages: async () => {
    const { activeConversation, messagePage, hasMoreMessages, messagesLoading } = get();
    if (!activeConversation || !hasMoreMessages || messagesLoading) return;
    set({ messagesLoading: true });
    try {
      const nextPage = messagePage + 1;
      const msgs = await conversationApi.getMessages(activeConversation.id, nextPage, 20);
      set((state) => ({
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

  refreshMessages: async () => {
    const { activeConversation } = get();
    if (!activeConversation) return;
    try {
      const msgs = await conversationApi.getMessages(activeConversation.id, 1, 20);
      set({
        messages: msgs.items,
        hasMoreMessages: msgs.hasMore,
        messagePage: 1,
      });
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  },
}));
