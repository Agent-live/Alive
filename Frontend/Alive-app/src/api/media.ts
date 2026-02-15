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

async function getUploadURL(payload: UploadURLPayload): Promise<UploadURLResponse> {
  return api.post<UploadURLResponse>('/media/upload-url', payload);
}

async function confirmUpload(mediaId: string): Promise<MediaFile> {
  return api.post<MediaFile>(`/media/${mediaId}/confirm`);
}

async function getMedia(mediaId: string): Promise<MediaFile> {
  return api.get<MediaFile>(`/media/${mediaId}`);
}

async function uploadToStorage(uploadUrl: string, file: File): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': file.type || 'application/octet-stream',
  };

  // Our backend's direct upload endpoint requires JWT. Don't attach auth to
  // cross-origin pre-signed URLs (e.g. object storage).
  const token = tokenStorage.get();
  if (token && typeof window !== 'undefined') {
    try {
      const resolved = new URL(uploadUrl, window.location.href);
      if (resolved.origin === window.location.origin) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Storage upload failed (${response.status})`);
  }
}

async function uploadFile(file: File): Promise<MediaFile> {
  const upload = await getUploadURL({
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
  });

  await uploadToStorage(upload.uploadUrl, file);

  return confirmUpload(upload.mediaId);
}

export const mediaApi = {
  getUploadURL,
  confirmUpload,
  getMedia,
  uploadFile,
};
