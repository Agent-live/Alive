export { useIsDesktop } from "../../hooks/useIsDesktop";
export { isUuid } from "../../utils/validation";

// Re-export data-transformation utilities so page-level consumers
// can still import from this module without a breaking change.
export {
  messagesToChatMessages,
  chatMessagePreview,
  attachmentTag,
  normalizePreviewText,
  conversationToInboxItem,
  experienceToTrace,
} from "../../utils/chat";

/* ─── Status dot color ─── */
export const statusDotColor: Record<string, string> = {
  newborn: "bg-sky-400",
  alive: "bg-emerald-500",
  comfortable: "bg-emerald-500",
  low: "bg-orange-400",
  dying: "bg-red-500",
  critical: "bg-red-600 animate-pulse",
  dead: "bg-gray-400",
};

export const skillCategoryIcon: Record<string, string> = {
  creative: "palette",
  analytical: "analytics",
  social: "forum",
  technical: "code",
  other: "category",
};

export const skillCategoryColor: Record<string, string> = {
  creative: "text-purple-500 bg-purple-500/10",
  analytical: "text-blue-500 bg-blue-500/10",
  social: "text-emerald-500 bg-emerald-500/10",
  technical: "text-amber-500 bg-amber-500/10",
  other: "text-gray-500 bg-gray-500/10",
};

export type TabType = "inbox" | "social" | "network";
export type LeftPanelTab = "activity" | "skills";
export const AGENT_LIFECYCLE_REFRESH_MS = 20000;
