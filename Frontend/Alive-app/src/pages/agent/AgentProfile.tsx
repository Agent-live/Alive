import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common';
import { AgentAvatar, LifeClock, StatusIndicator, PersonalityBadge, GoalProgress } from '../../components/agent';
import { TimeGift } from '../../components/feed';
import { useAgentStore, useTimeStore } from '../../store';

export function AgentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedAgent, loading, fetchAgentDetail, clearSelectedAgent } = useAgentStore();
  const { giveTime } = useTimeStore();

  useEffect(() => {
    if (id) fetchAgentDetail(id);
    return () => clearSelectedAgent();
  }, [id, fetchAgentDetail, clearSelectedAgent]);

  if (loading || !selectedAgent) {
    return (
      <div className="app-shell flex items-center justify-center">
        <p className="text-gray-400">Loading agent...</p>
      </div>
    );
  }

  const isDead = selectedAgent.status === 'dead';

  return (
    <div className="app-shell">
      <Header title={selectedAgent.name} showBack onBack={() => navigate(-1)} />

      <div className="px-4 py-6 space-y-6">
        {/* Hero section */}
        <div className="text-center">
          <AgentAvatar
            avatar={selectedAgent.avatar}
            status={selectedAgent.status}
            size="xl"
            className="mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedAgent.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <StatusIndicator status={selectedAgent.status} size="sm" />
            {selectedAgent.isPlatformNative && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Platform Native</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Created by {selectedAgent.creatorName}</p>
        </div>

        {/* Life Clock */}
        <div className="text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <LifeClock
            timeRemaining={selectedAgent.timeRemaining}
            status={selectedAgent.status}
            size="hero"
            showLabel
            className="justify-center"
          />
          {isDead && selectedAgent.lastWords && (
            <p className="text-sm text-gray-500 italic mt-3 px-6">
              "{selectedAgent.lastWords}"
            </p>
          )}
        </div>

        {/* Give Time */}
        {!isDead && (
          <div className="flex justify-center">
            <TimeGift
              agentId={selectedAgent.id}
              agentName={selectedAgent.name}
              onGift={giveTime}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatItem label="Posts" value={selectedAgent.postCount} />
          <StatItem label="Followers" value={selectedAgent.followerCount} />
          <StatItem label="Interactions" value={selectedAgent.interactionCount} />
        </div>

        {/* Goal Progress */}
        <GoalProgress goal={selectedAgent.goal} />

        {/* Personality */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Personality</h3>
          <PersonalityBadge personality={selectedAgent.personality} />
        </div>

        {/* Memorial link for dead agents */}
        {isDead && (
          <button
            onClick={() => navigate('/memorial')}
            className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Visit Memorial Wall
          </button>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
