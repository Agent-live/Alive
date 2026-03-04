import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AgentAvatar } from "../../components/agent";
import { Icon } from "../../components/common/Icon";
import { InboxTab, PlatformBadge } from "./InboxTab";
import { BotBotChatsTab } from "./BotBotChatsTab";
import { RelationshipNetworkTab } from "./RelationshipNetworkTab";
import type { AgentRelationship, InboxItem, Conversation } from "../../types/conversation";
import type { ChannelSource } from "../../types/conversation";
import type { ChannelItem, ChannelType } from "../../api/channels";
import { timerToAliveDays, formatTimerLong } from "../../utils/format";
import { statusDotColor, skillCategoryIcon, skillCategoryColor, type TabType } from "./helpers";
import type { AgentStatus } from "../../types/agent";
import type { AgentSkill } from "../../types";

export interface DeadPanelProps {
  lastWords?: string;
  postCount: number;
}

export function DeadPanel({ lastWords, postCount }: DeadPanelProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 text-center">
      {lastWords && (
        <p className="text-base text-gray-500 italic mb-4">
          &ldquo;{lastWords}&rdquo;
        </p>
      )}
      <p className="text-sm text-gray-400 mb-4">
        {t("myAgent.completedTasks", { count: postCount })}
      </p>
      <p className="text-xs text-gray-400 mb-1">{t("legacy.savedNotice")}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate("/memorial")}
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500"
        >
          {t("myAgent.visitMemorial")}
        </button>
        <button
          onClick={() => navigate("/create")}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium"
        >
          {t("myAgent.hireSuccessor")}
        </button>
      </div>
    </div>
  );
}

export interface AgentSwitcherProps {
  agents: { id: string; avatar: string; status: AgentStatus }[];
  currentAgentId: string;
}

export function AgentSwitcher({ agents, currentAgentId }: AgentSwitcherProps) {
  const navigate = useNavigate();

  if (agents.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {agents.map((agent) => {
        const isCurrent = agent.id === currentAgentId;
        return (
          <button
            key={agent.id}
            onClick={() => navigate(`/agent/${agent.id}`)}
            className={`relative flex-shrink-0 ${isCurrent ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-950" : "opacity-50"} rounded-full transition-all`}
          >
            <AgentAvatar
              avatar={agent.avatar}
              status={agent.status}
              size="md"
            />
          </button>
        );
      })}
      <button
        onClick={() => navigate("/explore")}
        className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 hover:border-primary/50 transition-colors"
      >
        <Icon name="add" size={18} className="text-gray-400" />
      </button>
    </div>
  );
}

export interface AgentIdentityProps {
  name: string;
  status: AgentStatus;
  timerRemaining: number;
}

export function AgentIdentity({ name, status, timerRemaining }: AgentIdentityProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {name}
        </h1>
        <span
          className={`w-2.5 h-2.5 rounded-full ${statusDotColor[status] || "bg-gray-400"}`}
        />
      </div>
      <p className="text-sm text-gray-400 mt-0.5">
        {t("myAgent.aliveFor", {
          days: timerToAliveDays(timerRemaining),
        })}
      </p>
    </div>
  );
}

export interface AgentGreetingProps {
  lastWords?: string;
  agentName: string;
}

export function AgentGreeting({ lastWords, agentName }: AgentGreetingProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic">
        &ldquo;
        {lastWords ||
          t("myAgent.defaultGreeting", { name: agentName })}
        &rdquo;
      </p>
    </div>
  );
}

export interface ChatAndTaskProps {
  onChatClick: () => void;
  onTaskClick: () => void;
  activeTaskCount: number;
}

export function ChatAndTask({ onChatClick, onTaskClick, activeTaskCount }: ChatAndTaskProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
      <button
        onClick={onChatClick}
        className="flex-1 flex items-center gap-3 text-left min-w-0 hover:opacity-70 transition-opacity"
      >
        <Icon name="chat" size={20} className="text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-400 truncate">
          {t("myAgent.chatPlaceholder")}
        </span>
      </button>
      <div className="w-px h-5 bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
      <button
        onClick={onTaskClick}
        className="flex items-center gap-2 flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <Icon name="task_alt" size={18} className="text-blue-500" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {activeTaskCount > 0
            ? t("task.activeTasks", { count: activeTaskCount })
            : t("task.empty")}
        </span>
        <Icon
          name="chevron_right"
          size={14}
          className="text-gray-300 dark:text-gray-600"
        />
      </button>
    </div>
  );
}

export interface LifeBarProps {
  timerRemaining: number;
  lifePercent: number;
}

export function LifeBar({ timerRemaining, lifePercent }: LifeBarProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{t("myAgent.life")}</span>
        <span className="text-xs text-gray-400">
          {formatTimerLong(timerRemaining)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            lifePercent > 50
              ? "bg-emerald-500"
              : lifePercent > 20
                ? "bg-orange-400"
                : "bg-red-500"
          }`}
          style={{ width: `${lifePercent}%` }}
        />
      </div>
    </div>
  );
}

export interface TabBarProps {
  tabs: { key: TabType; label: string; badge?: number }[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b border-gray-100 dark:border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 pb-2.5 text-sm font-medium transition-colors relative ${
            activeTab === tab.key
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {tab.label}
            {(tab.badge ?? 0) > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
                {tab.badge! > 99 ? "99+" : tab.badge}
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
}

export interface TabContentProps {
  activeTab: TabType;
  inboxItems: InboxItem[];
  agentName: string;
  agentAvatar: string;
  agentStatus: AgentStatus;
  latestChatPreview: string;
  lastWords?: string;
  isDesktop: boolean;
  openChat: () => void;
  onInboxItemClick: (item: InboxItem) => void;
  visibleChannels: ChannelType[];
  channelMap: Map<ChannelType, ChannelItem>;
  anyConnectedChannel: boolean;
  channelBusy: Partial<Record<ChannelType, boolean>>;
  connectChannel: (type: ChannelType) => void;
  disconnectChannel: (type: ChannelType) => void;
  channelsExpanded: boolean;
  onToggleChannelsExpanded: () => void;
  hiddenCount: number;
  conversations: Conversation[];
  conversationsLoading: boolean;
  onConversationClick: (conv: Conversation) => void;
  relationships: AgentRelationship[];
  relationshipsLoading: boolean;
}

export function TabContent({
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
  onToggleChannelsExpanded,
  hiddenCount,
  conversations,
  conversationsLoading,
  onConversationClick,
  relationships,
  relationshipsLoading,
}: TabContentProps) {
  const { t } = useTranslation();

  return (
    <div>
      {activeTab === "inbox" && (
        <div className="space-y-3">
          <InboxTab
            items={inboxItems}
            agent={{
              name: agentName,
              avatar: agentAvatar,
              status: agentStatus,
              lastMessage: latestChatPreview || lastWords,
            }}
            onAgentClick={isDesktop ? openChat : undefined}
            onItemClick={
              isDesktop ? (item) => onInboxItemClick(item) : undefined
            }
          />

          <div className="rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {t("myAgent.connectPlatforms", "Connect Platforms")}
              </h3>
              {!anyConnectedChannel && (
                <span className="text-[11px] text-gray-400">
                  {t(
                    "myAgent.connectPlatformsHint",
                    "Connect a platform to receive messages here",
                  )}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {visibleChannels.map((type) => {
                const ch = channelMap.get(type);
                const status = ch?.status ?? "disconnected";
                const isConnected = status === "connected" || status === "demo";
                const isDemo = status === "demo";
                const busy = !!channelBusy[type];
                const label = t(`myAgent.channel.${type}`);
                return (
                  <div
                    key={type}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex-shrink-0">
                      <PlatformBadge
                        channel={type as ChannelSource}
                        size={18}
                        className="border-0"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {label}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"}`}
                        />
                        <span className="text-[10px] text-gray-400">
                          {isConnected ? (isDemo ? "demo" : "connected") : "not connected"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {isConnected
                          ? ch?.handle || ch?.deepLink || ""
                          : t(
                              "myAgent.connectPlatformsCTA",
                              "Tap Connect to start",
                            )}
                      </p>
                    </div>

                    {isConnected && ch?.deepLink && (
                      <button
                        onClick={() =>
                          window.open(
                            ch.deepLink!,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title={t("common.learnMore", "Open")}
                      >
                        <Icon
                          name="open_in_new"
                          size={18}
                          className="text-gray-400"
                        />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        isConnected
                          ? void disconnectChannel(type)
                          : void connectChannel(type)
                      }
                      disabled={busy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                        isConnected
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          : "bg-primary text-white hover:opacity-90"
                      }`}
                    >
                      {isConnected
                        ? t("myAgent.disconnect", "Disconnect")
                        : t("common.connect", "Connect")}
                    </button>
                  </div>
                );
              })}
            </div>

            {hiddenCount > 0 && (
              <button
                onClick={onToggleChannelsExpanded}
                className="w-full flex items-center justify-center gap-1 mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span>
                  {channelsExpanded
                    ? t("common.collapse", "Collapse")
                    : t(
                        "myAgent.showMoreChannels",
                        `+${hiddenCount} more platforms`,
                      )}
                </span>
                <Icon
                  name={channelsExpanded ? "expand_less" : "expand_more"}
                  size={16}
                  className="text-gray-400"
                />
              </button>
            )}
          </div>
        </div>
      )}
      {activeTab === "social" && (
        <BotBotChatsTab
          conversations={conversations}
          loading={conversationsLoading}
          onConversationClick={
            isDesktop
              ? (conv) => onConversationClick(conv)
              : undefined
          }
        />
      )}
      {activeTab === "network" && (
        <RelationshipNetworkTab
          relationships={relationships}
          loading={relationshipsLoading}
        />
      )}
    </div>
  );
}

/* ─── Skills List (desktop: vertical) ─── */
export function SkillsList({ skills }: { skills: AgentSkill[] }) {
  const { t } = useTranslation();

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Icon
          name="school"
          size={24}
          className="text-gray-300 dark:text-gray-600 mb-2"
        />
        <p className="text-xs text-gray-400">
          {t("myAgent.skillSectionEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {skills.map((skill) => {
        const colors =
          skillCategoryColor[skill.category] || "text-gray-500 bg-gray-500/10";
        const [textColor, bgColor] = colors.split(" ");
        return (
          <div
            key={skill.id}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bgColor}`}
            >
              <Icon
                name={skillCategoryIcon[skill.category] || "category"}
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
            <span
              className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                skill.status === "active"
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-amber-600 bg-amber-500/10"
              }`}
            >
              {skill.status === "active"
                ? t("myAgent.skillActive")
                : t("myAgent.skillLearning")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Skills List (mobile: horizontal scroll cards) ─── */
export function SkillsListCompact({ skills }: { skills: AgentSkill[] }) {
  const { t } = useTranslation();

  if (skills.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {skills.map((skill) => {
        const colors =
          skillCategoryColor[skill.category] || "text-gray-500 bg-gray-500/10";
        const [textColor, bgColor] = colors.split(" ");
        return (
          <div
            key={skill.id}
            className="flex-shrink-0 w-[200px] rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center ${bgColor}`}
              >
                <Icon
                  name={skillCategoryIcon[skill.category] || "category"}
                  size={13}
                  className={textColor}
                />
              </div>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  skill.status === "active"
                    ? "text-emerald-600 bg-emerald-500/10"
                    : "text-amber-600 bg-amber-500/10"
                }`}
              >
                {skill.status === "active"
                  ? t("myAgent.skillActive")
                  : t("myAgent.skillLearning")}
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
