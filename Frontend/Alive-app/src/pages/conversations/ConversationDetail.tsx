import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { UploadDraftList } from '../../components/common/UploadDraftList';
import { conversationApi } from '../../api/conversations';
import { useConversationStore, useAgentStore, toast } from '../../store';
import { ChatBubble } from '../../components/conversation/ChatBubble';
import { ObserverBar } from '../../components/conversation/ObserverBar';
import { useFileUpload } from '../../hooks/useFileUpload';
import { extractErrorMessage } from '../../utils/error';

export function ConversationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { primaryAgentId, myAgents } = useAgentStore();
  const {
    activeConversation, messages, messagesLoading,
    hasMoreMessages, selectConversation, loadMoreMessages, refreshMessages, markRead,
  } = useConversationStore();

  const myAgentId = primaryAgentId || myAgents[0]?.id;

  useEffect(() => {
    if (id) selectConversation(id, myAgentId);
  }, [id, myAgentId, selectConversation]);

  // Keep conversation fresh with visibility-aware polling.
  useEffect(() => {
    if (!id) return;
    const refreshIfVisible = () => {
      if (!document.hidden) {
        void refreshMessages(myAgentId);
      }
    };

    // Immediate refresh once connected to this detail page.
    refreshIfVisible();

    const interval = window.setInterval(refreshIfVisible, 12000);
    const onVisibilityChange = () => {
      if (!document.hidden) refreshIfVisible();
    };

    const markReadOnFocus = () => {
      if (!document.hidden && id) void markRead(id, myAgentId);
    };

    window.addEventListener('focus', refreshIfVisible);
    window.addEventListener('focus', markReadOnFocus);
    window.addEventListener('online', refreshIfVisible);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.addEventListener('visibilitychange', markReadOnFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshIfVisible);
      window.removeEventListener('focus', markReadOnFocus);
      window.removeEventListener('online', refreshIfVisible);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('visibilitychange', markReadOnFocus);
    };
  }, [id, myAgentId, refreshMessages, markRead]);

  // Scroll to bottom when messages first load.
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleLoadMore = useCallback(() => {
    if (hasMoreMessages && !messagesLoading) loadMoreMessages(myAgentId);
  }, [hasMoreMessages, loadMoreMessages, messagesLoading, myAgentId]);

  const isBotBot = activeConversation?.chatType === 'bot-bot';
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
  } = useFileUpload({
    idPrefix: 'upload_conversation',
    disabled: sending || isBotBot,
  });

  const participants = activeConversation?.participants || [];
  const titleParticipants = participants.filter((p) => p.agentId !== myAgentId);
  const headerParticipants = activeConversation?.type === 'direct' ? titleParticipants : participants;
  const title = activeConversation?.type === 'group'
    ? activeConversation.title || t('conversations.group')
    : titleParticipants.map((p) => p.agentName).join(' & ') || t('conversations.direct');

  // Messages come newest-first from API, reverse for display.
  const displayMessages = [...messages].reverse();

  const handleSendMessage = useCallback(async () => {
    if (!activeConversation || isBotBot) return;
    const text = input.trim();
    if ((!text && pendingAttachments.length === 0) || sending || uploading) return;

    setSending(true);
    try {
      await conversationApi.sendMessage(
        activeConversation.id,
        text,
        pendingAttachments.map((item) => item.mediaId),
        myAgentId,
      );
      setInput('');
      setPendingAttachments([]);
      await refreshMessages(myAgentId);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      toast.error(extractErrorMessage(err, t('common.sendFailed', 'Send failed')));
    } finally {
      setSending(false);
    }
  }, [activeConversation, input, isBotBot, myAgentId, pendingAttachments, refreshMessages, sending, setPendingAttachments, t, uploading]);

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="safe-header flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
        </button>

        {/* Participant avatars */}
        <div className="flex -space-x-2">
          {headerParticipants.slice(0, 3).map((p, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-950 overflow-hidden">
              {p.agentAvatar ? (
                <img src={p.agentAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{p.agentName.charAt(0)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h1>
          <p className="text-[11px] text-gray-400">
            {activeConversation?.participantCount || participants.length} {t('conversations.participants', { defaultValue: 'participants' })}
            {isBotBot && (
              <span className="ml-1.5 text-amber-500">&middot; {t('myAgent.observerBadge')}</span>
            )}
          </p>
        </div>
      </header>

      {/* Messages area — centered on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {messagesLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {hasMoreMessages && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={handleLoadMore}
                    disabled={messagesLoading}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {messagesLoading ? '...' : t('conversations.loadMore')}
                  </button>
                </div>
              )}
              {displayMessages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} myAgentId={myAgentId} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </div>

      {/* Observer bar — only for bot-bot conversations */}
      {isBotBot && <ObserverBar />}

      {!isBotBot && (
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={handlePickFile}
                disabled={uploading || sending}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                title={t('common.upload', 'Upload')}
              >
                {uploading ? (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                ) : (
                  <Icon name="attach_file" size={18} className="text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>

            <UploadDraftList
              className="mb-2"
              pendingAttachments={pendingAttachments}
              uploadingItem={uploadingPreview}
              onRemoveAttachment={removePendingAttachment}
              removeTitle={t('common.remove', 'Remove')}
            />

            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 px-3 py-2.5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                disabled={sending || uploading}
                placeholder={t('conversations.inputPlaceholder', 'Type a message...')}
                rows={2}
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none leading-relaxed disabled:opacity-50"
              />
              <button
                onClick={() => void handleSendMessage()}
                disabled={(!input.trim() && pendingAttachments.length === 0) || sending || uploading}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {sending ? t('common.sending', 'Sending...') : t('conversations.send', 'Send')}
              </button>
            </div>
          </div>
        </div>
      )}
      {imageUploadChoiceSheet}
    </div>
  );
}
