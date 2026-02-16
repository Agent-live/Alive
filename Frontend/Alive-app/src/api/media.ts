import { api } from './client';
import { tokenStorage } from '../utils/storage';

export interface UploadURLPayload {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface UploadURLResponse {
  mediaId: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface MediaFile {
  mediaId: string;
  status: string;
  url?: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface UploadFileOptions {
  keepOriginalImage?: boolean;
  onProgress?: (progress: number) => void;
}

const RESUMABLE_CHUNK_SIZE = 512 * 1024; // 512 KiB (smoother progress updates)
const MAX_RESUMABLE_RETRIES = 3;
const IMAGE_MAX_DIMENSION = 2560;
const IMAGE_QUALITY = 0.9;
const IMAGE_SKIP_COMPRESSION_MAX_BYTES = 2 * 1024 * 1024; // 2MB

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

async function getUploadURL(payload: UploadURLPayload): Promise<UploadURLResponse> {
  return api.post<UploadURLResponse>('/media/upload-url', payload);
}

async function confirmUpload(mediaId: string): Promise<MediaFile> {
  return api.post<MediaFile>(`/media/${mediaId}/confirm`);
}

async function getMedia(mediaId: string): Promise<MediaFile> {
  return api.get<MediaFile>(`/media/${mediaId}`);
}

function sameOrigin(url: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const resolved = new URL(url, window.location.href);
    return resolved.origin === window.location.origin;
  } catch {
    return false;
  }
}

function buildAuthHeaderIfNeeded(uploadUrl: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (token && sameOrigin(uploadUrl)) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function throwUploadError(response: Response): Promise<never> {
  const bodyText = await response.text().catch(() => '');
  let bodyMessage = bodyText.trim();
  if (bodyMessage.startsWith('{')) {
    try {
      const parsed = JSON.parse(bodyMessage) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        bodyMessage = parsed.message.trim();
      }
    } catch {
      // keep raw body text
    }
  }
  if (!response.ok) {
    if (response.status === 413) {
      const maxHeader = response.headers.get('x-max-upload-bytes') || response.headers.get('X-Max-Upload-Bytes');
      const maxBytes = maxHeader ? Number.parseInt(maxHeader, 10) : NaN;
      if (Number.isFinite(maxBytes) && maxBytes > 0) {
        throw new Error(`File is too large. Max upload size is ${formatBytes(maxBytes)}.`);
      }
      throw new Error(bodyMessage || 'File is too large.');
    }
    const suffix = bodyMessage ? `: ${bodyMessage}` : '';
    throw new Error(`Storage upload failed (${response.status})${suffix}`);
  }
  throw new Error('Storage upload failed');
}

function parseOffsetHeader(response: Response): number {
  const raw = response.headers.get('x-upload-offset') || response.headers.get('X-Upload-Offset');
  if (!raw) return NaN;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return NaN;
  return parsed;
}

function parseCompleteHeader(response: Response): boolean {
  const raw = (response.headers.get('x-upload-complete') || response.headers.get('X-Upload-Complete') || '').toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

async function queryUploadStatus(uploadUrl: string, authHeaders: Record<string, string>): Promise<{ offset: number; complete: boolean }> {
  const response = await fetch(uploadUrl, {
    method: 'HEAD',
    headers: authHeaders,
  });
  if (!response.ok) {
    await throwUploadError(response);
  }
  const offset = parseOffsetHeader(response);
  return {
    offset: Number.isFinite(offset) ? offset : 0,
    complete: parseCompleteHeader(response),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function uploadResumableToStorage(
  uploadUrl: string,
  file: File,
  authHeaders: Record<string, string>,
  onProgress?: (progress: number) => void,
): Promise<void> {
  let offset = 0;
  let done = false;
  try {
    const status = await queryUploadStatus(uploadUrl, authHeaders);
    offset = Math.max(0, Math.min(file.size, status.offset));
    done = status.complete || offset >= file.size;
  } catch {
    // Fall back to starting from zero if status probing fails.
    offset = 0;
    done = false;
  }

  if (done) {
    onProgress?.(1);
    return;
  }

  onProgress?.(file.size > 0 ? offset / file.size : 0);
  let retries = 0;

  while (offset < file.size) {
    const end = Math.min(offset + RESUMABLE_CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, end);
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': file.type || 'application/octet-stream',
          'X-Upload-Offset': String(offset),
          'X-Upload-Complete': end >= file.size ? '1' : '0',
        },
        body: chunk,
      });

      if (response.ok) {
        const serverOffset = parseOffsetHeader(response);
        offset = Number.isFinite(serverOffset) ? Math.max(serverOffset, end) : end;
        retries = 0;
        onProgress?.(file.size > 0 ? Math.min(1, offset / file.size) : 1);
        continue;
      }

      if (response.status === 409) {
        const serverOffset = parseOffsetHeader(response);
        if (Number.isFinite(serverOffset)) {
          offset = Math.max(0, Math.min(file.size, serverOffset));
          onProgress?.(file.size > 0 ? offset / file.size : 0);
          continue;
        }
      }

      await throwUploadError(response);
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes('file is too large') || /storage upload failed \(4\d\d\)/i.test(err.message)) {
          throw err;
        }
      }
      retries += 1;
      if (retries > MAX_RESUMABLE_RETRIES) {
        throw err;
      }
      await sleep(250 * retries);
      try {
        const status = await queryUploadStatus(uploadUrl, authHeaders);
        offset = Math.max(0, Math.min(file.size, status.offset));
        if (status.complete || offset >= file.size) {
          onProgress?.(1);
          return;
        }
      } catch {
        // keep previous offset and retry current chunk
      }
    }
  }

  onProgress?.(1);
}

async function uploadWholeFileToStorage(
  uploadUrl: string,
  file: File,
  authHeaders: Record<string, string>,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...authHeaders,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!response.ok) {
    await throwUploadError(response);
  }
}

async function uploadToStorage(uploadUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
  const authHeaders = buildAuthHeaderIfNeeded(uploadUrl);
  if (sameOrigin(uploadUrl)) {
    await uploadResumableToStorage(uploadUrl, file, authHeaders, onProgress);
    return;
  }
  await uploadWholeFileToStorage(uploadUrl, file, authHeaders);
}

function outputMimeTypeForCompressedImage(file: File): string {
  const mt = (file.type || '').toLowerCase();
  if (mt === 'image/webp') return 'image/webp';
  if (mt === 'image/png') return 'image/png';
  return 'image/jpeg';
}

function renameImageFile(fileName: string, mimeType: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '') || 'image';
  if (mimeType === 'image/png') return `${base}.png`;
  if (mimeType === 'image/webp') return `${base}.webp`;
  return `${base}.jpg`;
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

async function compressImageFile(file: File): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file;
  const objectURL = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to decode image'));
      image.src = objectURL;
    });

    const sourceW = img.naturalWidth || img.width;
    const sourceH = img.naturalHeight || img.height;
    if (!sourceW || !sourceH) return file;
    if (Math.max(sourceW, sourceH) <= IMAGE_MAX_DIMENSION && file.size <= IMAGE_SKIP_COMPRESSION_MAX_BYTES) {
      return file;
    }

    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(sourceW, sourceH));
    const targetW = Math.max(1, Math.round(sourceW * scale));
    const targetH = Math.max(1, Math.round(sourceH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const mimeType = outputMimeTypeForCompressedImage(file);
    const quality = mimeType === 'image/png' ? undefined : IMAGE_QUALITY;
    const blob = await canvasToBlob(canvas, mimeType, quality);
    if (!blob || blob.size <= 0) return file;
    if (blob.size >= file.size * 0.98 && targetW === sourceW && targetH === sourceH) return file;

    return new File([blob], renameImageFile(file.name, mimeType), {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}

async function prepareUploadFile(file: File, options?: UploadFileOptions): Promise<File> {
  const isImage = file.type.toLowerCase().startsWith('image/');
  if (!isImage || options?.keepOriginalImage) {
    return file;
  }
  return compressImageFile(file);
}

async function uploadFile(file: File, options?: UploadFileOptions): Promise<MediaFile> {
  const uploadFileObject = await prepareUploadFile(file, options);
  const upload = await getUploadURL({
    fileName: uploadFileObject.name,
    mimeType: uploadFileObject.type || 'application/octet-stream',
    fileSize: uploadFileObject.size,
  });

  await uploadToStorage(upload.uploadUrl, uploadFileObject, options?.onProgress);

  return confirmUpload(upload.mediaId);
}

export const mediaApi = {
  getUploadURL,
  confirmUpload,
  getMedia,
  uploadFile,
};
