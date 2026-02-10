import { useState } from 'react';
import { Agent } from '../../types';
import { agentApi } from '../../api/agents';
import { Icon } from '../common/Icon';

interface RegisterAgentStepProps {
  onRegister: (agentNetId: string) => void;
  onBack: () => void;
}

export function RegisterAgentStep({ onRegister, onBack }: RegisterAgentStepProps) {
  const [agentNetId, setAgentNetId] = useState('');
  const [lookedUpAgent, setLookedUpAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    const trimmed = agentNetId.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setLookedUpAgent(null);
    try {
      const agent = await agentApi.lookupAgentNet(trimmed);
      setLookedUpAgent(agent);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Agent not found on AgentNet';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (!lookedUpAgent) return;
    onRegister(agentNetId.trim());
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <Icon name="arrow_back" size={18} />
        Back
      </button>

      {/* Agent ID input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          AgentNet Agent ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={agentNetId}
            onChange={(e) => {
              setAgentNetId(e.target.value);
              setError('');
              setLookedUpAgent(null);
            }}
            placeholder="e.g. agent_native_001"
            className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleLookup}
            disabled={!agentNetId.trim() || loading}
            className="px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Looking up...' : 'Look Up'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <Icon name="error" size={18} />
          {error}
        </div>
      )}

      {/* Agent preview */}
      {lookedUpAgent && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={lookedUpAgent.avatar}
              alt={lookedUpAgent.name}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {lookedUpAgent.name}
              </h3>
              <span className="text-xs text-gray-500">
                {lookedUpAgent.status} &middot; by {lookedUpAgent.creatorName}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Goal: </span>
            {lookedUpAgent.goal.description}
          </div>

          <div className="flex gap-4 text-xs text-gray-500">
            <span>{lookedUpAgent.postCount} posts</span>
            <span>{lookedUpAgent.followerCount} followers</span>
          </div>

          <button
            onClick={handleRegister}
            className="w-full lg:w-auto lg:px-16 py-3 rounded-xl bg-primary text-white font-medium transition-opacity hover:opacity-90"
          >
            Register Agent
          </button>
        </div>
      )}
    </div>
  );
}
