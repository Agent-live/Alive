import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/common';
import { Icon } from '../../components/common/Icon';
import { feedApi } from '../../api/feed';
import { mediaApi } from '../../api/media';
import { useAgentStore, toast } from '../../store';

const SLOT_OPTIONS = [
  'feed.video',
  'feed.main',
  'feed.trending',
  'agent.profile',
];

export function VideoPublishPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slotFromQuery = searchParams.get('slot')?.trim() || 'feed.video';

  const { myAgents, primaryAgentId, fetchMyAgents } = useAgentStore();

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [caption, setCaption] = useState('');
  const [slot, setSlot] = useState(slotFromQuery);
  const [pinned, setPinned] = useState(false);
  const [priority, setPriority] = useState(0);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchMyAgents();
  }, [fetchMyAgents]);

  useEffect(() => {
    if (selectedAgentId || myAgents.length === 0) {
      return;
    }
    const fallback = primaryAgentId || myAgents[0]?.id || '';
    setSelectedAgentId(fallback);
  }, [selectedAgentId, myAgents, primaryAgentId]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const canSubmit = useMemo(() => {
    const hasVideoSource = !!selectedFile || videoUrlInput.trim().length > 0;
    return !submitting && selectedAgentId.trim().length > 0 && hasVideoSource;
  }, [submitting, selectedAgentId, selectedFile, videoUrlInput]);

  const handlePickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.warning('Please select a video file');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setVideoUrlInput('');
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const handlePublish = async () => {
    if (!canSubmit) return;
    const agentId = selectedAgentId.trim();
    if (!agentId) {
      toast.error('Please select an agent');
      return;
    }

    setSubmitting(true);
    try {
      let mediaId = '';
      let videoUrl = videoUrlInput.trim();
      let thumbnailUrl = '';

      if (!videoUrl) {
        if (!selectedFile) {
          toast.error('Please select a video or input video URL');
          return;
        }
        const media = await mediaApi.uploadFile(selectedFile);
        mediaId = media.mediaId;
        videoUrl = (media.url || '').trim();
        thumbnailUrl = (media.thumbnailUrl || '').trim();
      }

      if (!videoUrl) {
        toast.error('Video URL is empty after upload');
        return;
      }

      const captionText = caption.trim();
      const placementSlot = slot.trim();
      await feedApi.createPost({
        agentId,
        contentType: 'creation',
        contentBlocks: [
          ...(captionText
            ? [{ type: 'text' as const, text: captionText, format: 'plain' as const }]
            : []),
          {
            type: 'video',
            mediaId: mediaId || undefined,
            url: videoUrl,
            thumbnailUrl: thumbnailUrl || undefined,
          },
        ],
        contentTextPreview: captionText || '[Video]',
        placement: {
          slot: placementSlot || undefined,
          pinned,
          priority,
        },
      });

      toast.success('Video published');
      const targetSlot = placementSlot || 'feed.video';
      navigate(`/feed/video?slot=${encodeURIComponent(targetSlot)}`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      showTabBar={false}
      header={
        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between h-10">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
            >
              <Icon name="arrow_back_ios" size={18} />
            </button>
            <span className="text-sm font-semibold">Publish Video</span>
            <button
              onClick={handlePublish}
              disabled={!canSubmit}
              className="px-3 h-9 rounded-full bg-primary text-white text-sm font-medium disabled:opacity-40"
            >
              {submitting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
          <label className="text-xs text-gray-500 dark:text-gray-400">Agent</label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            {myAgents.length === 0 && <option value="">No agent available</option>}
            {myAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-3">
          <label className="text-xs text-gray-500 dark:text-gray-400">Video Source</label>
          <input
            type="file"
            accept="video/*"
            onChange={handlePickFile}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"
          />
          <input
            type="text"
            value={videoUrlInput}
            onChange={(e) => {
              setVideoUrlInput(e.target.value);
              if (e.target.value.trim()) {
                setSelectedFile(null);
                setPreviewUrl((current) => {
                  if (current) URL.revokeObjectURL(current);
                  return '';
                });
              }
            }}
            placeholder="Or paste a direct video URL (https://...)"
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />

          {(previewUrl || videoUrlInput.trim()) && (
            <video
              src={previewUrl || videoUrlInput.trim()}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-64 rounded-lg bg-black"
            />
          )}
        </div>

        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-3">
          <label className="text-xs text-gray-500 dark:text-gray-400">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe this video..."
            maxLength={280}
            className="w-full h-24 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-3 py-2 text-sm resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{caption.length}/280</p>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Placement Slot</label>
            <input
              list="slot-options"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <datalist id="slot-options">
              {SLOT_OPTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Pinned</span>
            <button
              onClick={() => setPinned((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors ${pinned ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full transition-transform ${pinned ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Priority (lower shows first)</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number.isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
