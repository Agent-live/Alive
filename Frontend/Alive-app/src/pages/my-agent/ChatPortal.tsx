import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AgentAvatar } from "../../components/agent";
import { Icon } from "../../components/common/Icon";
import { UploadDraftList } from "../../components/common/UploadDraftList";
import { ChatMessageList } from "../../components/chat/ChatMessageList";
import { PortalShell } from "../../components/PortalShell";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useChatSession } from "../../hooks/useChatSession";
import type { AgentStatus } from "../../types/agent";

export interface ChatPortalAgent {
  id: string;
  avatar: string;
  status: AgentStatus;
  lastWords?: string;
}

interface ChatPortalProps {
  open: boolean;
  onClose: () => void;
  agent: ChatPortalAgent;
  agentName: string;

  isDead: boolean;
  onLatestPreviewChange: (preview: string) => void;
}

export function ChatPortal({
  open,
  onClose,
  agent,
  agentName,
  isDead,
  onLatestPreviewChange,
}: ChatPortalProps) {
  const { t } = useTranslation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages: chatMessages,
    input: chatInput,
    setInput: setChatInput,
    isTyping: chatTyping,
    sendMessage,
  } = useChatSession({
    agentId: agent?.id ?? null,
    agentName,
    lastWords: agent?.lastWords,
    active: open && !!agent,
    onPreviewChange: onLatestPreviewChange,
  });

  const {
    pendingAttachments: chatPendingAttachments,
    setPendingAttachments: setChatPendingAttachments,
    uploading: chatUploading,
    uploadingPreview: chatUploadingPreview,
    fileInputRef: chatFileInputRef,
    pickFile: handleChatPickFile,
    handleFileChange: handleChatFileChange,
    removeAttachment: removeChatPendingAttachment,
    imageUploadChoiceSheet,
  } = useFileUpload({ idPrefix: "upload_chat", disabled: chatTyping });

  /* Send chat message */
  const handleChatSend = useCallback(async () => {
    const attachments = chatPendingAttachments;
    setChatPendingAttachments([]);
    await sendMessage(attachments);
  }, [chatPendingAttachments, sendMessage, setChatPendingAttachments]);

  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
      }
    },
    [handleChatSend],
  );

  /* Scroll chat to bottom */
  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, open]);

  /* Focus input when dialog opens */
  useEffect(() => {
    if (!open) return;
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [open]);

  if (!open) return null;

  const headerLeft = (
    <>
      {agent && (
        <AgentAvatar
          avatar={agent.avatar}
          status={agent.status}
          size="sm"
        />
      )}
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
        {agentName}
      </h2>
    </>
  );

  return (
    <PortalShell title={agentName} onClose={onClose} headerLeft={headerLeft}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <ChatMessageList
          messages={chatMessages}
          isTyping={chatTyping}
          agentName={agentName}
          agentAvatar={agent.avatar}
          size="sm"
        />
        <div ref={chatEndRef} />
      </div>

      {/* Input -- WeChat desktop style */}
      {!isDead ? (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10">
          <input
            ref={chatFileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            onChange={handleChatFileChange}
            className="hidden"
          />
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <Icon
                name="mood"
                size={20}
                className="text-gray-500 dark:text-gray-400"
              />
            </button>
            <button
              onClick={handleChatPickFile}
              disabled={chatUploading || chatTyping}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {chatUploading ? (
                <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
              ) : (
                <Icon
                  name="attach_file"
                  size={20}
                  className="text-gray-500 dark:text-gray-400"
                />
              )}
            </button>
            <button
              onClick={handleChatPickFile}
              disabled={chatUploading || chatTyping}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Icon
                name="image"
                size={20}
                className="text-gray-500 dark:text-gray-400"
              />
            </button>
          </div>
          <UploadDraftList
            className="px-4 pb-2"
            pendingAttachments={chatPendingAttachments}
            uploadingItem={chatUploadingPreview}
            onRemoveAttachment={removeChatPendingAttachment}
            removeTitle={t("common.remove", "Remove")}
          />
          {/* Textarea */}
          <div className="px-4 pb-3">
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder={t("myAgent.chatPlaceholder")}
              rows={4}
              className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none leading-relaxed"
            />
          </div>
          {/* Send row */}
          <div className="flex items-center justify-end px-4 pb-3">
            <button
              onClick={handleChatSend}
              disabled={
                (!chatInput.trim() &&
                  chatPendingAttachments.length === 0) ||
                chatTyping ||
                chatUploading
              }
              className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 transition-opacity"
            >
              {t("chat.send", "Send")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-5 py-4 text-center">
          <p className="text-sm text-gray-400">{t("chat.agentDead")}</p>
        </div>
      )}
      {imageUploadChoiceSheet}
    </PortalShell>
  );
}
