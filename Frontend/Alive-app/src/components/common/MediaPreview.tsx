import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface VideoPreviewProps {
  src: string;
  onClose: () => void;
}

/**
 * Full-screen video player overlay.
 */
export function VideoPreview({ src, onClose }: VideoPreviewProps) {
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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        style={{ top: 'calc(max(var(--safe-area-inset-top), 24px) + 12px)' }}
        onClick={onClose}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
      </button>

      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          src={src}
          controls
          autoPlay
          className="max-w-full max-h-[85vh] rounded-lg"
        />
      </div>
    </div>,
    document.body,
  );
}
