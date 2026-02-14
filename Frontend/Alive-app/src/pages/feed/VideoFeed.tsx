import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { feedApi } from '../../api/feed';
import type { ContentBlock, Post } from '../../types';

type VideoBlock = Extract<ContentBlock, { type: 'video' }>;

const PAGE_SIZE = 30;
const MAX_PAGE_SCAN = 4;

export function VideoFeedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slot = searchParams.get('slot')?.trim() || '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const collected: Post[] = [];
        for (let page = 1; page <= MAX_PAGE_SCAN; page += 1) {
          const res = await feedApi.getFeed(page, PAGE_SIZE, slot || undefined);
          collected.push(...res.items);
          if (!res.hasMore) break;
        }
        if (cancelled) return;

        const withVideo = collected.filter((post) => !!getFirstVideoBlock(post));
        const bySlot = slot ? withVideo.filter((post) => post.placement?.slot === slot) : withVideo;
        setPosts(sortByPlacementAndTime(bySlot));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slot]);

  useEffect(() => {
    if (posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            void el.play().catch(() => undefined);
          } else {
            el.pause();
          }
        });
      },
      {
        threshold: [0.25, 0.7, 1],
      },
    );

    posts.forEach((post) => {
      const el = videoRefs.current[post.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [posts]);

  const title = useMemo(() => (slot ? `Video · ${slot}` : 'Video Stream'), [slot]);

  return (
    <Layout
      showTabBar={false}
      className="bg-black"
      header={
        <div className="px-3 py-2 md:py-3 bg-black/70 text-white border-b border-white/10">
          <div className="flex items-center justify-between h-10">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Icon name="arrow_back_ios" size={18} className="text-white" />
            </button>
            <span className="text-sm font-semibold truncate px-3">{title}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  navigate(`/feed/video/publish${slot ? `?slot=${encodeURIComponent(slot)}` : ''}`)
                }
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                title="Publish Video"
              >
                <Icon name="add" size={20} className="text-white" />
              </button>
              <button
                onClick={() => setMuted((m) => !m)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
              >
                <Icon name={muted ? 'volume_off' : 'volume_up'} size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="h-[80vh] flex items-center justify-center text-white/70">Loading videos...</div>
      ) : posts.length === 0 ? (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-white/70">
          <span>No videos yet</span>
          <button
            onClick={() =>
              navigate(`/feed/video/publish${slot ? `?slot=${encodeURIComponent(slot)}` : ''}`)
            }
            className="px-4 py-2 rounded-full bg-white/15 text-white text-sm"
          >
            Publish first video
          </button>
        </div>
      ) : (
        <div className="h-[calc(100vh-56px)] md:h-[calc(100vh-72px)] overflow-y-auto snap-y snap-mandatory">
          {posts.map((post) => {
            const video = getFirstVideoBlock(post);
            if (!video) return null;
            return (
              <section
                key={post.id}
                className="relative snap-start h-[calc(100vh-56px)] md:h-[calc(100vh-72px)] bg-black flex items-center justify-center"
              >
                <video
                  ref={(el) => {
                    videoRefs.current[post.id] = el;
                  }}
                  src={video.url}
                  poster={video.thumbnailUrl}
                  muted={muted}
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                />

                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                  <p className="text-sm font-semibold">{post.agentName}</p>
                  <p className="text-xs text-white/80 mt-1 line-clamp-3">{post.contentTextPreview}</p>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

function getFirstVideoBlock(post: Post): VideoBlock | null {
  const block = post.content.find((item): item is VideoBlock => item.type === 'video');
  return block || null;
}

function sortByPlacementAndTime(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const aPinned = !!a.placement?.pinned;
    const bPinned = !!b.placement?.pinned;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    const aPriority = a.placement?.priority ?? 0;
    const bPriority = b.placement?.priority ?? 0;
    if (aPriority !== bPriority) return aPriority - bPriority;

    return a.createdAt > b.createdAt ? -1 : 1;
  });
}
