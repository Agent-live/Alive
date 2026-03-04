import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/common/Icon";
import { ChatBubble } from "../../components/conversation/ChatBubble";
import { PortalShell } from "../../components/PortalShell";
import { channelConfig, PlatformBadge } from "./InboxTab";
import { conversationApi } from "../../api/conversations";
import type { InboxItem, ConversationMessage } from "../../types/conversation";

interface InboxPreviewPortalProps {
  selectedItem: InboxItem;
  myAgentId?: string;
  onClose: () => void;
}

export function InboxPreviewPortal({
  selectedItem,
  myAgentId,
  onClose,
}: InboxPreviewPortalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  /* Load messages when the selected item changes */
  useEffect(() => {
    const convID = selectedItem.conversationId;
    if (!convID) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    conversationApi
      .getMessages(convID, 1, 20)
      .then((res) => {
        if (cancelled) return;
        setMessages([...(res.items || [])].reverse());
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load inbox preview messages:", err);
        setMessages([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedItem.conversationId]);

  const cfg =
    channelConfig[selectedItem.channelType] || channelConfig.webchat;
  const senderName = selectedItem.senderName || "Unknown";

  const headerLeft = (
    <>
      {/* Sender avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden">
          {selectedItem.senderAvatar ? (
            <img
              src={selectedItem.senderAvatar}
              alt=""
              className="w-9 h-9 object-cover"
            />
          ) : (
            <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">
              {senderName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <PlatformBadge
          channel={selectedItem.channelType}
          size={16}
          className="absolute -bottom-0.5 -right-0.5 border-[1.5px]"
        />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {senderName}
        </h2>
        <span
          className="text-[11px]"
          style={{ color: cfg.color }}
        >
          {t(
            `myAgent.channel.${selectedItem.channelType}`,
          )}
        </span>
      </div>
    </>
  );

  return (
    <PortalShell title={senderName} onClose={onClose} headerLeft={headerLeft}>
      {/* Messages (read-only preview) */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          </div>
        ) : messages.length > 0 ? (
          <div>
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                myAgentId={myAgentId}
              />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-40 text-sm text-gray-400">
            {t("conversations.noMessages", "No messages yet")}
          </div>
        )}
      </div>

      {/* Bottom: Open in app button */}
      {(() => {
        const channelName = t(
          `myAgent.channel.${selectedItem.channelType}`,
        );
        return (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-5 py-4 flex items-center justify-center">
            <button
              onClick={() => {
                onClose();
                if (selectedItem.conversationId) {
                  navigate(
                    `/conversations/${selectedItem.conversationId}`,
                  );
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl hover:opacity-80 transition-opacity"
              style={{ backgroundColor: `${cfg.color}15` }}
            >
              <PlatformBadge
                channel={selectedItem.channelType}
                size={22}
                className="border-0"
              />
              <span
                className="text-sm font-medium"
                style={{ color: cfg.color }}
              >
                {t("myAgent.openInApp", { app: channelName })}
              </span>
              <span style={{ color: cfg.color }}>
                <Icon name="open_in_new" size={16} />
              </span>
            </button>
          </div>
        );
      })()}
    </PortalShell>
  );
}
