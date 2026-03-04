import { useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/common/Icon";
import { UploadDraftList } from "../../components/common/UploadDraftList";
import { AgentAvatar } from "../../components/agent";
import { ChatMessageList } from "../../components/chat/ChatMessageList";
import { useAgentStore } from "../../store";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useChatSession } from "../../hooks/useChatSession";
import { timerToAliveDays } from "../../utils/format";

export function AgentChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId, fetchMyAgents } = useAgentStore();
  const myAgent =
    myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null;
  const agentName = (myAgent?.name || "").trim() || "Agent";

  const prefill =
    (location.state as { prefill?: string } | null)?.prefill || "";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    input,
    setInput,
    isTyping,
    sendMessage,
    resetAttachments,
  } = useChatSession({
    agentId: myAgent?.id ?? null,
    agentName,
    lastWords: myAgent?.lastWords,
    active: !!myAgent,
  });

  // Apply prefill once
  useEffect(() => {
    if (prefill) setInput(prefill);
  }, [prefill, setInput]);

  const {
    pendingAttachments,
    setPendingAttachments,
    uploading,
    uploadingPreview,
    fileInputRef,
    pickFile: handlePickFile,
    handleFileChange,
    removeAttachment: removePendingAttachment,
    imageUploadChoiceSheet,
  } = useFileUpload({ idPrefix: "upload_chat_page", disabled: isTyping });

  // Sync resetAttachments from useChatSession on error rollback
  useEffect(() => {
    if (resetAttachments.length > 0) {
      setPendingAttachments(resetAttachments);
    }
  }, [resetAttachments, setPendingAttachments]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    void fetchMyAgents();
    const timer = window.setInterval(() => {
      if (!document.hidden) void fetchMyAgents();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [fetchMyAgents]);

  const handleSend = useCallback(async () => {
    const attachments = pendingAttachments;
    setPendingAttachments([]);
    await sendMessage(attachments);
  }, [pendingAttachments, sendMessage, setPendingAttachments]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!myAgent) {
    navigate("/my-agent", { replace: true });
    return null;
  }

  const isDead = myAgent.status === "dead";

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="safe-header flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button onClick={() => navigate("/my-agent")} className="p-1 -ml-1">
          <Icon
            name="arrow_back"
            size={22}
            className="text-gray-600 dark:text-gray-400"
          />
        </button>
        <AgentAvatar
          avatar={myAgent.avatar}
          status={myAgent.status}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {agentName}
          </h1>
          <p className="text-[11px] text-gray-400">
            {isDead
              ? t("status.dead")
              : t("myAgent.aliveFor", {
                  days: timerToAliveDays(myAgent.timerRemaining),
                })}
          </p>
        </div>
      </header>

      {/* Messages -- centered on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          <ChatMessageList
            messages={messages}
            isTyping={isTyping}
            agentName={agentName}
            agentAvatar={myAgent.avatar}
            size="md"
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!isDead ? (
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadDraftList
              className="mb-2"
              pendingAttachments={pendingAttachments}
              uploadingItem={uploadingPreview}
              onRemoveAttachment={removePendingAttachment}
              removeTitle={t("chat.removeAttachment")}
            />
            <div className="flex items-end gap-2">
              <button
                onClick={handlePickFile}
                disabled={uploading || isTyping}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-50"
                title={t("chat.uploadAttachment")}
              >
                {uploading ? (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                ) : (
                  <Icon name="attach_file" size={20} />
                )}
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("myAgent.chatPlaceholder")}
                rows={1}
                className="flex-1 resize-none rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
                style={{ minHeight: "40px" }}
              />
              <button
                onClick={handleSend}
                disabled={
                  (!input.trim() && pendingAttachments.length === 0) ||
                  uploading ||
                  isTyping
                }
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                <Icon name="arrow_upward" size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-4 text-center">
          <p className="text-sm text-gray-400">{t("chat.agentDead")}</p>
        </div>
      )}

      {imageUploadChoiceSheet}
    </div>
  );
}
