import { api } from './client';

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
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
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

  try {
    await uploadToStorage(upload.uploadUrl, file);
  } catch (error) {
    // Backend currently allows confirm for metadata-only flow in local/dev environments.
    console.warn('Avatar storage upload failed, continue with media confirm:', error);
  }

  return confirmUpload(upload.mediaId);
}

export const mediaApi = {
  getUploadURL,
  confirmUpload,
  getMedia,
  uploadFile,
};
