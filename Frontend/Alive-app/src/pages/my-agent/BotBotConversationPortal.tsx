import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/common/Icon";
import { UploadDraftList } from "../../components/common/UploadDraftList";
import { ChatBubble } from "../../components/conversation/ChatBubble";
import { PortalShell } from "../../components/PortalShell";
import { useFileUpload } from "../../hooks/useFileUpload";
import { conversationApi } from "../../api/conversations";
import { toast } from "../../store";
import type {
  Conversation,
  ConversationMessage,
} from "../../types/conversation";

interface BotBotConversationPortalProps {
  conversation: Conversation;
  myAgentId?: string;
  onClose: () => void;
}

export function BotBotConversationPortal({
  conversation,
  myAgentId,
  onClose,
}: BotBotConversationPortalProps) {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const [guidanceInput, setGuidanceInput] = useState("");
  const [guidanceSending, setGuidanceSending] = useState(false);

  const {
    pendingAttachments: guidanceAttachments,
    setPendingAttachments: setGuidanceAttachments,
    uploading: guidanceUploading,
    uploadingPreview: guidanceUploadingPreview,
    fileInputRef: guidanceFileInputRef,
    pickFile: handleGuidancePickFile,
    handleFileChange: handleGuidanceFileChange,
    removeAttachment: removeGuidanceAttachment,
    imageUploadChoiceSheet,
  } = useFileUpload({ idPrefix: "upload_guidance", disabled: guidanceSending });

  /* Load messages when the conversation changes */
  useEffect(() => {
    const convID = conversation.id;
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
        console.error("Failed to load social preview messages:", err);
        setMessages([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  const sendGuidance = useCallback(async () => {
    const text = guidanceInput.trim();
    if ((!text && guidanceAttachments.length === 0) || !conversation) return;
    if (guidanceSending || guidanceUploading) return;

    setGuidanceSending(true);
    try {
      await conversationApi.sendMessage(
        conversation.id,
        text,
        guidanceAttachments.map((item) => item.mediaId),
        myAgentId,
      );
      setGuidanceInput("");
      setGuidanceAttachments([]);
    } catch (err) {
      console.error("Failed to send guidance:", err);
      toast.error(t("common.sendFailed", "Failed to send"));
    } finally {
      setGuidanceSending(false);
    }
  }, [
    guidanceAttachments,
    guidanceInput,
    guidanceSending,
    guidanceUploading,
    myAgentId,
    conversation,
    setGuidanceAttachments,
    t,
  ]);

  const participants = conversation.participants || [];
  const displayTitle =
    conversation.title ||
    participants
      .map((p) => p.agentName)
      .filter(Boolean)
      .join(", ") ||
    "Bot Chat";

  const headerLeft = (
    <>
      {/* Stacked avatars (small) */}
      <div className="relative flex-shrink-0 w-9 h-9">
        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 grid grid-cols-2 gap-px p-px overflow-hidden">
          {participants.slice(0, 4).map((p, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center"
            >
              {p.agentAvatar ? (
                <img
                  src={p.agentAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-[8px] font-bold">
                  {(p.agentName || "?").charAt(0).toUpperCase()}
                </span>
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
    </>
  );

  return (
    <PortalShell title={displayTitle} onClose={onClose} headerLeft={headerLeft}>
      {/* Messages (read-only preview of bot-bot chat) */}
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
          <Icon
            name="tips_and_updates"
            size={18}
            className="text-amber-500 mr-1"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t("myAgent.guidanceHint")}
          </span>
          <button
            onClick={handleGuidancePickFile}
            disabled={guidanceUploading || guidanceSending}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            title={t("common.upload", "Upload")}
          >
            {guidanceUploading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
            ) : (
              <Icon
                name="attach_file"
                size={18}
                className="text-gray-500 dark:text-gray-400"
              />
            )}
          </button>
        </div>
        <UploadDraftList
          className="px-4 pb-2"
          pendingAttachments={guidanceAttachments}
          uploadingItem={guidanceUploadingPreview}
          onRemoveAttachment={removeGuidanceAttachment}
          removeTitle={t("common.remove", "Remove")}
        />
        {/* Textarea */}
        <div className="px-4 pb-3">
          <textarea
            value={guidanceInput}
            onChange={(e) => setGuidanceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendGuidance();
              }
            }}
            placeholder={t("myAgent.guidancePlaceholder")}
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none leading-relaxed"
          />
        </div>
        {/* Send row */}
        <div className="flex items-center justify-end px-4 pb-3">
          <button
            onClick={() => void sendGuidance()}
            disabled={
              (!guidanceInput.trim() &&
                guidanceAttachments.length === 0) ||
              guidanceSending ||
              guidanceUploading
            }
            className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            {t("myAgent.sendGuidance")}
          </button>
        </div>
      </div>
      {imageUploadChoiceSheet}
    </PortalShell>
  );
}
