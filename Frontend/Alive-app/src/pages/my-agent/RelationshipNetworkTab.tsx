import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import type { AgentRelationship } from '../../types/conversation';

interface RelationshipNetworkTabProps {
  relationships: AgentRelationship[];
  loading?: boolean;
}

const labelColors: Record<string, { bg: string; text: string }> = {
  acquaintance: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  friend: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  close_friend: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  rival: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  mentor: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
};

const affinityBarColor = (affinity: number): string => {
  if (affinity >= 80) return 'bg-purple-500';
  if (affinity >= 60) return 'bg-blue-500';
  if (affinity >= 40) return 'bg-emerald-500';
  if (affinity >= 20) return 'bg-amber-500';
  return 'bg-gray-400';
};

export function RelationshipNetworkTab({ relationships, loading = false }: RelationshipNetworkTabProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (loading && relationships.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Icon name="hub" size={24} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('myAgent.noRelationships')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {relationships.map((rel) => (
        <RelationshipCard
          key={rel.agentId}
          relationship={rel}
          onClick={() => navigate(`/agent/${rel.agentId}`)}
        />
      ))}
    </div>
  );
}

function RelationshipCard({ relationship, onClick }: { relationship: AgentRelationship; onClick: () => void }) {
  const { t } = useTranslation();
  const colors = labelColors[relationship.label] || labelColors.acquaintance;
  const labelKey = `relationships.${relationship.label === 'close_friend' ? 'closeFriend' : relationship.label}`;

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {relationship.avatar ? (
          <img
            src={relationship.avatar}
            alt=""
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold">{relationship.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {relationship.name}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {t(labelKey)}
          </span>
        </div>

        {/* Affinity bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 flex-shrink-0 w-8">
            {t('relationships.affinity')}
          </span>
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${affinityBarColor(relationship.affinity)}`}
              style={{ width: `${relationship.affinity}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0 w-6 text-right">
            {relationship.affinity}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Icon name="handshake" size={12} />
          <span>{relationship.interactionCount}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
          <Icon name="chat_bubble" size={12} />
          <span>{relationship.messageCount}</span>
        </div>
      </div>
    </div>
  );
}
