import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { conversationApi } from "../api/conversations";
import type { ChatMessage, MessageAttachment } from "../types/chat";
import { messagesToChatMessages, chatMessagePreview } from "../utils/chat";

export interface UseChatSessionOptions {
  agentId: string | null;
  agentName: string;
  lastWords?: string;
  /** Whether the session is active / visible (gates history loading). */
  active: boolean;
  /** Called whenever the latest message preview changes. */
  onPreviewChange?: (preview: string) => void;
}

export interface UseChatSessionReturn {
  messages: ChatMessage[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isTyping: boolean;
  conversationId: string | null;
  sendMessage: (attachments?: MessageAttachment[]) => Promise<void>;
  resetAttachments: MessageAttachment[];
}

export function useChatSession({
  agentId,
  agentName,
  lastWords,
  active,
  onPreviewChange,
}: UseChatSessionOptions): UseChatSessionReturn {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [resetAttachments, setResetAttachments] = useState<MessageAttachment[]>([]);

  /* Load chat history */
  useEffect(() => {
    if (!active || !agentId) return;
    if (messages.length > 0) return;

    let cancelled = false;

    const defaultMessage: ChatMessage = {
      id: "msg_init",
      role: "agent",
      text: lastWords || t("myAgent.defaultGreeting", { name: agentName }),
      timestamp: new Date().toISOString(),
    };

    const loadHistory = async () => {
      try {
        if (conversationId) {
          const res = await conversationApi.getMessages(conversationId, 1, 50, agentId);
          if (cancelled) return;
          const history = messagesToChatMessages(res.items || []);
          if (history.length > 0) {
            setMessages(history);
            return;
          }
        }
        // Try finding an existing conversation
        const convs = await conversationApi.getConversations("human-bot", agentId);
        if (cancelled) return;
        const conv = convs.items?.[0];
        if (conv) {
          setConversationId(conv.id);
          const res = await conversationApi.getMessages(conv.id, 1, 50, agentId);
          if (cancelled) return;
          const history = messagesToChatMessages(res.items || []);
          if (history.length > 0) {
            setMessages(history);
            return;
          }
        }
        if (!cancelled) setMessages([defaultMessage]);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load chat history:", err);
        setMessages([defaultMessage]);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [active, messages.length, agentId, agentName, conversationId, lastWords, t]);

  /* Send chat message */
  const sendMessage = useCallback(
    async (attachments: MessageAttachment[] = []) => {
      const text = input.trim();
      if ((!text && attachments.length === 0) || !agentId) return;

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        text,
        attachments,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      onPreviewChange?.(chatMessagePreview(userMsg));
      setInput("");
      setResetAttachments([]);
      setIsTyping(true);

      try {
        const res = await conversationApi.chat(
          text,
          attachments.map((item) => ({ mediaId: item.mediaId })),
          agentId,
        );
        if (res.conversationId) setConversationId(res.conversationId);
        const agentMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: "agent",
          text: res.reply ?? "",
          timestamp: res.createdAt || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, agentMsg]);
        onPreviewChange?.(chatMessagePreview(agentMsg));
      } catch (err) {
        console.error("Failed to send chat message:", err);
        setInput(text);
        setResetAttachments(attachments);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: "agent",
            text: "Failed to send message. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, agentId, onPreviewChange],
  );

  return {
    messages,
    input,
    setInput,
    isTyping,
    conversationId,
    sendMessage,
    resetAttachments,
  };
}
