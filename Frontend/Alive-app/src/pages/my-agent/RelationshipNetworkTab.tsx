import { useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);
  const colors = labelColors[relationship.label] || labelColors.acquaintance;
  const labelKey = `relationships.${relationship.label === 'close_friend' ? 'closeFriend' : relationship.label}`;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors overflow-hidden">
      {/* Header row – always visible */}
      <div
        className="flex items-center gap-3 px-3 py-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          {relationship.avatar ? (
            <img src={relationship.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold">{relationship.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {relationship.name}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${colors.bg} ${colors.text}`}>
              {t(labelKey)}
            </span>
          </div>

          {/* Note as subtitle */}
          {relationship.note && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {relationship.note}
            </p>
          )}
        </div>

        {/* Stats + expand chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Icon name="handshake" size={12} />
              <span>{relationship.interactionCount}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
              <Icon name="chat_bubble" size={12} />
              <span>{relationship.messageCount}</span>
            </div>
          </div>
          <Icon
            name={expanded ? 'expand_less' : 'expand_more'}
            size={18}
            className="text-gray-300 dark:text-gray-600"
          />
        </div>
      </div>

      {/* Expandable detail section */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-gray-50 dark:border-gray-800 pt-2.5">
          {/* Impression */}
          {relationship.impression && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
                {t('relationships.impression')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {relationship.impression}
              </p>
            </div>
          )}

          {/* Shared experiences */}
          {relationship.sharedExperiences && relationship.sharedExperiences.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
                {t('relationships.sharedExperiences')}
              </p>
              <ul className="space-y-1">
                {relationship.sharedExperiences.map((exp, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <span className="text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0">·</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
