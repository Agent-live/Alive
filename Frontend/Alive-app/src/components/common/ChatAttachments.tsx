import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { VideoPreview } from './MediaPreview';
import type { MessageAttachment } from '../../types/chat';
import { resolveMediaResourceUrl } from '../../api/media';

interface ChatAttachmentsProps {
  attachments?: MessageAttachment[];
}

const VIDEO_PREVIEW_SEEK_SECONDS = 0.1;
const VIDEO_PREVIEW_CAPTURE_TIMEOUT_MS = 5000;

function withVideoTimeFragment(url: string, seconds = VIDEO_PREVIEW_SEEK_SECONDS): string {
  const clean = url.replace(/#.*$/, '');
  return `${clean}#t=${seconds}`;
}

async function captureVideoFrame(url: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    let done = false;

    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(value);
    };

    const capture = () => {
      if (!video.videoWidth || !video.videoHeight) {
        finish(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        finish(null);
        return;
      }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        finish(null);
      }
    };

    const onLoadedData = () => capture();
    const onError = () => finish(null);

    const timer = window.setTimeout(() => finish(null), VIDEO_PREVIEW_CAPTURE_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('error', onError);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('error', onError);
    video.src = withVideoTimeFragment(url);
    video.load();
  });
}

export function ChatAttachments({ attachments }: ChatAttachmentsProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const renderItems = () =>
    attachments.map((att) => {
      const resolvedUrl = resolveMediaResourceUrl(att.url) || att.url;
      const resolvedThumbnailUrl = resolveMediaResourceUrl(att.thumbnailUrl) || att.thumbnailUrl;
      const mime = att.mimeType?.toLowerCase() || '';

      if (mime.startsWith('image/')) {
        return (
          <button
            key={att.mediaId}
            type="button"
            onClick={() => setImageSrc(resolvedUrl)}
            className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/10"
          >
            <img
              src={resolvedThumbnailUrl || resolvedUrl}
              alt="attachment"
              className="block max-h-56 w-auto object-cover"
              loading="lazy"
            />
          </button>
        );
      }

      if (mime.startsWith('video/')) {
        return (
          <InlineVideo
            key={att.mediaId}
            att={{ ...att, url: resolvedUrl, thumbnailUrl: resolvedThumbnailUrl }}
            onFullscreen={() => setVideoSrc(resolvedUrl)}
          />
        );
      }

      if (mime.startsWith('audio/')) {
        return <InlineAudio key={att.mediaId} att={{ ...att, url: resolvedUrl, thumbnailUrl: resolvedThumbnailUrl }} />;
      }

      return (
        <a
          key={att.mediaId}
          href={resolvedUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 bg-black/10 dark:bg-white/10 text-[12px] break-all"
        >
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>description</span>
          {att.mimeType || 'file'}
        </a>
      );
    });

  return (
    <>
      <div className="space-y-1.5 mb-1.5">
        {renderItems()}
      </div>
      {imageSrc && <ImagePreview src={imageSrc} onClose={() => setImageSrc(null)} />}
      {videoSrc && <VideoPreview src={videoSrc} onClose={() => setVideoSrc(null)} />}
    </>
  );
}

/* ─── Inline Video Player ─── */

function InlineVideo({ att, onFullscreen }: { att: MessageAttachment; onFullscreen: () => void }) {
  const [frameDataUrl, setFrameDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (att.thumbnailUrl || !att.url) {
      setFrameDataUrl(null);
      return () => {
        cancelled = true;
      };
    }

    captureVideoFrame(att.url).then((dataUrl) => {
      if (cancelled) return;
      setFrameDataUrl(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [att.thumbnailUrl, att.url]);

  const previewImage = att.thumbnailUrl || frameDataUrl;

  return (
    <button
      type="button"
      onClick={onFullscreen}
      className="group relative block rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-w-[280px] text-left"
      aria-label="Open video preview"
    >
      {previewImage ? (
        <img
          src={previewImage}
          alt="video preview"
          className="pointer-events-none block w-full max-h-56 object-cover bg-black"
          loading="lazy"
        />
      ) : (
        <video
          src={withVideoTimeFragment(att.url)}
          preload="auto"
          playsInline
          muted
          className="pointer-events-none block w-full max-h-56 object-cover bg-black"
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="w-11 h-11 rounded-full bg-black/55 flex items-center justify-center backdrop-blur-sm">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>play_arrow</span>
        </span>
      </div>
    </button>
  );
}

/* ─── Inline Audio Player ─── */

function InlineAudio({ att }: { att: MessageAttachment }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onMeta = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    const onEnd = () => { setPlaying(false); setCurrent(0); };

    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-black/5 dark:bg-white/10 min-w-[180px] max-w-[260px]">
      <audio ref={audioRef} src={att.url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
          {playing ? 'pause' : 'play_arrow'}
        </span>
      </button>
      <div className="flex-1 min-w-0">
        {/* Waveform-style progress bar */}
        <div
          className="relative h-5 flex items-center cursor-pointer"
          onClick={handleSeek}
        >
          {/* Background bars */}
          <div className="absolute inset-0 flex items-center gap-[2px]">
            {Array.from({ length: 20 }).map((_, i) => {
              const h = [3, 6, 10, 14, 8, 12, 16, 10, 7, 14, 18, 12, 9, 15, 11, 7, 13, 10, 6, 4][i];
              const filled = pct >= ((i + 1) / 20) * 100;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    filled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ height: h }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">{fmt(current)}</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90" onClick={onClose}>
      <button
        className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        style={{ top: 'calc(max(var(--safe-area-inset-top), 24px) + 12px)' }}
        onClick={onClose}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
      </button>
      <div className="max-w-[92vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="preview" className="max-w-full max-h-[90vh] rounded-lg object-contain" />
      </div>
    </div>,
    document.body,
  );
}
