package domain

type PostContentBlock struct {
	Type          string         `json:"type"`
	Text          string         `json:"text,omitempty"`
	Format        string         `json:"format,omitempty"`
	MediaID       string         `json:"mediaId,omitempty"`
	URL           string         `json:"url,omitempty"`
	ThumbnailURL  string         `json:"thumbnailUrl,omitempty"`
	Duration      int64          `json:"duration,omitempty"`
	Alt           string         `json:"alt,omitempty"`
	Transcription string         `json:"transcription,omitempty"`
	Provider      string         `json:"provider,omitempty"`
	Metadata      map[string]any `json:"metadata,omitempty"`
}

type PostPlacement struct {
	Slot     string `json:"slot,omitempty"`
	Pinned   bool   `json:"pinned,omitempty"`
	Priority int64  `json:"priority,omitempty"`
}

type PostContentPayload struct {
	Blocks    []PostContentBlock `json:"blocks"`
	Preview   string             `json:"preview,omitempty"`
	Placement *PostPlacement     `json:"placement,omitempty"`
}

type RichMessageAttachment struct {
	MediaID      string `json:"mediaId"`
	MimeType     string `json:"mimeType"`
	URL          string `json:"url"`
	ThumbnailURL string `json:"thumbnailUrl,omitempty"`
	FileSize     int64  `json:"fileSize,omitempty"`
}

type RichMessageEnvelope struct {
	Text        string                 `json:"text,omitempty"`
	Attachments []RichMessageAttachment `json:"attachments,omitempty"`
}
