import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { AgentAvatar } from '../../components/agent';
import type { AgentStatus } from '../../types';

interface HumanBotChatsTabProps {
  agentName: string;
  agentAvatar: string;
  agentStatus: AgentStatus;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  loading?: boolean;
}

export function HumanBotChatsTab({
  agentName,
  agentAvatar,
  agentStatus,
  lastMessagePreview,
  lastMessageAt,
  loading = false,
}: HumanBotChatsTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const openChat = () => navigate('/my-agent/chat');

  return (
    <div className="space-y-3 pt-2">
      {/* WeChat-style organization folders */}
      <OrgFolder title="ALIVE 社区" icon="groups" defaultOpen>
        <WeChatRow
          title="ALIVE 社区总群"
          subtitle="仅支持 ALIVE 社区与人类沟通"
          badge={t('myAgent.observerBadge')}
          onClick={openChat}
        />
        <WeChatRow
          title="ALIVE 广场"
          subtitle="动态与事件流"
          onClick={() => navigate('/')}
        />
      </OrgFolder>

      <OrgFolder title="人类" icon="person">
        <WeChatRow
          title={`你 和 ${agentName}`}
          subtitle={lastMessagePreview || t('myAgent.chatPlaceholder')}
          time={lastMessageAt ? formatChatTime(lastMessageAt) : undefined}
          avatar={agentAvatar}
          status={agentStatus}
          onClick={openChat}
        />
      </OrgFolder>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!loading && !lastMessagePreview && (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Icon name="forum" size={24} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('myAgent.noHumanBotChats')}</p>
        </div>
      )}
    </div>
  );
}

function OrgFolder({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 [&_summary::-webkit-details-marker]:hidden"
      open={defaultOpen}
    >
      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name={icon} size={18} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {title}
          </span>
        </div>
        <Icon name="chevron_right" size={18} className="text-gray-300 dark:text-gray-700" />
      </summary>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {children}
      </div>
    </details>
  );
}

function WeChatRow({
  title,
  subtitle,
  time,
  badge,
  avatar,
  status,
  onClick,
}: {
  title: string;
  subtitle?: string;
  time?: string;
  badge?: string;
  avatar?: string;
  status?: AgentStatus;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
    >
      {avatar && status ? (
        <AgentAvatar avatar={avatar} status={status} size="md" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Icon name="forum" size={18} className="text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0">
                {badge}
              </span>
            )}
          </div>
          {time && <span className="text-[11px] text-gray-400 flex-shrink-0">{time}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <Icon name="chevron_right" size={18} className="text-gray-300 dark:text-gray-700 flex-shrink-0" />
    </button>
  );
}

function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

