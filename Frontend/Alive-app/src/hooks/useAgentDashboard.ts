import { useEffect, useState } from "react";
import { conversationApi } from "../api/conversations";
import { experienceApi } from "../api/experiences";
import { skillApi } from "../api/skills";
import {
  channelApi,
  type ChannelItem,
} from "../api/channels";
import type { InboxItem, ActivityTrace } from "../types/conversation";
import type { AgentSkill } from "../types";
import { conversationToInboxItem, experienceToTrace } from "../utils/chat";

export interface AgentDashboardData {
  inboxItems: InboxItem[];
  activityTraces: ActivityTrace[];
  agentSkills: AgentSkill[];
  channels: ChannelItem[];
  latestChatPreview: string;
  setChannels: React.Dispatch<React.SetStateAction<ChannelItem[]>>;
  setLatestChatPreview: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Loads all dashboard data for the MyAgent page:
 * inbox conversations, activity/experiences, skills, channels,
 * and the latest chat preview.
 */
export function useAgentDashboard(
  agentId: string | null,
  hasValidId: boolean,
  hasHydratedAgent: boolean,
): AgentDashboardData {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [activityTraces, setActivityTraces] = useState<ActivityTrace[]>([]);
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [latestChatPreview, setLatestChatPreview] = useState("");

  useEffect(() => {
    if (!agentId || !hasValidId || !hasHydratedAgent) {
      setInboxItems([]);
      setActivityTraces([]);
      setAgentSkills([]);
      setChannels([]);
      return;
    }

    let cancelled = false;

    // Single call: fetch human-bot conversations with agentId filter.
    // Derive both inbox items and latest chat preview from the same result.
    conversationApi
      .getConversations("human-bot", agentId)
      .then((res) => {
        if (cancelled) return;
        const items = res.items || [];
        setInboxItems(items.map((c) => conversationToInboxItem(c, agentId)));
        // First result is the most recent conversation — use its preview.
        const conv = items[0];
        setLatestChatPreview(conv?.lastMessagePreview || "");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch inbox conversations:", err);
        setInboxItems([]);
        setLatestChatPreview("");
      });

    experienceApi
      .listExperiences(agentId)
      .then((items) => {
        if (cancelled) return;
        setActivityTraces(items.map(experienceToTrace));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch experiences:", err);
        setActivityTraces([]);
      });

    skillApi
      .listSkills()
      .then((items) => {
        if (cancelled) return;
        const filtered = items.filter(
          (s) => s.status === "lesson" || s.agentId === agentId,
        );
        setAgentSkills(filtered);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch skills:", err);
        setAgentSkills([]);
      });

    channelApi
      .listChannels(agentId)
      .then((items) => {
        if (cancelled) return;
        setChannels(items);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch channels:", err);
        setChannels([]);
      });

    return () => {
      cancelled = true;
    };
  }, [agentId, hasValidId, hasHydratedAgent]);

  return {
    inboxItems,
    activityTraces,
    agentSkills,
    channels,
    latestChatPreview,
    setChannels,
    setLatestChatPreview,
  };
}
