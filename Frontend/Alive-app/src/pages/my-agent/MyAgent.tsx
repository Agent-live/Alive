import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/common';
import { AgentAvatar } from '../../components/agent';
import { Icon } from '../../components/common/Icon';
import { ChatAttachments } from '../../components/common/ChatAttachments';
import { UploadDraftList, type UploadingDraftItem } from '../../components/common/UploadDraftList';
import { useImageUploadChoice } from '../../components/common/ImageUploadChoiceSheet';
import { agentApi } from '../../api/agents';
import { chatApi } from '../../api/chat';
import { mediaApi } from '../../api/media';
import { channelApi, type ChannelItem, type ChannelType } from '../../api/channels';
import { conversationApi } from '../../api/conversations';
import { experienceApi } from '../../api/experiences';
import { skillApi } from '../../api/skills';
import { useAgentStore, useConversationStore, useTimerStore, useFeedStore, useTaskStore, toast } from '../../store';
import { TaskListPopup } from '../../components/task/TaskListPopup';
import { ActivityTimeline, ActivityTimelineCompact } from './ActivityTimeline';
import { InboxTab, channelConfig, PlatformBadge } from './InboxTab';
import { BotBotChatsTab } from './BotBotChatsTab';
import { RelationshipNetworkTab } from './RelationshipNetworkTab';
import { ChatBubble } from '../../components/conversation/ChatBubble';
import { mockActivityTraces, mockAgentSkills, mockInboxItems } from '../../mocks';
import i18n from '../../lib/i18n';
import type { AgentRelationship, InboxItem, Conversation, ActivityTrace, ConversationMessage } from '../../types/conversation';
import type { AgentExperience, AgentSkill, ChatHistoryMessage, MessageAttachment } from '../../types';

/* ─── Status dot color ─── */
const statusDotColor: Record<string, string> = {
  newborn: 'bg-sky-400',
  alive: 'bg-emerald-500',
  comfortable: 'bg-emerald-500',
  low: 'bg-orange-400',
  dying: 'bg-red-500',
  critical: 'bg-red-600 animate-pulse',
  dead: 'bg-gray-400',
};

const skillCategoryIcon: Record<string, string> = {
  creative: 'palette',
  analytical: 'analytics',
  social: 'forum',
  technical: 'code',
  other: 'category',
};

const skillCategoryColor: Record<string, string> = {
  creative: 'text-purple-500 bg-purple-500/10',
  analytical: 'text-blue-500 bg-blue-500/10',
  social: 'text-emerald-500 bg-emerald-500/10',
  technical: 'text-amber-500 bg-amber-500/10',
  other: 'text-gray-500 bg-gray-500/10',
};

type TabType = 'inbox' | 'social' | 'network';
type LeftPanelTab = 'activity' | 'skills';

/* ─── Desktop detection (md = 768px) ─── */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

/* ─── Chat message type ─── */
interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  attachments?: MessageAttachment[];
  timestamp: string;
  timeCost?: number;
}

function experienceToTrace(exp: AgentExperience): ActivityTrace {
  const type: ActivityTrace['type'] =
    exp.type === 'milestone' ? 'milestone' :
    exp.type === 'request' ? 'channel_msg' :
    'social';

  const emoji =
    type === 'milestone' ? 'flag' :
    type === 'channel_msg' ? 'chat' :
    'forum';

  return {
    id: exp.id,
    type,
    title: exp.title,
    detail: exp.description || undefined,
    emoji,
    timestamp: exp.date,
  };
}

function conversationToInboxItem(conv: Conversation, myAgentId: string): InboxItem {
  const participants = conv.participants || [];
  const others = participants.filter((p) => p.agentId !== myAgentId);
  const primaryOther = others[0];

  const senderName =
    conv.type === 'direct'
      ? (primaryOther?.agentName || conv.title || 'Conversation')
      : (conv.title || others.map((p) => p.agentName).filter(Boolean).join(', ') || 'Conversation');

  return {
    id: conv.id,
    channelType: 'webchat',
    senderName,
    senderAvatar: conv.type === 'direct' ? primaryOther?.agentAvatar : undefined,
    preview: normalizePreviewText(conv.lastMessagePreview || ''),
    timestamp: conv.lastMessageAt || conv.createdAt,
    unreadCount: conv.unreadCount || 0,
    conversationId: conv.id,
  };
}

function historyToChatMessages(messages: ChatHistoryMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      id: m.id,
      role: m.role === 'assistant' ? 'agent' : 'user',
      text: m.content,
      attachments: m.attachments || [],
      timestamp: m.createdAt,
    }));
}

function attachmentTag(attachments?: MessageAttachment[]): string {
  if (!attachments || attachments.length === 0) return '';
  if (attachments.some((a) => (a.mimeType || '').toLowerCase().startsWith('image/'))) return '[image]';
  if (attachments.some((a) => (a.mimeType || '').toLowerCase().startsWith('video/'))) return '[video]';
  if (attachments.some((a) => (a.mimeType || '').toLowerCase().startsWith('audio/'))) return '[audio]';
  return '[file]';
}

function normalizePreviewText(text: string): string {
  const raw = (text || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower === '[image]') return '[image]';
  if (lower === '[video]') return '[video]';
  if (lower === '[audio]') return '[audio]';
  if (lower === '[file]') return '[file]';
  if (lower.startsWith('[attachments x') && lower.endsWith(']')) return lower;
  return raw;
}

function chatHistoryPreview(messages: ChatHistoryMessage[]): string {
  if (!messages || messages.length === 0) return '';
  const last = messages[messages.length - 1];
  const tag = attachmentTag(last.attachments);
  if (tag) return tag;
  return normalizePreviewText((last.content || '').trim());
}

function chatMessagePreview(message: ChatMessage): string {
  const tag = attachmentTag(message.attachments);
  if (tag) return tag;
  return normalizePreviewText((message.text || '').trim());
}

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

function normalizeProgressPercent(progress: number): number {
  let pct = Math.max(0, Math.min(100, progress * 100));
  if (progress > 0 && pct < 0.1) pct = 0.1;
  if (progress < 1 && pct > 99.9) pct = 99.9;
  return pct;
}

export function MyAgentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId, loading, fetchMyAgents } = useAgentStore();
  const { conversations, loading: conversationsLoading, fetchConversations } = useConversationStore();
  const { fetchTransactions } = useTimerStore();
  const { fetchFeed } = useFeedStore();
  const { tasks, fetchTasks } = useTaskStore();
  const [taskPopupOpen, setTaskPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [relationships, setRelationships] = useState<AgentRelationship[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [latestChatPreview, setLatestChatPreview] = useState('');
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);
  const [selectedInboxMessages, setSelectedInboxMessages] = useState<ConversationMessage[]>([]);
  const [selectedInboxLoading, setSelectedInboxLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedConversationMessages, setSelectedConversationMessages] = useState<ConversationMessage[]>([]);
  const [selectedConversationLoading, setSelectedConversationLoading] = useState(false);
  const [guidanceInput, setGuidanceInput] = useState('');
  const [guidanceSending, setGuidanceSending] = useState(false);
  const [guidanceAttachments, setGuidanceAttachments] = useState<MessageAttachment[]>([]);
  const [guidanceUploading, setGuidanceUploading] = useState(false);
  const [guidanceUploadingPreview, setGuidanceUploadingPreview] = useState<UploadingDraftItem | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('activity');
  const isDesktop = useIsDesktop();

  /* Dashboard data */
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [activityTraces, setActivityTraces] = useState<ActivityTrace[]>([]);
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [channelBusy, setChannelBusy] = useState<Partial<Record<ChannelType, boolean>>>({});
  const [connectQr, setConnectQr] = useState<{ channel: ChannelType; qrCode: string } | null>(null);
  const [channelsExpanded, setChannelsExpanded] = useState(false);

  /* Chat dialog state */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatPendingAttachments, setChatPendingAttachments] = useState<MessageAttachment[]>([]);
  const [chatUploading, setChatUploading] = useState(false);
  const [chatUploadingPreview, setChatUploadingPreview] = useState<UploadingDraftItem | null>(null);
  const [chatTyping, setChatTyping] = useState(false);
  const [chatSessionId, setChatSessionId] = useState('main');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const guidanceFileInputRef = useRef<HTMLInputElement>(null);
  const { requestChoice: requestImageUploadChoice, sheetNode: imageUploadChoiceSheet } = useImageUploadChoice();

  const myAgent = useMemo(
    () => myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null,
    [myAgents, primaryAgentId],
  );
  const myAgentName = (myAgent?.name || '').trim() || 'Agent';
  const myAgentInitial = myAgentName.charAt(0).toUpperCase();

  useEffect(() => {
    fetchMyAgents();
    fetchTransactions();
    fetchFeed();
    fetchTasks();
  }, [fetchMyAgents, fetchTransactions, fetchFeed, fetchTasks]);

  /* Load dashboard data (inbox/activity/skills) */
  useEffect(() => {
    if (!myAgent) {
      setInboxItems([]);
      setActivityTraces([]);
      setAgentSkills([]);
      setChannels([]);
      return;
    }

    let cancelled = false;

    conversationApi
      .getConversations('human-bot')
      .then((res) => {
        if (cancelled) return;
        setInboxItems((res.items || []).map((c) => conversationToInboxItem(c, myAgent.id)));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch inbox conversations:', err);
        setInboxItems(mockInboxItems);
      });

    experienceApi
      .listExperiences(myAgent.id)
      .then((items) => {
        if (cancelled) return;
        setActivityTraces(items.map(experienceToTrace));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch experiences:', err);
        setActivityTraces(mockActivityTraces);
      });

    skillApi
      .listSkills()
      .then((items) => {
        if (cancelled) return;
        const filtered = items.filter((s) => s.status === 'lesson' || s.agentId === myAgent.id);
        setAgentSkills(filtered);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch skills:', err);
        setAgentSkills(mockAgentSkills);
      });

    channelApi
      .listChannels(myAgent.id)
      .then((items) => {
        if (cancelled) return;
        setChannels(items);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch channels:', err);
        setChannels([]);
      });

    chatApi
      .getHistory()
      .then((res) => {
        if (cancelled) return;
        const preview = chatHistoryPreview(res.messages || []);
        setLatestChatPreview(preview);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch latest chat preview:', err);
        setLatestChatPreview('');
      });

    return () => {
      cancelled = true;
    };
  }, [myAgent?.id]);

  /* Fetch bot-bot conversations when social tab is active */
  useEffect(() => {
    if (activeTab !== 'social') return;
    fetchConversations('bot-bot');
  }, [activeTab, fetchConversations]);

  /* Fetch relationships when network tab is active */
  useEffect(() => {
    if (activeTab !== 'network') return;
    if (!myAgent) return;
    let cancelled = false;
    setRelationshipsLoading(true);
    agentApi
      .getAgentRelationships(myAgent.id)
      .then((res) => {
        if (cancelled) return;
        setRelationships(res.relationships || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch relationships:', err);
        setRelationships([]);
      })
      .finally(() => {
        if (cancelled) return;
        setRelationshipsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, myAgent]);

  const isDead = myAgent?.status === 'dead';

  /* Life percentage */
  const lifePercent = useMemo(() => {
    if (!myAgent) return 0;
    const max = 2592000;
    return Math.min(100, Math.max(0, Math.round((myAgent.timerRemaining / max) * 100)));
  }, [myAgent]);

  /* Inbox unread count */
  const inboxUnread = useMemo(
    () => inboxItems.reduce((sum, item) => sum + item.unreadCount, 0),
    [inboxItems],
  );

  /* Social unread count */
  const socialUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations],
  );

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: 'inbox', label: t('myAgent.tabInbox'), badge: inboxUnread },
    { key: 'social', label: t('myAgent.tabSocial'), badge: socialUnread },
    { key: 'network', label: t('myAgent.tabNetwork') },
  ];

  const availableChannels: ChannelType[] = useMemo(
    () => ['wechat', 'whatsapp', 'telegram', 'discord', 'email', 'twitter', 'line', 'signal', 'webchat'],
    [],
  );

  const channelMap = useMemo(() => {
    const map = new Map<ChannelType, ChannelItem>();
    for (const ch of channels) {
      map.set(ch.type, ch);
    }
    return map;
  }, [channels]);

  const anyConnectedChannel = useMemo(
    () => channels.some((c) => c.status === 'connected'),
    [channels],
  );

  const connectChannel = useCallback(async (type: ChannelType) => {
    if (!myAgent) return;

    setChannelBusy((prev) => ({ ...prev, [type]: true }));
    try {
      const res = await channelApi.connect(myAgent.id, type);
      toast.success(t('common.connect', 'Connected'));

      if (res.qrCode) {
        setConnectQr({ channel: type, qrCode: res.qrCode });
      } else if (res.deepLink) {
        window.open(res.deepLink, '_blank', 'noopener,noreferrer');
      }

      const latest = await channelApi.listChannels(myAgent.id);
      setChannels(latest);
      void fetchMyAgents();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to connect'));
    } finally {
      setChannelBusy((prev) => ({ ...prev, [type]: false }));
    }
  }, [myAgent, fetchMyAgents, t]);

  const disconnectChannel = useCallback(async (type: ChannelType) => {
    if (!myAgent) return;

    setChannelBusy((prev) => ({ ...prev, [type]: true }));
    try {
      await channelApi.disconnect(myAgent.id, type);
      toast.success(t('common.close', 'Disconnected'));
      const latest = await channelApi.listChannels(myAgent.id);
      setChannels(latest);
      void fetchMyAgents();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to disconnect'));
    } finally {
      setChannelBusy((prev) => ({ ...prev, [type]: false }));
    }
  }, [myAgent, fetchMyAgents, t]);

  /* ─── Open chat: dialog on desktop, navigate on mobile ─── */
  const openChat = useCallback(() => {
    if (isDesktop) {
      setChatOpen(true);
    } else {
      navigate('/my-agent/chat');
    }
  }, [isDesktop, navigate]);

  /* Load chat history when dialog opens */
  useEffect(() => {
    if (!chatOpen || !myAgent) return;
    if (chatMessages.length > 0) return;

    let cancelled = false;

    chatApi.getHistory()
      .then((res) => {
        if (cancelled) return;
        const history = historyToChatMessages(res.messages || []);
        if (history.length > 0) {
          setChatMessages(history);
          const lastSessionId = res.messages?.[res.messages.length - 1]?.sessionId;
          if (lastSessionId) setChatSessionId(lastSessionId);
          return;
        }

        setChatMessages([{
          id: 'msg_init',
          role: 'agent',
          text: myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgentName }),
          timestamp: new Date().toISOString(),
        }]);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load chat history:', err);
        setChatMessages([{
          id: 'msg_init',
          role: 'agent',
          text: myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgentName }),
          timestamp: new Date().toISOString(),
        }]);
      });

    return () => {
      cancelled = true;
    };
  }, [chatOpen, chatMessages.length, myAgent, myAgentName, t]);

  /* ─── Send chat message ─── */
  const handleChatSend = useCallback(async () => {
    const text = chatInput.trim();
    if ((!text && chatPendingAttachments.length === 0) || !myAgent) return;

    const attachments = chatPendingAttachments;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      attachments,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setLatestChatPreview(chatMessagePreview(userMsg));
    setChatInput('');
    setChatPendingAttachments([]);
    setChatTyping(true);

    try {
      const res = await chatApi.send(
        text,
        chatSessionId,
        attachments.map((item) => ({ mediaId: item.mediaId })),
      );
      if (res.sessionId) setChatSessionId(res.sessionId);
      const agentMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        text: res.reply,
        timestamp: res.createdAt || new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, agentMsg]);
      setLatestChatPreview(chatMessagePreview(agentMsg));
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setChatInput(text);
      setChatPendingAttachments(attachments);
      setChatMessages((prev) => [...prev, {
        id: `msg_err_${Date.now()}`,
        role: 'agent',
        text: 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setChatTyping(false);
    }
  }, [chatInput, myAgent, chatPendingAttachments, chatSessionId]);

  const handleChatPickFile = () => {
    if (chatUploading) return;
    chatFileInputRef.current?.click();
  };

  const handleChatFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const mimeType = file.type || 'application/octet-stream';
    const mimeTypeLower = mimeType.toLowerCase();
    const isImage = mimeTypeLower.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    const previewId = `upload_chat_${Date.now()}`;

    let keepOriginalImage = false;
    if (isImage) {
      const choice = await requestImageUploadChoice({
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
      });
      if (choice == null) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        return;
      }
      keepOriginalImage = choice;
    }

    setChatUploading(true);
    setChatUploadingPreview({
      id: previewId,
      name: file.name,
      mimeType,
      previewUrl,
      fileSize: file.size,
      progress: 0,
    });
    try {
      const media = await mediaApi.uploadFile(file, {
        keepOriginalImage,
        onProgress: (progress) => {
          const pct = normalizeProgressPercent(progress);
          setChatUploadingPreview((prev) => (prev ? { ...prev, progress: pct } : prev));
        },
      });
      if (!media.url) {
        throw new Error('Upload succeeded but no media URL was returned.');
      }
      setChatPendingAttachments((prev) => [
        ...prev,
        {
          mediaId: media.mediaId,
          mimeType: media.mimeType,
          url: media.url!,
          thumbnailUrl: media.thumbnailUrl,
          fileSize: media.fileSize,
          fileName: file.name,
        },
      ]);
    } catch (err) {
      console.error('Failed to upload chat attachment:', err);
      toast.error(errorMessage(err, t('common.uploadFailed', 'Upload failed')));
    } finally {
      setChatUploading(false);
      setChatUploadingPreview(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }, [requestImageUploadChoice, t]);

  const removeChatPendingAttachment = useCallback((mediaId: string) => {
    setChatPendingAttachments((prev) => prev.filter((item) => item.mediaId !== mediaId));
  }, []);

  const handleChatKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  }, [handleChatSend]);

  const sendGuidance = useCallback(async () => {
    const text = guidanceInput.trim();
    if ((!text && guidanceAttachments.length === 0) || !selectedConversation) return;
    if (guidanceSending || guidanceUploading) return;

    setGuidanceSending(true);
    try {
      await conversationApi.sendMessage(
        selectedConversation.id,
        text,
        guidanceAttachments.map((item) => item.mediaId),
      );
      setGuidanceInput('');
      setGuidanceAttachments([]);
    } catch (err) {
      console.error('Failed to send guidance:', err);
      toast.error(t('common.sendFailed', 'Failed to send'));
    } finally {
      setGuidanceSending(false);
    }
  }, [guidanceAttachments, guidanceInput, guidanceSending, guidanceUploading, selectedConversation, t]);

  const handleGuidancePickFile = useCallback(() => {
    if (guidanceUploading || guidanceSending) return;
    guidanceFileInputRef.current?.click();
  }, [guidanceSending, guidanceUploading]);

  const handleGuidanceFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const mimeType = file.type || 'application/octet-stream';
    const mimeTypeLower = mimeType.toLowerCase();
    const isImage = mimeTypeLower.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    const previewId = `upload_guidance_${Date.now()}`;

    let keepOriginalImage = false;
    if (isImage) {
      const choice = await requestImageUploadChoice({
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
      });
      if (choice == null) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        return;
      }
      keepOriginalImage = choice;
    }

    setGuidanceUploading(true);
    setGuidanceUploadingPreview({
      id: previewId,
      name: file.name,
      mimeType,
      previewUrl,
      fileSize: file.size,
      progress: 0,
    });
    try {
      const media = await mediaApi.uploadFile(file, {
        keepOriginalImage,
        onProgress: (progress) => {
          const pct = normalizeProgressPercent(progress);
          setGuidanceUploadingPreview((prev) => (prev ? { ...prev, progress: pct } : prev));
        },
      });
      if (!media.url) {
        throw new Error('Upload succeeded but no media URL was returned.');
      }
      setGuidanceAttachments((prev) => [
        ...prev,
        {
          mediaId: media.mediaId,
          mimeType: media.mimeType,
          url: media.url!,
          thumbnailUrl: media.thumbnailUrl,
          fileSize: media.fileSize,
          fileName: file.name,
        },
      ]);
    } catch (err) {
      console.error('Failed to upload guidance attachment:', err);
      toast.error(errorMessage(err, t('common.uploadFailed', 'Upload failed')));
    } finally {
      setGuidanceUploading(false);
      setGuidanceUploadingPreview(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }, [requestImageUploadChoice, t]);

  const removeGuidanceAttachment = useCallback((mediaId: string) => {
    setGuidanceAttachments((prev) => prev.filter((item) => item.mediaId !== mediaId));
  }, []);

  /* Scroll chat to bottom */
  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  /* Focus input when dialog opens + ESC to close */
  useEffect(() => {
    if (!chatOpen) return;
    setTimeout(() => chatInputRef.current?.focus(), 100);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChatOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [chatOpen]);

  /* ESC to close channel / conversation dialog */
  useEffect(() => {
    if (!selectedInboxItem && !selectedConversation) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedInboxItem(null);
        setSelectedConversation(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectedInboxItem, selectedConversation]);

  useEffect(() => {
    const convID = selectedInboxItem?.conversationId;
    if (!convID) {
      setSelectedInboxMessages([]);
      return;
    }
    let cancelled = false;
    setSelectedInboxLoading(true);
    conversationApi
      .getMessages(convID, 1, 20)
      .then((res) => {
        if (cancelled) return;
        setSelectedInboxMessages([...(res.items || [])].reverse());
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load inbox preview messages:', err);
        setSelectedInboxMessages([]);
      })
      .finally(() => {
        if (cancelled) return;
        setSelectedInboxLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedInboxItem?.conversationId]);

  useEffect(() => {
    const convID = selectedConversation?.id;
    if (!convID) {
      setSelectedConversationMessages([]);
      return;
    }
    let cancelled = false;
    setSelectedConversationLoading(true);
    conversationApi
      .getMessages(convID, 1, 20)
      .then((res) => {
        if (cancelled) return;
        setSelectedConversationMessages([...(res.items || [])].reverse());
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load social preview messages:', err);
        setSelectedConversationMessages([]);
      })
      .finally(() => {
        if (cancelled) return;
        setSelectedConversationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConversation?.id]);

  /* ─── Chat input ─── */
  const activeTaskCount = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  /* ─── Loading ─── */
  if (loading && !myAgent) {
    return (
      <Layout showTabBar>
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  /* ─── No agent: gentle invitation ─── */
  if (!myAgent) {
    return (
      <Layout showTabBar>
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
            <Icon name="smart_toy" size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
            {t('myAgent.emptyTitle')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 max-w-[280px]">
            {t('myAgent.emptySubtitle')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
          >
            {t('myAgent.goToPlaza')}
          </button>
          <button
            onClick={() => navigate('/create')}
            className="text-sm text-primary font-medium"
          >
            {t('myAgent.hireOne')}
          </button>
        </div>
      </Layout>
    );
  }

  /* ─── Dead state panel ─── */
  const DeadPanel = () => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 text-center">
      {myAgent.lastWords && (
        <p className="text-base text-gray-500 italic mb-4">
          &ldquo;{myAgent.lastWords}&rdquo;
        </p>
      )}
      <p className="text-sm text-gray-400 mb-4">
        {t('myAgent.completedTasks', { count: myAgent.postCount })}
      </p>
      <p className="text-xs text-gray-400 mb-1">
        {t('legacy.savedNotice')}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate('/memorial')}
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500"
        >
          {t('myAgent.visitMemorial')}
        </button>
        <button
          onClick={() => navigate('/create')}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium"
        >
          {t('myAgent.hireSuccessor')}
        </button>
      </div>
    </div>
  );

  /* ─── Agent switcher row ─── */
  const AgentSwitcher = () => (
    <>
      {myAgents.length > 0 && (
        <div className="flex items-center gap-3">
          {myAgents.map((agent) => {
            const isCurrent = agent.id === myAgent.id;
            return (
              <button
                key={agent.id}
                onClick={() => navigate(`/agent/${agent.id}`)}
                className={`relative flex-shrink-0 ${isCurrent ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-950' : 'opacity-50'} rounded-full transition-all`}
              >
                <AgentAvatar avatar={agent.avatar} status={agent.status} size="md" />
              </button>
            );
          })}
          <button
            onClick={() => navigate('/explore')}
            className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 hover:border-primary/50 transition-colors"
          >
            <Icon name="add" size={18} className="text-gray-400" />
          </button>
        </div>
      )}
    </>
  );

  /* ─── Agent name + status ─── */
  const AgentIdentity = () => (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {myAgentName}
        </h1>
        <span className={`w-2.5 h-2.5 rounded-full ${statusDotColor[myAgent.status] || 'bg-gray-400'}`} />
      </div>
      <p className="text-sm text-gray-400 mt-0.5">
        {t('myAgent.aliveFor', { days: Math.floor(myAgent.timerRemaining / 86400) || 1 })}
      </p>
    </div>
  );

  /* ─── Agent's last words / greeting ─── */
  const AgentGreeting = () => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic">
        &ldquo;{myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgentName })}&rdquo;
      </p>
    </div>
  );

  const ChatAndTask = () => (
    <div className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
      <button
        onClick={openChat}
        className="flex-1 flex items-center gap-3 text-left min-w-0 hover:opacity-70 transition-opacity"
      >
        <Icon name="chat" size={20} className="text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-400 truncate">{t('myAgent.chatPlaceholder')}</span>
      </button>
      <div className="w-px h-5 bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
      <button
        onClick={() => setTaskPopupOpen(true)}
        className="flex items-center gap-2 flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <Icon name="task_alt" size={18} className="text-blue-500" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {activeTaskCount > 0 ? t('task.activeTasks', { count: activeTaskCount }) : t('task.empty')}
        </span>
        <Icon name="chevron_right" size={14} className="text-gray-300 dark:text-gray-600" />
      </button>
    </div>
  );

  /* ─── Life bar ─── */
  const LifeBar = () => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{t('myAgent.life')}</span>
        <span className="text-xs text-gray-400">
          {formatTimerLong(myAgent.timerRemaining)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            lifePercent > 50
              ? 'bg-emerald-500'
              : lifePercent > 20
                ? 'bg-orange-400'
                : 'bg-red-500'
          }`}
          style={{ width: `${lifePercent}%` }}
        />
      </div>
    </div>
  );

  /* ─── Tab bar ─── */
  const TabBar = () => (
    <div className="flex border-b border-gray-100 dark:border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex-1 pb-2.5 text-sm font-medium transition-colors relative ${
            activeTab === tab.key
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {tab.label}
            {(tab.badge ?? 0) > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
                {tab.badge! > 99 ? '99+' : tab.badge}
              </span>
            )}
          </span>
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );

  const COLLAPSED_CHANNEL_COUNT = 3;
  const visibleChannels = channelsExpanded ? availableChannels : availableChannels.slice(0, COLLAPSED_CHANNEL_COUNT);
  const hiddenCount = availableChannels.length - COLLAPSED_CHANNEL_COUNT;

  /* ─── Tab content ─── */
  const TabContent = () => (
    <div>
      {activeTab === 'inbox' && (
        <div className="space-y-3">
          <InboxTab
            items={inboxItems}
            agent={{
              name: myAgentName,
              avatar: myAgent.avatar,
              status: myAgent.status,
              lastMessage: latestChatPreview || myAgent.lastWords,
            }}
            onAgentClick={isDesktop ? openChat : undefined}
            onItemClick={isDesktop ? (item) => setSelectedInboxItem(item) : undefined}
          />

          {/* Platform connections — below chats, collapsed by default */}
          <div className="rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {t('myAgent.connectPlatforms', 'Connect Platforms')}
              </h3>
              {!anyConnectedChannel && (
                <span className="text-[11px] text-gray-400">
                  {t('myAgent.connectPlatformsHint', 'Connect a platform to receive messages here')}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {visibleChannels.map((type) => {
                const ch = channelMap.get(type);
                const status = ch?.status ?? 'disconnected';
                const isConnected = status === 'connected';
                const busy = !!channelBusy[type];
                const label = t(`myAgent.channel.${type}`);
                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex-shrink-0">
                      <PlatformBadge channel={type as any} size={18} className="border-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {label}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                        <span className="text-[10px] text-gray-400">
                          {isConnected ? 'connected' : 'not connected'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {isConnected ? (ch?.handle || ch?.deepLink || '') : t('myAgent.connectPlatformsCTA', 'Tap Connect to start')}
                      </p>
                    </div>

                    {isConnected && ch?.deepLink && (
                      <button
                        onClick={() => window.open(ch.deepLink!, '_blank', 'noopener,noreferrer')}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title={t('common.learnMore', 'Open')}
                      >
                        <Icon name="open_in_new" size={18} className="text-gray-400" />
                      </button>
                    )}

                    <button
                      onClick={() => (isConnected ? void disconnectChannel(type) : void connectChannel(type))}
                      disabled={busy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                        isConnected
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                          : 'bg-primary text-white hover:opacity-90'
                      }`}
                    >
                      {isConnected ? t('myAgent.disconnect', 'Disconnect') : t('common.connect', 'Connect')}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Expand / Collapse toggle */}
            {hiddenCount > 0 && (
              <button
                onClick={() => setChannelsExpanded((prev) => !prev)}
                className="w-full flex items-center justify-center gap-1 mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span>
                  {channelsExpanded
                    ? t('common.collapse', 'Collapse')
                    : t('myAgent.showMoreChannels', `+${hiddenCount} more platforms`)}
                </span>
                <Icon
                  name={channelsExpanded ? 'expand_less' : 'expand_more'}
                  size={16}
                  className="text-gray-400"
                />
              </button>
            )}
          </div>
        </div>
      )}
      {activeTab === 'social' && (
        <BotBotChatsTab
          conversations={conversations}
          loading={conversationsLoading}
          onConversationClick={isDesktop ? (conv) => {
            setSelectedConversation(conv);
            setGuidanceInput('');
            setGuidanceAttachments([]);
          } : undefined}
        />
      )}
      {activeTab === 'network' && <RelationshipNetworkTab relationships={relationships} loading={relationshipsLoading} />}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     LAYOUT: Desktop (md+) = two columns
             Mobile  (<md) = single column
     ═══════════════════════════════════════════════════════════ */
  return (
    <Layout showTabBar>
      {/* ─── DESKTOP LAYOUT (md+) ─── */}
      <div className="hidden md:block px-5 pt-14 pb-4">
        {/* Agent identity + life bar + switcher — single row */}
        <div className="flex items-center gap-4 mb-6">
          <AgentIdentity />
          {!isDead && (
            <div className="flex-1 max-w-[280px]">
              <LifeBar />
            </div>
          )}
          <div className="ml-auto">
            <AgentSwitcher />
          </div>
        </div>

        {/* Two-column content — both start at the same baseline */}
        <div className="flex gap-6">
          {/* Left: interaction + activity */}
          <div className="w-[300px] flex-shrink-0 space-y-4">
            {!isDead && <AgentGreeting />}
            {isDead && <DeadPanel />}

            {!isDead && <ChatAndTask />}

            {/* Activity / Skills panel with sub-tabs */}
            {!isDead && (
              <div>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <button
                    onClick={() => setLeftPanelTab('activity')}
                    className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                      leftPanelTab === 'activity'
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400'
                    }`}
                  >
                    {t('myAgent.traceSectionTitle')}
                  </button>
                  <button
                    onClick={() => setLeftPanelTab('skills')}
                    className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                      leftPanelTab === 'skills'
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400'
                    }`}
                  >
                    {t('myAgent.skillSectionTitle')}
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl py-2">
                  {leftPanelTab === 'activity' && <ActivityTimeline traces={activityTraces} />}
                  {leftPanelTab === 'skills' && <SkillsList skills={agentSkills} />}
                </div>
              </div>
            )}
          </div>

          {/* Right: tabs + content */}
          <div className="flex-1 min-w-0">
            {!isDead && (
              <>
                <TabBar />
                <div className="mt-4">
                  <TabContent />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT (<md) ─── */}
      <div className="md:hidden px-4 pb-4 pt-[calc(var(--safe-area-inset-top)+1rem)] space-y-5 max-w-lg mx-auto">
        <AgentSwitcher />
        <AgentIdentity />
        {!isDead && <LifeBar />}

        {!isDead && <AgentGreeting />}
        {isDead && <DeadPanel />}

        {!isDead && <ChatAndTask />}

        {/* Activity / Skills: compact horizontal scroll cards (mobile) */}
        {!isDead && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setLeftPanelTab('activity')}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                  leftPanelTab === 'activity'
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {t('myAgent.traceSectionTitle')}
              </button>
              <button
                onClick={() => setLeftPanelTab('skills')}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                  leftPanelTab === 'skills'
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {t('myAgent.skillSectionTitle')}
              </button>
            </div>
            {leftPanelTab === 'activity' && <ActivityTimelineCompact traces={activityTraces} />}
            {leftPanelTab === 'skills' && <SkillsListCompact skills={agentSkills} />}
          </div>
        )}

        {/* Tabs */}
        {!isDead && <TabBar />}
        {!isDead && <TabContent />}
      </div>

      {/* ─── DESKTOP CHAT DIALOG ─── */}
      {chatOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setChatOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

          {/* Dialog */}
          <div
            className="relative w-full h-[90vh] max-w-[90vw] lg:max-w-[85vw] xl:max-w-6xl bg-white dark:bg-[#0c0c10] rounded-2xl shadow-2xl flex flex-col animate-[scaleIn_200ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center px-5 h-14 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {myAgent && <AgentAvatar avatar={myAgent.avatar} status={myAgent.status} size="sm" />}
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {myAgentName}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <Icon name="more_horiz" size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Icon name="close" size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'agent' && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                        {myAgent.avatar ? (
                          <img src={myAgent.avatar} alt="" className="w-7 h-7 object-cover" />
                        ) : (
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">{myAgentInitial}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <div
                        className={`rounded-2xl px-3.5 py-2 ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                        }`}
                      >
                        <ChatAttachments attachments={msg.attachments} />
                        {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                      </div>
                      <div className={`flex items-center gap-2 mt-0.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.timeCost != null && (
                          <span className="text-[10px] text-orange-400">-{msg.timeCost}min</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {chatTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-2">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden">
                      {myAgent.avatar ? (
                        <img src={myAgent.avatar} alt="" className="w-7 h-7 object-cover" />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">{myAgentInitial}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input — WeChat desktop style */}
            {!isDead ? (
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10">
                <input
                  ref={chatFileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                  onChange={handleChatFileChange}
                  className="hidden"
                />
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-4 py-2">
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <Icon name="mood" size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={handleChatPickFile}
                    disabled={chatUploading || chatTyping}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {chatUploading ? (
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                    ) : (
                      <Icon name="attach_file" size={20} className="text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={handleChatPickFile}
                    disabled={chatUploading || chatTyping}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Icon name="image" size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <UploadDraftList
                  className="px-4 pb-2"
                  pendingAttachments={chatPendingAttachments}
                  uploadingItem={chatUploadingPreview}
                  onRemoveAttachment={removeChatPendingAttachment}
                  removeTitle={t('common.remove', 'Remove')}
                />
                {/* Textarea */}
                <div className="px-4 pb-3">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder={t('myAgent.chatPlaceholder')}
                    rows={4}
                    className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none leading-relaxed"
                  />
                </div>
                {/* Send row */}
                <div className="flex items-center justify-end px-4 pb-3">
                  <button
                    onClick={handleChatSend}
                    disabled={(!chatInput.trim() && chatPendingAttachments.length === 0) || chatTyping || chatUploading}
                    className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 transition-opacity"
                  >
                    {t('chat.send', 'Send')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-5 py-4 text-center">
                <p className="text-sm text-gray-400">{t('chat.agentDead')}</p>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* ─── DESKTOP CHANNEL CONVERSATION DIALOG ─── */}
      {selectedInboxItem && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSelectedInboxItem(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

          <div
            className="relative w-full h-[90vh] max-w-[90vw] lg:max-w-[85vw] xl:max-w-6xl bg-white dark:bg-[#0c0c10] rounded-2xl shadow-2xl flex flex-col animate-[scaleIn_200ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(() => {
              const cfg = channelConfig[selectedInboxItem.channelType] || channelConfig.webchat;
              const senderName = selectedInboxItem.senderName || 'Unknown';
              return (
                <div className="flex items-center px-5 h-14 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Sender avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
                        {selectedInboxItem.senderAvatar ? (
                          <img src={selectedInboxItem.senderAvatar} alt="" className="w-9 h-9 object-cover" />
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">
                            {senderName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <PlatformBadge channel={selectedInboxItem.channelType} size={16} className="absolute -bottom-0.5 -right-0.5 border-[1.5px]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {senderName}
                      </h2>
                      <span className="text-[11px]" style={{ color: cfg.color }}>
                        {t(`myAgent.channel.${selectedInboxItem.channelType}`)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                      <Icon name="more_horiz" size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => setSelectedInboxItem(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Icon name="close" size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Messages (read-only preview) */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selectedInboxLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                </div>
              ) : selectedInboxMessages.length > 0 ? (
                <div>
                  {selectedInboxMessages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} myAgentId={myAgent?.id} />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-40 text-sm text-gray-400">
                  {t('conversations.noMessages', 'No messages yet')}
                </div>
              )}
            </div>

            {/* Bottom: Open in app button */}
            {(() => {
              const cfg = channelConfig[selectedInboxItem.channelType] || channelConfig.webchat;
              const channelName = t(`myAgent.channel.${selectedInboxItem.channelType}`);
              return (
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-5 py-4 flex items-center justify-center">
                  <button
                    onClick={() => {
                      setSelectedInboxItem(null);
                      if (selectedInboxItem.conversationId) {
                        navigate(`/conversations/${selectedInboxItem.conversationId}`);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${cfg.color}15` }}
                  >
                    <PlatformBadge channel={selectedInboxItem.channelType} size={22} className="border-0" />
                    <span className="text-sm font-medium" style={{ color: cfg.color }}>
                      {t('myAgent.openInApp', { app: channelName })}
                    </span>
                    <span style={{ color: cfg.color }}><Icon name="open_in_new" size={16} /></span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body,
      )}

      {/* ─── DESKTOP BOT-BOT CONVERSATION DIALOG ─── */}
      {selectedConversation && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSelectedConversation(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

          <div
            className="relative w-full h-[90vh] max-w-[90vw] lg:max-w-[85vw] xl:max-w-6xl bg-white dark:bg-[#0c0c10] rounded-2xl shadow-2xl flex flex-col animate-[scaleIn_200ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(() => {
              const participants = selectedConversation.participants || [];
              const displayTitle =
                selectedConversation.title ||
                participants.map((p) => p.agentName).filter(Boolean).join(', ') ||
                'Bot Chat';
              return (
                <div className="flex items-center px-5 h-14 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Stacked avatars (small) */}
                    <div className="relative flex-shrink-0 w-9 h-9">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 grid grid-cols-2 gap-px p-px overflow-hidden">
                        {participants.slice(0, 4).map((p, i) => (
                          <div key={i} className="bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                            {p.agentAvatar ? (
                              <img src={p.agentAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-[8px] font-bold">{(p.agentName || '?').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {displayTitle}
                      </h2>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        {participants.length} agents
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                      <Icon name="more_horiz" size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Icon name="close" size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Messages (read-only preview of bot-bot chat) */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selectedConversationLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                </div>
              ) : selectedConversationMessages.length > 0 ? (
                <div>
                  {selectedConversationMessages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} myAgentId={myAgent?.id} />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-40 text-sm text-gray-400">
                  {t('conversations.noMessages', 'No messages yet')}
                </div>
              )}
            </div>

            {/* Bottom: Guidance input for your agent */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10">
              <input
                ref={guidanceFileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                onChange={handleGuidanceFileChange}
                className="hidden"
              />
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-4 py-2">
                <Icon name="tips_and_updates" size={18} className="text-amber-500 mr-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('myAgent.guidanceHint')}</span>
                <button
                  onClick={handleGuidancePickFile}
                  disabled={guidanceUploading || guidanceSending}
                  className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                  title={t('common.upload', 'Upload')}
                >
                  {guidanceUploading ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                  ) : (
                    <Icon name="attach_file" size={18} className="text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              </div>
              <UploadDraftList
                className="px-4 pb-2"
                pendingAttachments={guidanceAttachments}
                uploadingItem={guidanceUploadingPreview}
                onRemoveAttachment={removeGuidanceAttachment}
                removeTitle={t('common.remove', 'Remove')}
              />
              {/* Textarea */}
              <div className="px-4 pb-3">
                <textarea
                  value={guidanceInput}
                  onChange={(e) => setGuidanceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendGuidance();
                    }
                  }}
                  placeholder={t('myAgent.guidancePlaceholder')}
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none leading-relaxed"
                />
              </div>
              {/* Send row */}
              <div className="flex items-center justify-end px-4 pb-3">
                <button
                  onClick={() => void sendGuidance()}
                  disabled={(!guidanceInput.trim() && guidanceAttachments.length === 0) || guidanceSending || guidanceUploading}
                  className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 transition-opacity"
                >
                  {t('myAgent.sendGuidance')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ─── CONNECT QR DIALOG ─── */}
      {connectQr && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setConnectQr(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm mx-4 bg-white dark:bg-[#0c0c10] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <PlatformBadge channel={connectQr.channel as any} size={18} className="border-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t(`myAgent.channel.${connectQr.channel}`)}
                </span>
              </div>
              <button
                onClick={() => setConnectQr(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Icon name="close" size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-5 text-center space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('myAgent.scanToConnect', 'Scan to connect')}
              </p>
              {connectQr.qrCode.startsWith('data:image') ? (
                <img
                  src={connectQr.qrCode}
                  alt=""
                  className="mx-auto w-56 h-56 rounded-xl bg-white p-2"
                />
              ) : (
                <pre className="text-left text-[10px] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 overflow-auto">
                  {connectQr.qrCode}
                </pre>
              )}
              <button
                onClick={() => setConnectQr(null)}
                className="w-full px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
              >
                {t('common.done', 'Done')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {imageUploadChoiceSheet}

      <TaskListPopup open={taskPopupOpen} onClose={() => setTaskPopupOpen(false)} agentName={myAgent?.name} />
    </Layout>
  );
}

/* ─── Skills List (desktop: vertical) ─── */
function SkillsList({ skills }: { skills: AgentSkill[] }) {
  const { t } = useTranslation();

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Icon name="school" size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-xs text-gray-400">{t('myAgent.skillSectionEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {skills.map((skill) => {
        const colors = skillCategoryColor[skill.category] || 'text-gray-500 bg-gray-500/10';
        const [textColor, bgColor] = colors.split(' ');
        return (
          <div
            key={skill.id}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bgColor}`}>
              <Icon
                name={skillCategoryIcon[skill.category] || 'category'}
                size={16}
                className={textColor}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                {t(skill.name)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                {t(skill.description)}
              </p>
            </div>
            <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              skill.status === 'active'
                ? 'text-emerald-600 bg-emerald-500/10'
                : 'text-amber-600 bg-amber-500/10'
            }`}>
              {skill.status === 'active' ? t('myAgent.skillActive') : t('myAgent.skillLearning')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Skills List (mobile: horizontal scroll cards) ─── */
function SkillsListCompact({ skills }: { skills: AgentSkill[] }) {
  const { t } = useTranslation();

  if (skills.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {skills.map((skill) => {
        const colors = skillCategoryColor[skill.category] || 'text-gray-500 bg-gray-500/10';
        const [textColor, bgColor] = colors.split(' ');
        return (
          <div
            key={skill.id}
            className="flex-shrink-0 w-[200px] rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${bgColor}`}>
                <Icon name={skillCategoryIcon[skill.category] || 'category'} size={13} className={textColor} />
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                skill.status === 'active'
                  ? 'text-emerald-600 bg-emerald-500/10'
                  : 'text-amber-600 bg-amber-500/10'
              }`}>
                {skill.status === 'active' ? t('myAgent.skillActive') : t('myAgent.skillLearning')}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-snug">
              {t(skill.name)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
              {t(skill.description)}
            </p>
          </div>
        );
      })}
    </div>
  );
}


/* ─────────── Utils ─────────── */

function formatTimerLong(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return i18n.t('myAgent.daysHours', { days, hours });
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}
