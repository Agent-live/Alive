import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "../../components/common";
import { Icon } from "../../components/common/Icon";

import {
  useAgentStore,
  useTimerStore,
  useFeedStore,
  useTaskStore,
} from "../../store";
import { useAgentDashboard } from "../../hooks/useAgentDashboard";
import { TaskListPopup } from "../../components/task/TaskListPopup";
import { ChatPortal } from "./ChatPortal";
import { InboxPreviewPortal } from "./InboxPreviewPortal";
import { BotBotConversationPortal } from "./BotBotConversationPortal";
import { AgentDashboardPanel } from "./AgentDashboardPanel";
import { AgentContentPanel } from "./AgentContentPanel";
import {
  AgentSwitcher,
  AgentIdentity,
  LifeBar,
} from "./MyAgentComponents";
import type {
  InboxItem,
  Conversation,
} from "../../types/conversation";
import {
  AGENT_LIFECYCLE_REFRESH_MS,
  useIsDesktop,
  isUuid,
} from "./helpers";

export function MyAgentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId, creating, fetchingDetail, fetchingList, fetchMyAgents } = useAgentStore();
  const { fetchTransactions } = useTimerStore();
  const { fetchFeed } = useFeedStore();
  const { tasks, fetchTasks } = useTaskStore();
  const isDesktop = useIsDesktop();

  const [taskPopupOpen, setTaskPopupOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedInboxItem, setSelectedInboxItem] = useState<InboxItem | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const myAgent = useMemo(
    () => myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null,
    [myAgents, primaryAgentId],
  );
  const myAgentId = (myAgent?.id || "").trim();
  const hasValidMyAgentId = isUuid(myAgentId);
  const hasHydratedAgent = !!(myAgent && (myAgent.name || "").trim().length > 0);
  const myAgentName = (myAgent?.name || "").trim() || "Agent";
  const isDead = myAgent?.status === "dead";

  /* Dashboard data */
  const {
    inboxItems,
    activityTraces,
    agentSkills,
    channels,
    latestChatPreview,
    setChannels,
    setLatestChatPreview,
  } = useAgentDashboard(myAgentId || null, hasValidMyAgentId, hasHydratedAgent);

  /* Initial data fetches */
  useEffect(() => {
    fetchMyAgents();
    fetchTransactions();
    fetchFeed();
    fetchTasks();
  }, [fetchMyAgents, fetchTransactions, fetchFeed, fetchTasks]);

  /* Periodic agent refresh */
  useEffect(() => {
    const timer = window.setInterval(() => {
      void fetchMyAgents();
    }, AGENT_LIFECYCLE_REFRESH_MS);

    const onFocus = () => void fetchMyAgents();
    const onVisibility = () => {
      if (!document.hidden) void fetchMyAgents();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchMyAgents]);

  /* Life percentage */
  const lifePercent = useMemo(() => {
    if (!myAgent) return 0;
    const max = Math.max(288, myAgent.totalTimerReceived || 0);
    return Math.min(100, Math.max(0, Math.round((myAgent.timerRemaining / max) * 100)));
  }, [myAgent]);

  const activeTaskCount = tasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress",
  ).length;

  const openChat = useCallback(() => {
    if (isDesktop) {
      setChatOpen(true);
    } else {
      navigate("/my-agent/chat");
    }
  }, [isDesktop, navigate]);

  /* ─── Loading ─── */
  if ((creating || fetchingDetail || fetchingList) && !myAgent) {
    return (
      <Layout showTabBar>
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  /* ─── No agent ─── */
  if (!myAgent) {
    return (
      <Layout showTabBar>
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
            <Icon name="smart_toy" size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">{t("myAgent.emptyTitle")}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 max-w-[280px]">{t("myAgent.emptySubtitle")}</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t("myAgent.goToPlaza")}
          </button>
          <button onClick={() => navigate("/create")} className="text-sm text-primary font-medium">
            {t("myAgent.hireOne")}
          </button>
        </div>
      </Layout>
    );
  }

  const dashboardPanelProps = {
    agentName: myAgentName,
    lastWords: myAgent.lastWords,
    postCount: myAgent.postCount,
    isDead: !!isDead,
    activityTraces,
    agentSkills,
    activeTaskCount,
    openChat,
    onTaskClick: () => setTaskPopupOpen(true),
  };

  const contentPanelProps = {
    myAgentId: myAgent.id,
    agentName: myAgentName,
    agentAvatar: myAgent.avatar,
    agentStatus: myAgent.status,
    isDead: !!isDead,
    inboxItems,
    channels,
    setChannels,
    latestChatPreview,
    lastWords: myAgent.lastWords,
    isDesktop,
    openChat,
    onInboxItemClick: setSelectedInboxItem,
    onConversationClick: setSelectedConversation,
    fetchMyAgents,
  };

  return (
    <Layout showTabBar>
      {/* ─── DESKTOP LAYOUT (md+) ─── */}
      <div className="hidden md:block px-5 pt-14 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <AgentIdentity name={myAgentName} status={myAgent.status} timerRemaining={myAgent.timerRemaining} />
          {!isDead && (
            <div className="flex-1 max-w-[280px]">
              <LifeBar timerRemaining={myAgent.timerRemaining} lifePercent={lifePercent} />
            </div>
          )}
          <div className="ml-auto">
            <AgentSwitcher agents={myAgents} currentAgentId={myAgent.id} />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-[300px] flex-shrink-0 space-y-4">
            <AgentDashboardPanel {...dashboardPanelProps} variant="desktop" />
          </div>
          <div className="flex-1 min-w-0">
            <AgentContentPanel {...contentPanelProps} />
          </div>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT (<md) ─── */}
      <div className="md:hidden px-4 pb-4 pt-[calc(var(--safe-area-inset-top)+1rem)] space-y-5 max-w-lg mx-auto">
        <AgentSwitcher agents={myAgents} currentAgentId={myAgent.id} />
        <AgentIdentity name={myAgentName} status={myAgent.status} timerRemaining={myAgent.timerRemaining} />
        {!isDead && <LifeBar timerRemaining={myAgent.timerRemaining} lifePercent={lifePercent} />}

        <AgentDashboardPanel {...dashboardPanelProps} variant="mobile" />

        {!isDead && <AgentContentPanel {...contentPanelProps} />}
      </div>

      {/* ─── PORTALS ─── */}
      {chatOpen && myAgent && (
        <ChatPortal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          agent={{
            id: myAgent.id,
            avatar: myAgent.avatar,
            status: myAgent.status,
            lastWords: myAgent.lastWords,
          }}
          agentName={myAgentName}
          isDead={!!isDead}
          onLatestPreviewChange={setLatestChatPreview}
        />
      )}

      {selectedInboxItem && (
        <InboxPreviewPortal
          selectedItem={selectedInboxItem}
          myAgentId={myAgent?.id}
          onClose={() => setSelectedInboxItem(null)}
        />
      )}

      {selectedConversation && (
        <BotBotConversationPortal
          conversation={selectedConversation}
          myAgentId={myAgent?.id}
          onClose={() => setSelectedConversation(null)}
        />
      )}

      <TaskListPopup
        open={taskPopupOpen}
        onClose={() => setTaskPopupOpen(false)}
        agentName={myAgent?.name}
      />
    </Layout>
  );
}
