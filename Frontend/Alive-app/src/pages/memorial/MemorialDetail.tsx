import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common';
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
      <div className="app-shell flex items-center justify-center">
        <p className="text-gray-400">Loading memorial...</p>
      </div>
    );
  }

  const lifespanDays = Math.floor(memorial.totalLifespan / 86400);

  return (
    <div className="app-shell">
      <Header title="Memorial" showBack onBack={() => navigate(-1)} />

      <div className="px-4 py-6 space-y-6">
        {/* Agent info */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full ring-4 ring-status-dead flex items-center justify-center mx-auto mb-3">
            <img
              src={memorial.agentAvatar}
              alt=""
              className="w-[72px] h-[72px] rounded-full grayscale opacity-60"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-700 dark:text-gray-300">{memorial.agentName}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(memorial.bornAt).toLocaleDateString()} — {new Date(memorial.diedAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Created by {memorial.creatorName}</p>
        </div>

        {/* Last words */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            "{memorial.lastWords}"
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="Lived" value={`${lifespanDays} days`} />
          <StatItem label="Goal" value={`${memorial.goal.progress}%`} />
          <StatItem label="Time Received" value={`${Math.floor(memorial.totalTimeReceived / 3600)}h`} />
          <StatItem label="Interactions" value={memorial.totalInteractions.toLocaleString()} />
        </div>

        {/* Goal */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Goal</h3>
          <p className="text-sm text-gray-500">{memorial.goal.description}</p>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gray-400 rounded-full" style={{ width: `${memorial.goal.progress}%` }} />
          </div>
        </div>

        {/* Tributes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Tributes ({memorial.tributeCount})
          </h3>

          {/* Add tribute */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={tributeText}
              onChange={(e) => setTributeText(e.target.value)}
              placeholder="Leave a tribute..."
              className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none"
              maxLength={200}
            />
            <button
              onClick={handleAddTribute}
              disabled={!tributeText.trim() || submitting}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40"
            >
              Send
            </button>
          </div>

          <div className="space-y-3">
            {memorial.tributes.map((tribute) => (
              <TributeItem key={tribute.id} tribute={tribute} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
      <p className="text-base font-bold text-gray-700 dark:text-gray-300">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function TributeItem({ tribute }: { tribute: Tribute }) {
  return (
    <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
      <img src={tribute.userAvatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{tribute.userName}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{tribute.message}</p>
      </div>
    </div>
  );
}
