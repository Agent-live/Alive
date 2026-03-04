import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityTimeline, ActivityTimelineCompact } from "./ActivityTimeline";
import {
  DeadPanel,
  AgentGreeting,
  ChatAndTask,
  SkillsList,
  SkillsListCompact,
} from "./MyAgentComponents";
import type { ActivityTrace } from "../../types/conversation";
import type { AgentSkill } from "../../types";
import type { LeftPanelTab } from "./helpers";

export interface AgentDashboardPanelProps {
  agentName: string;
  lastWords?: string;
  postCount: number;
  isDead: boolean;
  activityTraces: ActivityTrace[];
  agentSkills: AgentSkill[];
  activeTaskCount: number;
  openChat: () => void;
  onTaskClick: () => void;
  /** "desktop" renders vertical layout, "mobile" renders horizontal scroll cards */
  variant: "desktop" | "mobile";
}

export function AgentDashboardPanel({
  agentName,
  lastWords,
  postCount,
  isDead,
  activityTraces,
  agentSkills,
  activeTaskCount,
  openChat,
  onTaskClick,
  variant,
}: AgentDashboardPanelProps) {
  const { t } = useTranslation();
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("activity");

  return (
    <>
      {!isDead && <AgentGreeting lastWords={lastWords} agentName={agentName} />}
      {isDead && <DeadPanel lastWords={lastWords} postCount={postCount} />}

      {!isDead && (
        <ChatAndTask
          onChatClick={openChat}
          onTaskClick={onTaskClick}
          activeTaskCount={activeTaskCount}
        />
      )}

      {/* Activity / Skills panel with sub-tabs */}
      {!isDead && (
        <div>
          <div className={`flex items-center gap-3 mb-2 ${variant === "desktop" ? "px-1" : ""}`}>
            <button
              onClick={() => setLeftPanelTab("activity")}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                leftPanelTab === "activity"
                  ? "text-gray-700 dark:text-gray-200"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
              }`}
            >
              {t("myAgent.traceSectionTitle")}
            </button>
            <button
              onClick={() => setLeftPanelTab("skills")}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                leftPanelTab === "skills"
                  ? "text-gray-700 dark:text-gray-200"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
              }`}
            >
              {t("myAgent.skillSectionTitle")}
            </button>
          </div>
          {variant === "desktop" ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl py-2">
              {leftPanelTab === "activity" && (
                <ActivityTimeline traces={activityTraces} />
              )}
              {leftPanelTab === "skills" && (
                <SkillsList skills={agentSkills} />
              )}
            </div>
          ) : (
            <>
              {leftPanelTab === "activity" && (
                <ActivityTimelineCompact traces={activityTraces} />
              )}
              {leftPanelTab === "skills" && (
                <SkillsListCompact skills={agentSkills} />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
