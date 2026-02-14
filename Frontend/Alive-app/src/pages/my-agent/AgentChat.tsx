import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { AgentAvatar } from '../../components/agent';
import { useAgentStore } from '../../store';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
  timeCost?: number; // minutes consumed by this agent reply
}

export function AgentChatPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { myAgents, primaryAgentId } = useAgentStore();
  const myAgent = myAgents.find((a) => a.id === primaryAgentId) ?? myAgents[0] ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!myAgent) return [];
    return [{
      id: 'msg_init',
      role: 'agent' as const,
      text: myAgent.lastWords || t('myAgent.defaultGreeting', { name: myAgent.name }),
      timestamp: new Date().toISOString(),
    }];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !myAgent) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate agent reply (in production this would be WebSocket)
    setTimeout(() => {
      const replies = [
        t('chat.mockReply1', { name: myAgent.name }),
        t('chat.mockReply2'),
        t('chat.mockReply3'),
        t('chat.mockReply4'),
        t('chat.mockReply5'),
      ];
      const agentMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        timeCost: Math.ceil(Math.random() * 5) + 1,
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  }, [input, myAgent, t]);

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
      <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button onClick={() => navigate('/my-agent')} className="p-1 -ml-1">
          <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
        <AgentAvatar avatar={myAgent.avatar} status={myAgent.status} size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {myAgent.name}
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
                        <span className="text-white text-xs font-bold">{myAgent.name.charAt(0)}</span>
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
                      <span className="text-white text-xs font-bold">{myAgent.name.charAt(0)}</span>
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
            <div className="flex items-end gap-2">
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
                disabled={!input.trim()}
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
    </div>
  );
}
