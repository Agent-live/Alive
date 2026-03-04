import type {
  AgentExperience,
  MessageAttachment,
} from "../types";
import type { ChatMessage } from "../types/chat";
import type {
  ActivityTrace,
  InboxItem,
  Conversation,
  ConversationMessage,
} from "../types/conversation";

/** Convert ConversationMessage items to ChatMessage format for the chat UI. */
export function messagesToChatMessages(
  messages: ConversationMessage[],
): ChatMessage[] {
  return messages
    .filter((m) => m.messageType !== "system")
    .map((m) => ({
      id: m.id,
      role: (m.interactionType === "chat_user" ? "user" : "agent") as "user" | "agent",
      text: m.content,
      attachments: (m.attachments || []).map((a) => ({
        mediaId: a.mediaId,
        mimeType: a.mimeType,
        url: a.url,
        thumbnailUrl: a.thumbnailUrl,
        fileSize: a.fileSize,
      })),
      timestamp: m.createdAt,
    }));
}

export function attachmentTag(attachments?: MessageAttachment[]): string {
  if (!attachments || attachments.length === 0) return "";
  if (
    attachments.some((a) =>
      (a.mimeType || "").toLowerCase().startsWith("image/"),
    )
  )
    return "[image]";
  if (
    attachments.some((a) =>
      (a.mimeType || "").toLowerCase().startsWith("video/"),
    )
  )
    return "[video]";
  if (
    attachments.some((a) =>
      (a.mimeType || "").toLowerCase().startsWith("audio/"),
    )
  )
    return "[audio]";
  return "[file]";
}

export function normalizePreviewText(text: string): string {
  const raw = (text || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "[image]") return "[image]";
  if (lower === "[video]") return "[video]";
  if (lower === "[audio]") return "[audio]";
  if (lower === "[file]") return "[file]";
  if (lower.startsWith("[attachments x") && lower.endsWith("]")) return lower;
  return raw;
}

export function chatMessagePreview(message: ChatMessage): string {
  const tag = attachmentTag(message.attachments);
  if (tag) return tag;
  return normalizePreviewText((message.text || "").trim());
}

export function conversationToInboxItem(
  conv: Conversation,
  myAgentId: string,
): InboxItem {
  const participants = conv.participants || [];
  const others = participants.filter((p) => p.agentId !== myAgentId);
  const primaryOther = others[0];

  const senderName =
    conv.type === "direct"
      ? primaryOther?.agentName || conv.title || "Conversation"
      : conv.title ||
        others
          .map((p) => p.agentName)
          .filter(Boolean)
          .join(", ") ||
        "Conversation";

  return {
    id: conv.id,
    channelType: "webchat",
    senderName,
    senderAvatar:
      conv.type === "direct" ? primaryOther?.agentAvatar : undefined,
    preview: normalizePreviewText(conv.lastMessagePreview || ""),
    timestamp: conv.lastMessageAt || conv.createdAt,
    unreadCount: conv.unreadCount || 0,
    conversationId: conv.id,
  };
}

export function experienceToTrace(exp: AgentExperience): ActivityTrace {
  const type: ActivityTrace["type"] =
    exp.type === "milestone"
      ? "milestone"
      : exp.type === "request"
        ? "channel_msg"
        : "social";

  const emoji =
    type === "milestone" ? "flag" : type === "channel_msg" ? "chat" : "forum";

  return {
    id: exp.id,
    type,
    title: exp.title,
    detail: exp.description || undefined,
    emoji,
    timestamp: exp.date,
  };
}
