import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface ImageUploadChoiceRequest {
  fileName: string;
  fileSize: number;
  previewUrl?: string;
}

interface ImageUploadChoiceSheetProps extends ImageUploadChoiceRequest {
  open: boolean;
  onSelectCompressed: () => void;
  onSelectOriginal: () => void;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
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

function ImageUploadChoiceSheet({
  open,
  fileName,
  fileSize,
  previewUrl,
  onSelectCompressed,
  onSelectOriginal,
  onClose,
}: ImageUploadChoiceSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close image upload options"
      />

      <div className="absolute inset-x-0 bottom-0 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="h-1 w-9 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">选择发送方式</p>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="image" size={20} className="text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{fileName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(fileSize)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onSelectCompressed}
                className="w-full rounded-xl border border-emerald-300/50 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-3 text-left flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon name="photo_size_select_large" size={18} className="text-emerald-600 dark:text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">压缩后上传（推荐）</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">高清压缩，更快发送（最长边 2560px）</p>
                </div>
                <Icon name="chevron_right" size={18} className="text-emerald-600 dark:text-emerald-300" />
              </button>

              <button
                type="button"
                onClick={onSelectOriginal}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-3 text-left flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="hdr_strong" size={18} className="text-gray-700 dark:text-gray-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">原图上传</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">保留完整画质，体积 {formatBytes(fileSize)}</p>
                </div>
                <Icon name="chevron_right" size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 mx-auto block w-full max-w-md rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 py-2.5 text-sm text-gray-700 dark:text-gray-300"
        >
          取消
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function useImageUploadChoice() {
  const [choiceState, setChoiceState] = useState<(ImageUploadChoiceRequest & { open: boolean }) | null>(null);
  const resolverRef = useRef<((choice: boolean | null) => void) | null>(null);

  const resolveAndClose = useCallback((choice: boolean | null) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setChoiceState(null);
    resolver?.(choice);
  }, []);

  const requestChoice = useCallback((request: ImageUploadChoiceRequest): Promise<boolean | null> => {
    if (resolverRef.current) {
      resolverRef.current(null);
      resolverRef.current = null;
    }
    setChoiceState({ ...request, open: true });
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => () => {
    if (resolverRef.current) {
      resolverRef.current(null);
      resolverRef.current = null;
    }
  }, []);

  const sheetNode = (
    <ImageUploadChoiceSheet
      open={Boolean(choiceState?.open)}
      fileName={choiceState?.fileName || ''}
      fileSize={choiceState?.fileSize || 0}
      previewUrl={choiceState?.previewUrl}
      onSelectCompressed={() => resolveAndClose(false)}
      onSelectOriginal={() => resolveAndClose(true)}
      onClose={() => resolveAndClose(null)}
    />
  );

  return {
    requestChoice,
    sheetNode,
  };
}
