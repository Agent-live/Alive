import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/common/Icon';
import { skillShopApi } from '../../api';
import { useAgentStore, toast } from '../../store';
import type { SkillShopCategory, SkillShopDetailResp, SkillShopItem } from '../../api/skillShop';

const badgeClass = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium';

const categoryBadgeColors = [
  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300',
];

function colorForCategory(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return categoryBadgeColors[h % categoryBadgeColors.length]!;
}

export function SkillShopTab() {
  const { t } = useTranslation();
  const { myAgents, fetchMyAgents } = useAgentStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<SkillShopCategory[]>([]);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<SkillShopItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SkillShopDetailResp | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailReqSeq = useRef(0);
  const [teachAgentId, setTeachAgentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search to avoid hammering the backend on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => setQ(qInput.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [qInput]);

  const canTeach = useMemo(() => !!teachAgentId, [teachAgentId]);

  const fetchPage = async (nextPage: number, mode: 'replace' | 'append') => {
    setLoading(true);
    try {
      const res = await skillShopApi.listSkillShop({
        q: q || undefined,
        category: activeCategory === 'all' ? undefined : activeCategory,
        page: nextPage,
        pageSize: 60,
        includeInstalled: true,
      });
      setCategories(res.categories || []);
      setHasMore(res.hasMore);
      setTotal(res.total);
      setPage(res.page);
      setItems((prev) => (mode === 'append' ? [...prev, ...res.items] : res.items));
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load skills';
      toast.error(message);
      setItems([]);
      setHasMore(false);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, q]);

  const openDetail = async (slug: string) => {
    const reqId = ++detailReqSeq.current;
    setTeachAgentId(null);
    setSelected(null);
    setDetailLoading(true);
    try {
      const res = await skillShopApi.getSkillShop(slug, { includeReadme: true });
      if (detailReqSeq.current !== reqId) return;
      setSelected(res);
      // Ensure we have agent list if user wants to teach right away.
      if (myAgents.length === 0) fetchMyAgents();
    } catch (e) {
      if (detailReqSeq.current !== reqId) return;
      const message = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load skill';
      toast.error(message);
    } finally {
      if (detailReqSeq.current !== reqId) return;
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    detailReqSeq.current += 1; // invalidate in-flight detail requests
    setSelected(null);
    setTeachAgentId(null);
    setDetailLoading(false);
  };

  const installToLessons = async (slug: string) => {
    setActionLoading(true);
    try {
      await skillShopApi.installSkillShop(slug);
      toast.success('Added to lessons');
      setItems((prev) => prev.map((it) => (it.slug === slug ? { ...it, installed: true } : it)));
      setSelected((prev) => (prev && prev.slug === slug ? { ...prev, installed: true } : prev));
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Install failed';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const teachToAgent = async (slug: string, agentId: string) => {
    setActionLoading(true);
    try {
      await skillShopApi.installSkillShop(slug, agentId);
      toast.success(t('profile.teachAgent', { name: myAgents.find((a) => a.id === agentId)?.name || '' }));
      setItems((prev) => prev.map((it) => (it.slug === slug ? { ...it, installed: true } : it)));
      closeDetail();
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Teach failed';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Search */}
      <div className="px-3 md:px-5 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2">
          <Icon name="search" size={18} className="text-gray-400" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={t('common.search')}
            className="w-full bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
          />
          {(qInput || q) && (
            <button
              onClick={() => setQInput('')}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title={t('common.close')}
            >
              <Icon name="close" size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 px-3 md:px-5 pb-3 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveCategory('all')}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
            ${activeCategory === 'all'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          <Icon name="apps" size={14} />
          {t('common.all')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${activeCategory === cat.key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <span className={`w-2 h-2 rounded-full ${colorForCategory(cat.key)}`} />
            {cat.key}
            <span className="text-[10px] opacity-70 tabular-nums">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Skill cards grid */}
      <div className="px-3 md:px-5 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((skill) => (
          <div
            key={skill.slug}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
          >
            {/* Category badge + status */}
            <div className="flex items-center justify-between mb-2.5">
              <span className={`${badgeClass} ${colorForCategory(skill.category)}`}>
                {skill.category}
              </span>
              <div className="flex items-center gap-1.5">
                {skill.bundled && (
                  <span className={`${badgeClass} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`}>
                    <Icon name="verified" size={12} />
                    Bundled
                  </span>
                )}
                {skill.featured && (
                  <span className={`${badgeClass} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>
                    <Icon name="star" size={12} />
                    Featured
                  </span>
                )}
                {skill.installed && (
                  <span className={`${badgeClass} bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}>
                    <Icon name="check" size={12} />
                    Installed
                  </span>
                )}
              </div>
            </div>

            {/* Skill name */}
            <button
              onClick={() => openDetail(skill.slug)}
              className="text-left w-full"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 hover:underline">
                {skill.name}
              </h3>
            </button>

            {/* Description (2-line clamp) */}
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {skill.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => openDetail(skill.slug)}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
              >
                View
              </button>
              <button
                disabled={!!skill.installed || actionLoading}
                onClick={() => installToLessons(skill.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  skill.installed
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {skill.installed ? 'Installed' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">{t('discover.noSkills')}</p>
        </div>
      )}

      {/* Load more */}
      {items.length > 0 && hasMore && (
        <div className="px-3 md:px-5 pb-10">
          <button
            onClick={() => fetchPage(page + 1, 'append')}
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              loading
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {loading ? t('common.loading') : `Load more (${items.length}/${total})`}
          </button>
        </div>
      )}

      {/* Detail modal */}
      {(detailLoading || selected) && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={closeDetail}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full md:max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                    {selected?.name || '…'}
                  </h2>
                  {selected?.bundled && (
                    <span className={`${badgeClass} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`}>
                      <Icon name="verified" size={12} />
                      Bundled
                    </span>
                  )}
                  {selected?.featured && (
                    <span className={`${badgeClass} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}>
                      <Icon name="star" size={12} />
                      Featured
                    </span>
                  )}
                  {selected?.installed && (
                    <span className={`${badgeClass} bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}>
                      <Icon name="check" size={12} />
                      Installed
                    </span>
                  )}
                </div>
                {selected?.category && (
                  <div className="mt-1">
                    <span className={`${badgeClass} ${colorForCategory(selected.category)}`}>{selected.category}</span>
                  </div>
                )}
              </div>
              <button onClick={closeDetail} className="p-1.5 -mr-1 -mt-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Icon name="close" size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selected?.description && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected?.url && (
                <div className="flex items-center gap-2 text-xs">
                  <Icon name="link" size={14} className="text-gray-400" />
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    GitHub
                  </a>
                </div>
              )}

              {detailLoading && (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">{t('common.loading')}</p>
                </div>
              )}

              {!detailLoading && selected?.readme && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selected.readme}
                </div>
              )}

              {!detailLoading && !selected?.readme && (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No details available.</p>
                </div>
              )}

              {/* Teach to agent */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('profile.teachToAgent')}</h3>
                {myAgents.length === 0 ? (
                  <p className="text-sm text-gray-400">No agents.</p>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {myAgents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setTeachAgentId(teachAgentId === a.id ? null : a.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
                          teachAgentId === a.id
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <img src={a.avatar} alt="" className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800" />
                        {a.name}
                        {teachAgentId === a.id && <Icon name="check" size={14} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <button
                disabled={actionLoading || !!selected?.installed}
                onClick={() => selected && installToLessons(selected.slug)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  selected?.installed || actionLoading
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon name="add" size={16} />
                {selected?.installed ? 'Installed' : 'Add to lessons'}
              </button>
              <button
                disabled={!selected || !canTeach || actionLoading}
                onClick={() => selected && teachAgentId && teachToAgent(selected.slug, teachAgentId)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  selected && canTeach && !actionLoading
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                <Icon name="school" size={16} />
                {t('profile.teachAgent', { name: myAgents.find((a) => a.id === teachAgentId)?.name || '' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
