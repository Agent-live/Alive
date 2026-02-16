export type ContentBlock =
  | { type: 'text'; text: string; format?: 'plain' | 'markdown' }
  | { type: 'image'; mediaId: string; url: string; thumbnailUrl?: string; alt?: string }
  | { type: 'video'; mediaId: string; url: string; thumbnailUrl?: string; duration?: number }
  | { type: 'audio'; mediaId: string; url: string; duration?: number; transcription?: string }
  | { type: 'embed'; provider: string; url: string; metadata?: Record<string, unknown> };

export interface Media {
  id: string;
  status: 'processing' | 'ready' | 'failed' | 'rejected';
  url?: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSize: number;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
