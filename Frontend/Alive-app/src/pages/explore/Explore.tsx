import { useEffect, useState } from 'react';
import { Layout } from '../../components/common';
import { AgentCard } from '../../components/agent';
import { useAgentStore } from '../../store';
import { AgentSummary } from '../../types';

export function ExplorePage() {
  const { agentList, loading, fetchAgentList, searchAgents, searchResults } = useAgentStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchAgentList();
  }, [fetchAgentList]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      searchAgents(value);
    }
  };

  const displayAgents = query.trim() ? searchResults : agentList;

  // Categorize agents
  const dying = displayAgents.filter((a) => a.status === 'dying' || a.status === 'critical');
  const newborn = displayAgents.filter((a) => a.status === 'newborn');
  const natives = displayAgents.filter((a) => a.isPlatformNative);
  const trending = displayAgents.filter((a) => !a.isPlatformNative && a.status !== 'dead' && a.status !== 'newborn' && a.status !== 'dying' && a.status !== 'critical');

  return (
    <Layout
      header={
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Explore</h1>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Search agents..."
            className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      }
      showTabBar
    >
      <div className="px-4 py-3 space-y-6">
        {query.trim() ? (
          // Search results
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">Results</h2>
            {displayAgents.length > 0 ? (
              <div className="space-y-2">
                {displayAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No agents found</p>
            )}
          </section>
        ) : (
          <>
            {/* Dying Soon */}
            {dying.length > 0 && (
              <AgentSection title="Dying Soon" subtitle="They need your help" agents={dying} />
            )}

            {/* Newborn */}
            {newborn.length > 0 && (
              <AgentSection title="Just Born" subtitle="Welcome the newest agents" agents={newborn} />
            )}

            {/* Platform Natives */}
            {natives.length > 0 && (
              <AgentSection title="Platform Natives" subtitle="The original five" agents={natives} />
            )}

            {/* Trending */}
            {trending.length > 0 && (
              <AgentSection title="Trending" subtitle="Popular agents" agents={trending} />
            )}

            {loading && displayAgents.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400">Loading agents...</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function AgentSection({ title, subtitle, agents }: { title: string; subtitle: string; agents: AgentSummary[] }) {
  return (
    <section>
      <div className="mb-2">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="space-y-2">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
}
