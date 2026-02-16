import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { ChatAttachments } from '../../components/common/ChatAttachments';
import { UploadDraftList, type UploadingDraftItem } from '../../components/common/UploadDraftList';
import { useImageUploadChoice } from '../../components/common/ImageUploadChoiceSheet';
import { AgentAvatar } from '../../components/agent';
import { useAgentStore, toast } from '../../store';
import { chatApi } from '../../api/chat';
import { mediaApi } from '../../api/media';
import type { MessageAttachment } from '../../types/chat';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  attachments?: MessageAttachment[];
  timestamp: string;
  timeCost?: number; // minutes consumed by this agent reply
}

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

function normalizeProgressPercent(progress: number): number {
  let pct = Math.max(0, Math.min(100, progress * 100));
  if (progress > 0 && pct < 0.1) pct = 0.1;
  if (progress < 1 && pct > 99.9) pct = 99.9;
  return pct;
}

export function AgentChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId } = useAgentStore();
  const myAgent = myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null;
  const agentName = (myAgent?.name || '').trim() || 'Agent';
  const agentInitial = agentName.charAt(0).toUpperCase();

  const prefill = (location.state as { prefill?: string } | null)?.prefill || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState('main');
  const [input, setInput] = useState(prefill);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState<UploadingDraftItem | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { requestChoice: requestImageUploadChoice, sheetNode: imageUploadChoiceSheet } = useImageUploadChoice();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!myAgent) return;

    let cancelled = false;
    chatApi.getHistory()
      .then((res) => {
        if (cancelled) return;
        const history = (res.messages || [])
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            id: m.id,
            role: (m.role === 'assistant' ? 'agent' : 'user') as ChatMessage['role'],
            text: m.content,
            attachments: m.attachments || [],
            timestamp: m.createdAt,
          }));

        if (history.length > 0) {
          setMessages(history);
          const last = res.messages?.[res.messages.length - 1];
          if (last?.sessionId) setSessionId(last.sessionId);
          return;
        }

        setMessages([{
          id: 'msg_init',
          role: 'agent',
          text: myAgent.lastWords || t('myAgent.defaultGreeting', { name: agentName }),
          timestamp: new Date().toISOString(),
        }]);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load chat history:', err);
        setMessages([{
          id: 'msg_init',
          role: 'agent',
          text: myAgent.lastWords || t('myAgent.defaultGreeting', { name: agentName }),
          timestamp: new Date().toISOString(),
        }]);
      });

    return () => {
      cancelled = true;
    };
  }, [agentName, myAgent?.id, t]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && pendingAttachments.length === 0) || !myAgent) return;

    const attachments = pendingAttachments;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      attachments,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPendingAttachments([]);
    setIsTyping(true);

    try {
      const res = await chatApi.send(
        text,
        sessionId,
        attachments.map((item) => ({ mediaId: item.mediaId })),
      );
      if (res.sessionId) setSessionId(res.sessionId);
      const agentMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        text: res.reply,
        timestamp: res.createdAt || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setInput(text);
      setPendingAttachments(attachments);
      setMessages((prev) => [...prev, {
        id: `msg_err_${Date.now()}`,
        role: 'agent',
        text: 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, myAgent, pendingAttachments, sessionId]);

  const handlePickFile = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const mimeType = file.type || 'application/octet-stream';
    const mimeTypeLower = mimeType.toLowerCase();
    const isImage = mimeTypeLower.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    const previewId = `upload_${Date.now()}`;

    let keepOriginalImage = false;
    if (isImage) {
      const choice = await requestImageUploadChoice({
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
      });
      if (choice == null) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        return;
      }
      keepOriginalImage = choice;
    }

    setUploading(true);
    setUploadingPreview({
      id: previewId,
      name: file.name,
      mimeType,
      previewUrl,
      fileSize: file.size,
      progress: 0,
    });
    try {
      const media = await mediaApi.uploadFile(file, {
        keepOriginalImage,
        onProgress: (progress) => {
          const pct = normalizeProgressPercent(progress);
          setUploadingPreview((prev) => (prev ? { ...prev, progress: pct } : prev));
        },
      });
      if (!media.url) {
        throw new Error('Upload succeeded but no media URL was returned.');
      }
      setPendingAttachments((prev) => [
        ...prev,
        {
          mediaId: media.mediaId,
          mimeType: media.mimeType,
          url: media.url!,
          thumbnailUrl: media.thumbnailUrl,
          fileSize: media.fileSize,
          fileName: file.name,
        },
      ]);
    } catch (err) {
      console.error('Attachment upload failed:', err);
      toast.error(errorMessage(err, '附件上传失败，请重试'));
    } finally {
      setUploading(false);
      setUploadingPreview(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }, [requestImageUploadChoice]);

  const removePendingAttachment = (mediaId: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.mediaId !== mediaId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!myAgent) {
    navigate('/my-agent', { replace: true });
    return null;
  }

  const isDead = myAgent.status === 'dead';

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="safe-header flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button onClick={() => navigate('/my-agent')} className="p-1 -ml-1">
          <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
        <AgentAvatar avatar={myAgent.avatar} status={myAgent.status} size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {agentName}
          </h1>
          <p className="text-[11px] text-gray-400">
            {isDead ? t('status.dead') : t('myAgent.aliveFor', { days: Math.floor(myAgent.timerRemaining / 86400) || 1 })}
          </p>
        </div>
      </header>

      {/* Messages — centered on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {msg.role === 'agent' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                    {myAgent.avatar ? (
                      <img src={myAgent.avatar} alt="" className="w-8 h-8 object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{agentInitial}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble */}
                <div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
                    }`}
                  >
                    <ChatAttachments attachments={msg.attachments} />
                    {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                  <div className={`flex items-center gap-2 mt-0.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.timeCost != null && (
                      <span className="text-[10px] text-orange-400">
                        -{msg.timeCost}min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  {myAgent.avatar ? (
                    <img src={myAgent.avatar} alt="" className="w-8 h-8 object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{agentInitial}</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
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
              removeTitle="移除附件"
            />
            <div className="flex items-end gap-2">
              <button
                onClick={handlePickFile}
                disabled={uploading || isTyping}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 flex items-center justify-center disabled:opacity-50"
                title="上传附件"
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
                placeholder={t('myAgent.chatPlaceholder')}
                rows={1}
                className="flex-1 resize-none rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && pendingAttachments.length === 0) || uploading || isTyping}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                <Icon name="arrow_upward" size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-4 text-center">
          <p className="text-sm text-gray-400">{t('chat.agentDead')}</p>
        </div>
      )}

      {imageUploadChoiceSheet}
    </div>
  );
}
