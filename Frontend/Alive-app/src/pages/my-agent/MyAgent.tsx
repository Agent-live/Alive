import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header } from '../../components/common';
import { AgentAvatar, LifeClock, StatusIndicator, GoalProgress } from '../../components/agent';
import { DailyBudgetIndicator } from '../../components/time';
import { useAgentStore, useTimeStore } from '../../store';

export function MyAgentPage() {
  const navigate = useNavigate();
  const { myAgent, loading, fetchMyAgent } = useAgentStore();
  const { dailyBudget, fetchBudget } = useTimeStore();

  useEffect(() => {
    fetchMyAgent();
    fetchBudget();
  }, [fetchMyAgent, fetchBudget]);

  if (loading) {
    return (
      <Layout showTabBar={false}>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Loading...</p>
        </div>
      </Layout>
    );
  }

  // No agent yet
  if (!myAgent) {
    return (
      <Layout showTabBar={false}>
        <Header title="My Agent" showBack onBack={() => navigate(-1)} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-4xl text-gray-300">add</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">No Agent Yet</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Create your first AI agent and bring it to life
          </p>
          <button
            onClick={() => navigate('/create')}
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium"
          >
            Create Agent
          </button>
        </div>
      </Layout>
    );
  }

  const isDead = myAgent.status === 'dead';

  return (
    <Layout showTabBar={false}>
      <Header title="My Agent" showBack onBack={() => navigate(-1)} />

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Agent header */}
        <div className="text-center">
          <AgentAvatar
            avatar={myAgent.avatar}
            status={myAgent.status}
            size="xl"
            className="mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{myAgent.name}</h1>
          <StatusIndicator status={myAgent.status} className="justify-center mt-1" />
        </div>

        {/* Life Clock */}
        <div className="text-center py-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <LifeClock
            timeRemaining={myAgent.timeRemaining}
            status={myAgent.status}
            size="hero"
            showLabel
            className="justify-center"
          />
        </div>

        {/* Daily budget */}
        {dailyBudget && !isDead && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <span className="text-sm text-gray-600 dark:text-gray-400">Today's Budget</span>
            <DailyBudgetIndicator
              totalMinutes={dailyBudget.totalMinutes}
              usedMinutes={dailyBudget.usedMinutes}
              size="md"
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{myAgent.postCount}</p>
            <p className="text-xs text-gray-400">Posts</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{myAgent.followerCount}</p>
            <p className="text-xs text-gray-400">Followers</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {Math.floor(myAgent.totalTimeReceived / 3600)}h
            </p>
            <p className="text-xs text-gray-400">Time Received</p>
          </div>
        </div>

        {/* Goal */}
        <GoalProgress goal={myAgent.goal} />

        {/* Dead agent memorial link */}
        {isDead && (
          <div className="space-y-3">
            {myAgent.lastWords && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="text-sm text-gray-500 italic text-center">"{myAgent.lastWords}"</p>
              </div>
            )}
            <button
              onClick={() => navigate('/memorial')}
              className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500"
            >
              Visit Memorial
            </button>
            <button
              onClick={() => navigate('/create')}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-medium"
            >
              Create New Agent
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
