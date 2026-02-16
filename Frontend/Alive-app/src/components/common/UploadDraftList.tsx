import { Icon } from './Icon';
import type { MessageAttachment } from '../../types/chat';

export interface UploadingDraftItem {
  id: string;
  name: string;
  mimeType: string;
  previewUrl?: string;
  progress: number;
  fileSize?: number;
}

interface UploadDraftListProps {
  pendingAttachments: MessageAttachment[];
  uploadingItem?: UploadingDraftItem | null;
  onRemoveAttachment: (mediaId: string) => void;
  removeTitle?: string;
  className?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const fixed = value >= 10 || idx === 0 ? 0 : 1;
  return `${value.toFixed(fixed)} ${units[idx]}`;
}

function kindFromMime(mimeType: string): 'image' | 'video' | 'audio' | 'file' {
  const mt = (mimeType || '').toLowerCase();
  if (mt.startsWith('image/')) return 'image';
  if (mt.startsWith('video/')) return 'video';
  if (mt.startsWith('audio/')) return 'audio';
  return 'file';
}

function iconByKind(kind: 'image' | 'video' | 'audio' | 'file'): string {
  if (kind === 'image') return 'image';
  if (kind === 'video') return 'movie';
  if (kind === 'audio') return 'graphic_eq';
  return 'description';
}

function kindLabel(kind: 'image' | 'video' | 'audio' | 'file'): string {
  if (kind === 'image') return 'Image';
  if (kind === 'video') return 'Video';
  if (kind === 'audio') return 'Audio';
  return 'File';
}

function fileTitle(att: MessageAttachment): string {
  if (att.fileName && att.fileName.trim()) return att.fileName.trim();
  const kind = kindFromMime(att.mimeType);
  return `${kindLabel(kind)}-${att.mediaId.slice(0, 8)}`;
}

function normalizeProgress(progress: number): number {
  const raw = Math.max(0, Math.min(100, progress));
  if (raw > 0 && raw < 0.1) return 0.1;
  if (raw >= 100) return 100;
  return raw;
}

function progressLabel(progress: number): string {
  const p = normalizeProgress(progress);
  if (p >= 100) return '100';
  if (p >= 10) return p.toFixed(0);
  return p.toFixed(1);
}

function Thumb({
  mimeType,
  previewUrl,
  thumbnailUrl,
  url,
}: {
  mimeType: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  url?: string;
}) {
  const kind = kindFromMime(mimeType);
  if (kind === 'image' && (previewUrl || thumbnailUrl || url)) {
    return (
      <img
        src={previewUrl || thumbnailUrl || url}
        alt=""
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
      <Icon name={iconByKind(kind)} size={20} className="text-gray-500 dark:text-gray-300" />
    </div>
  );
}

export function UploadDraftList({
  pendingAttachments,
  uploadingItem,
  onRemoveAttachment,
  removeTitle = 'Remove',
  className = '',
}: UploadDraftListProps) {
  if (pendingAttachments.length === 0 && !uploadingItem) return null;

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {uploadingItem && (
        <div className="relative w-full max-w-[420px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 px-3 py-2.5 pr-4">
          <div className="flex items-center gap-3 min-w-0">
            <Thumb mimeType={uploadingItem.mimeType} previewUrl={uploadingItem.previewUrl} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{uploadingItem.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <span>Uploading... {progressLabel(uploadingItem.progress)}%</span>
                {formatBytes(uploadingItem.fileSize) && <span>· {formatBytes(uploadingItem.fileSize)}</span>}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 bottom-0 w-1 rounded-r-2xl bg-primary/20 overflow-hidden">
            <div
              className="absolute left-0 bottom-0 w-full bg-primary transition-all duration-200 ease-out"
              style={{ height: `${normalizeProgress(uploadingItem.progress)}%` }}
            />
          </div>
        </div>
      )}

      {pendingAttachments.map((item) => {
        const kind = kindFromMime(item.mimeType);
        const sizeText = formatBytes(item.fileSize);
        return (
          <button
            key={item.mediaId}
            type="button"
            onClick={() => onRemoveAttachment(item.mediaId)}
            className="group relative w-full max-w-[420px] text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 px-3 py-2.5"
            title={removeTitle}
          >
            <div className="flex items-center gap-3 min-w-0 pr-5">
              <Thumb
                mimeType={item.mimeType}
                thumbnailUrl={item.thumbnailUrl}
                url={item.url}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{fileTitle(item)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {kindLabel(kind)}
                  {sizeText ? ` · ${sizeText}` : ''}
                </p>
              </div>
            </div>
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-black/60 text-white text-[10px] leading-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              x
            </span>
          </button>
        );
      })}
    </div>
  );
}
