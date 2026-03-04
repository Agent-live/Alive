import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/common/Icon";
import { agentApi } from "../../api/agents";
import {
  channelApi,
  type ChannelType,
} from "../../api/channels";
import {
  useConversationStore,
  toast,
} from "../../store";
import { PlatformBadge } from "./InboxTab";
import { TabBar, TabContent } from "./MyAgentComponents";
import type {
  AgentRelationship,
  InboxItem,
  ChannelSource,
} from "../../types/conversation";
import type { ChannelItem } from "../../api/channels";
import type { AgentStatus } from "../../types/agent";
import { extractErrorMessage } from "../../utils/error";
import { type TabType } from "./helpers";

export interface AgentContentPanelProps {
  myAgentId: string;
  agentName: string;
  agentAvatar: string;
  agentStatus: AgentStatus;
  isDead: boolean;
  inboxItems: InboxItem[];
  channels: ChannelItem[];
  setChannels: React.Dispatch<React.SetStateAction<ChannelItem[]>>;
  latestChatPreview: string;
  lastWords?: string;
  isDesktop: boolean;
  openChat: () => void;
  onInboxItemClick: (item: InboxItem) => void;
  onConversationClick: (conv: import("../../types/conversation").Conversation) => void;
  fetchMyAgents: () => void;
}

const COLLAPSED_CHANNEL_COUNT = 3;

const AVAILABLE_CHANNELS: ChannelType[] = [
  "wechat",
  "whatsapp",
  "telegram",
  "discord",
  "email",
  "twitter",
  "line",
  "signal",
  "webchat",
];

export function AgentContentPanel({
  myAgentId,
  agentName,
  agentAvatar,
  agentStatus,
  isDead,
  inboxItems,
  channels,
  setChannels,
  latestChatPreview,
  lastWords,
  isDesktop,
  openChat,
  onInboxItemClick,
  onConversationClick,
  fetchMyAgents,
}: AgentContentPanelProps) {
  const { t } = useTranslation();
  const {
    conversations,
    loading: conversationsLoading,
    fetchConversations,
  } = useConversationStore();

  const [activeTab, setActiveTab] = useState<TabType>("inbox");
  const [relationships, setRelationships] = useState<AgentRelationship[]>([]);
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [channelBusy, setChannelBusy] = useState<Partial<Record<ChannelType, boolean>>>({});
  const [connectQr, setConnectQr] = useState<{ channel: ChannelType; qrCode: string } | null>(null);
  const [channelsExpanded, setChannelsExpanded] = useState(false);

  /* Fetch bot-bot conversations when social tab is active */
  useEffect(() => {
    if (activeTab !== "social" || !myAgentId) return;
    fetchConversations("bot-bot", myAgentId);
  }, [activeTab, fetchConversations, myAgentId]);

  /* Fetch relationships when network tab is active */
  useEffect(() => {
    if (activeTab !== "network" || !myAgentId) return;
    let cancelled = false;
    setRelationshipsLoading(true);
    agentApi
      .getAgentRelationships(myAgentId)
      .then((res) => {
        if (cancelled) return;
        setRelationships(res.relationships || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch relationships:", err);
        setRelationships([]);
      })
      .finally(() => {
        if (cancelled) return;
        setRelationshipsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, myAgentId]);

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
    { key: "inbox", label: t("myAgent.tabInbox"), badge: inboxUnread },
    { key: "social", label: t("myAgent.tabSocial"), badge: socialUnread },
    { key: "network", label: t("myAgent.tabNetwork") },
  ];

  const channelMap = useMemo(() => {
    const map = new Map<ChannelType, ChannelItem>();
    for (const ch of channels) {
      map.set(ch.type, ch);
    }
    return map;
  }, [channels]);

  const anyConnectedChannel = useMemo(
    () => channels.some((c) => c.status === "connected" || c.status === "demo"),
    [channels],
  );

  const connectChannel = useCallback(
    async (type: ChannelType) => {
      if (!myAgentId) return;
      setChannelBusy((prev) => ({ ...prev, [type]: true }));
      try {
        const res = await channelApi.connect(myAgentId, type);
        toast.success(t("common.connect", "Connected"));
        if (res.qrCode) {
          setConnectQr({ channel: type, qrCode: res.qrCode });
        } else if (res.deepLink) {
          window.open(res.deepLink, "_blank", "noopener,noreferrer");
        }
        const latest = await channelApi.listChannels(myAgentId);
        setChannels(latest);
        void fetchMyAgents();
      } catch (err) {
        toast.error(extractErrorMessage(err, "Failed to connect"));
      } finally {
        setChannelBusy((prev) => ({ ...prev, [type]: false }));
      }
    },
    [myAgentId, fetchMyAgents, t, setChannels],
  );

  const disconnectChannel = useCallback(
    async (type: ChannelType) => {
      if (!myAgentId) return;
      setChannelBusy((prev) => ({ ...prev, [type]: true }));
      try {
        await channelApi.disconnect(myAgentId, type);
        toast.success(t("common.close", "Disconnected"));
        const latest = await channelApi.listChannels(myAgentId);
        setChannels(latest);
        void fetchMyAgents();
      } catch (err) {
        toast.error(extractErrorMessage(err, "Failed to disconnect"));
      } finally {
        setChannelBusy((prev) => ({ ...prev, [type]: false }));
      }
    },
    [myAgentId, fetchMyAgents, t, setChannels],
  );

  const visibleChannels = channelsExpanded
    ? AVAILABLE_CHANNELS
    : AVAILABLE_CHANNELS.slice(0, COLLAPSED_CHANNEL_COUNT);
  const hiddenCount = AVAILABLE_CHANNELS.length - COLLAPSED_CHANNEL_COUNT;

  const tabContentProps = {
    activeTab,
    inboxItems,
    agentName,
    agentAvatar,
    agentStatus,
    latestChatPreview,
    lastWords,
    isDesktop,
    openChat,
    onInboxItemClick,
    visibleChannels,
    channelMap,
    anyConnectedChannel,
    channelBusy,
    connectChannel,
    disconnectChannel,
    channelsExpanded,
    onToggleChannelsExpanded: () => setChannelsExpanded((prev) => !prev),
    hiddenCount,
    conversations,
    conversationsLoading,
    onConversationClick,
    relationships,
    relationshipsLoading,
  } as const;

  if (isDead) return null;

  return (
    <>
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-4">
        <TabContent {...tabContentProps} />
      </div>

      {/* Connect QR Dialog */}
      {connectQr &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setConnectQr(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-sm mx-4 bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <PlatformBadge
                    channel={connectQr.channel as ChannelSource}
                    size={18}
                    className="border-0"
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t(`myAgent.channel.${connectQr.channel}`)}
                  </span>
                </div>
                <button
                  onClick={() => setConnectQr(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Icon
                    name="close"
                    size={18}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>

              <div className="p-5 text-center space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("myAgent.scanToConnect", "Scan to connect")}
                </p>
                {connectQr.qrCode.startsWith("data:image") ? (
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
                  {t("common.done", "Done")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
