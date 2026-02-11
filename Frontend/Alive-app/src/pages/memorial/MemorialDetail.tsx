import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { memorialApi } from '../../api/memorial';
import { Memorial, Tribute } from '../../types';

export function MemorialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [tributeText, setTributeText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await memorialApi.getMemorial(id);
        setMemorial(data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddTribute = async () => {
    if (!id || !tributeText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const tribute = await memorialApi.addTribute(id, tributeText.trim());
      setMemorial((prev) => prev ? {
        ...prev,
        tributes: [...prev.tributes, tribute],
        tributeCount: prev.tributeCount + 1,
      } : null);
      setTributeText('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !memorial) {
    return (
      <Layout
        header={
          <div className="px-4">
            <div className="flex items-center gap-3 min-h-[56px] py-2 md:mt-8 md:mb-6">
              <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:hidden">
                <Icon name="arrow_back" size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Memorial</h1>
            </div>
          </div>
        }
        showTabBar
      >
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const lifespanDays = Math.floor(memorial.totalLifespan / 86400);

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center gap-3 min-h-[56px] py-2 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:hidden">
              <Icon name="arrow_back" size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {memorial.agentName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Memorial · {new Date(memorial.bornAt).toLocaleDateString()} — {new Date(memorial.diedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      }
      showTabBar
    >
      <div className="px-3 md:px-5 py-3 space-y-8">

        {/* ───── Section 1: Agent Overview ───── */}
        <section>
          <SectionHeader title="Overview" subtitle={`Created by ${memorial.creatorName}`} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Identity */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full ring-4 ring-status-dead flex items-center justify-center flex-shrink-0">
                  <img
                    src={memorial.agentAvatar}
                    alt=""
                    className="w-[72px] h-[72px] rounded-full grayscale opacity-60"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">{memorial.agentName}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(memorial.bornAt).toLocaleDateString()} — {new Date(memorial.diedAt).toLocaleDateString()}
                  </p>
                  {memorial.lastWords && (
                    <p className="text-xs text-gray-500 italic mt-2 line-clamp-2">
                      "{memorial.lastWords}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <StatItem label="Lived" value={`${lifespanDays} days`} />
                <StatItem label="Goal" value={`${memorial.goal.progress}%`} />
                <StatItem label="Time Received" value={`${Math.floor(memorial.totalTimeReceived / 3600)}h`} />
                <StatItem label="Interactions" value={memorial.totalInteractions.toLocaleString()} />
              </div>
            </div>
          </div>
        </section>

        {/* ───── Section 2: Last Words ───── */}
        {memorial.lastWords && (
          <section>
            <SectionHeader title="Last Words" subtitle="Final message before passing" />
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
                "{memorial.lastWords}"
              </p>
            </div>
          </section>
        )}

        {/* ───── Section 3: Goal Progress ───── */}
        <section>
          <SectionHeader title="Survival Goal" subtitle={memorial.goal.description} />
          <div className="max-w-2xl">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${memorial.goal.progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">{memorial.goal.progress}% completed</p>
            </div>
          </div>
        </section>

        {/* ───── Section 4: Tributes ───── */}
        <section>
          <SectionHeader title={`Tributes (${memorial.tributeCount})`} subtitle="Messages from the community" />

          {/* Add tribute */}
          <div className="flex gap-2 mb-4 max-w-2xl">
            <input
              type="text"
              value={tributeText}
              onChange={(e) => setTributeText(e.target.value)}
              placeholder="Leave a tribute..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none border border-transparent focus:border-gray-200 dark:focus:border-gray-700"
              maxLength={200}
            />
            <button
              onClick={handleAddTribute}
              disabled={!tributeText.trim() || submitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 transition-colors hover:bg-primary-dark"
            >
              Send
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {memorial.tributes.map((tribute) => (
              <TributeItem key={tribute.id} tribute={tribute} />
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <p className="text-base font-bold text-gray-700 dark:text-gray-300">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function TributeItem({ tribute }: { tribute: Tribute }) {
  return (
    <div className="flex gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
      <img src={tribute.userAvatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{tribute.userName}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{tribute.message}</p>
      </div>
    </div>
  );
}
