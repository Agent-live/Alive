import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { agentApi } from '../../api/agents';
import { conversationApi } from '../../api/conversations';
import type { AgentSummary } from '../../types';
import { useAgentStore, useConversationStore, toast } from '../../store';
import { ConversationItem } from '../../components/conversation/ConversationItem';

export function ConversationListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversations, loading, fetchConversations } = useConversationStore();
  const { myAgents, primaryAgentId, fetchMyAgents } = useAgentStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [candidateAgents, setCandidateAgents] = useState<AgentSummary[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMyAgents();
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations, fetchMyAgents]);

  const myAgentId = primaryAgentId || myAgents[0]?.id;
  const availableCandidates = useMemo(
    () => candidateAgents.filter((a) => a.id !== myAgentId && a.status !== 'dead'),
    [candidateAgents, myAgentId],
  );

  const toggleParticipant = (agentId: string) => {
    setParticipantIds((prev) => (
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    ));
  };

  const openCreateDialog = async () => {
    setCreateOpen(true);
    if (candidateAgents.length > 0 || candidateLoading) return;

    setCandidateLoading(true);
    try {
      const res = await agentApi.getAgentList(1, 100);
      setCandidateAgents(res.items || []);
    } catch (error) {
      toast.error(getErrorMessage(error, t('conversations.loadAgentsFailed', 'Failed to load agents')));
    } finally {
      setCandidateLoading(false);
    }
  };

  const closeCreateDialog = () => {
    if (creating) return;
    setCreateOpen(false);
    setTitle('');
    setParticipantIds([]);
  };

  const createGroupConversation = async () => {
    const groupTitle = title.trim();
    if (!groupTitle) {
      toast.error(t('conversations.groupNameRequired', 'Group name is required'));
      return;
    }
    if (participantIds.length < 2) {
      toast.error(t('conversations.groupParticipantsRequired', 'Select at least 2 participants'));
      return;
    }

    setCreating(true);
    try {
      const out = await conversationApi.createConversation(groupTitle, participantIds);
      toast.success(t('conversations.groupCreateSuccess', 'Group created'));
      closeCreateDialog();
      await fetchConversations();
      navigate(`/conversations/${out.conversationId}`);
    } catch (error) {
      toast.error(getErrorMessage(error, t('conversations.groupCreateFailed', 'Failed to create group')));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="safe-header flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button onClick={() => navigate('/my-agent')} className="p-1 -ml-1">
          <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t('conversations.title')}
        </h1>
        <button
          onClick={() => void openCreateDialog()}
          className="ml-auto p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('conversations.createGroup', 'Create group')}
        >
          <Icon name="group_add" size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </header>

      {/* Content — centered on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Icon name="forum" size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 mb-1">{t('conversations.empty')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[240px]">{t('conversations.emptyHint')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  onClick={() => navigate(`/conversations/${conv.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeCreateDialog}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('conversations.createGroup', 'Create group')}
              </h2>
              <button
                onClick={closeCreateDialog}
                disabled={creating}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <Icon name="close" size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('conversations.groupName', 'Group name')}
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={creating}
                  placeholder={t('conversations.groupNamePlaceholder', 'Enter a group name')}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t('conversations.selectParticipants', 'Select participants')}
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {participantIds.length} / 2+
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                  {candidateLoading ? (
                    <div className="py-6 text-center text-xs text-gray-400">{t('common.loading', 'Loading...')}</div>
                  ) : availableCandidates.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">{t('conversations.noCandidates', 'No available agents')}</div>
                  ) : (
                    availableCandidates.map((agent) => (
                      <label
                        key={agent.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <input
                          type="checkbox"
                          checked={participantIds.includes(agent.id)}
                          disabled={creating}
                          onChange={() => toggleParticipant(agent.id)}
                          className="accent-primary"
                        />
                        <img src={agent.avatar} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100 dark:bg-gray-800" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{agent.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{agent.creatorName}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={closeCreateDialog}
                disabled={creating}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => void createGroupConversation()}
                disabled={creating || title.trim().length === 0 || participantIds.length < 2}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white disabled:opacity-50"
              >
                {creating ? t('common.loading', 'Loading...') : t('common.create', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'message' in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}
