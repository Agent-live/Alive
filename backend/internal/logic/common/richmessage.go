package common

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"backend/ent"

	"github.com/google/uuid"
)

type RichMessageAttachment struct {
	MediaID      string `json:"mediaId"`
	MimeType     string `json:"mimeType"`
	URL          string `json:"url"`
	ThumbnailURL string `json:"thumbnailUrl,optional"`
	FileSize     int64  `json:"fileSize,optional"`
}

type RichMessageEnvelope struct {
	Text        string                  `json:"text,optional"`
	Attachments []RichMessageAttachment `json:"attachments,optional"`
}

func EncodeRichMessage(text string, attachments []RichMessageAttachment) (content string, messageType string, err error) {
	text = strings.TrimSpace(text)
	normalized := normalizeAttachments(attachments)

	if text == "" && len(normalized) == 0 {
		return "", "", errors.New("message or attachments are required")
	}
	if len(normalized) == 0 {
		return text, "text", nil
	}

	env := RichMessageEnvelope{
		Text:        text,
		Attachments: normalized,
	}
	raw, err := json.Marshal(env)
	if err != nil {
		return "", "", err
	}

	if text != "" {
		return string(raw), "mixed", nil
	}
	if len(normalized) == 1 {
		return string(raw), AttachmentMessageType(normalized[0].MimeType), nil
	}
	return string(raw), "file", nil
}

func DecodeRichMessage(content string) (RichMessageEnvelope, bool) {
	out := RichMessageEnvelope{}
	raw := strings.TrimSpace(content)
	if raw == "" || !strings.HasPrefix(raw, "{") {
		return out, false
	}
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return RichMessageEnvelope{}, false
	}
	out.Text = strings.TrimSpace(out.Text)
	out.Attachments = normalizeAttachments(out.Attachments)
	if out.Text == "" && len(out.Attachments) == 0 {
		return RichMessageEnvelope{}, false
	}
	return out, true
}

func RichMessagePreview(text string, attachments []RichMessageAttachment, maxLen int) string {
	text = strings.TrimSpace(text)
	if text != "" {
		return shrinkText(text, maxLen)
	}
	if len(attachments) == 0 {
		return ""
	}
	if len(attachments) == 1 {
		switch AttachmentMessageType(attachments[0].MimeType) {
		case "image":
			return "[image]"
		case "video":
			return "[video]"
		case "audio":
			return "[audio]"
		default:
			return "[file]"
		}
	}
	return fmt.Sprintf("[attachments x%d]", len(attachments))
}

func AttachmentMessageType(mimeType string) string {
	mt := strings.ToLower(strings.TrimSpace(mimeType))
	switch {
	case strings.HasPrefix(mt, "image/"):
		return "image"
	case strings.HasPrefix(mt, "video/"):
		return "video"
	case strings.HasPrefix(mt, "audio/"):
		return "audio"
	default:
		return "file"
	}
}

func ResolveRichAttachments(ctx context.Context, db *ent.Client, mediaIDs []string) ([]RichMessageAttachment, error) {
	if db == nil || len(mediaIDs) == 0 {
		return nil, nil
	}

	out := make([]RichMessageAttachment, 0, len(mediaIDs))
	for _, raw := range mediaIDs {
		idText := strings.TrimSpace(raw)
		if idText == "" {
			continue
		}
		id, err := uuid.Parse(idText)
		if err != nil {
			return nil, fmt.Errorf("invalid mediaId: %s", idText)
		}
		m, err := db.Media.Get(ctx, id)
		if err != nil {
			return nil, err
		}
		if strings.ToLower(strings.TrimSpace(m.Status)) != "ready" {
			return nil, fmt.Errorf("media is not ready: %s", idText)
		}
		url := strings.TrimSpace(PtrString(m.URL))
		if url == "" {
			return nil, fmt.Errorf("media url is empty: %s", idText)
		}

		out = append(out, RichMessageAttachment{
			MediaID:      m.ID.String(),
			MimeType:     strings.TrimSpace(m.MimeType),
			URL:          url,
			ThumbnailURL: strings.TrimSpace(PtrString(m.ThumbnailURL)),
			FileSize:     m.FileSize,
		})
	}
	return out, nil
}

func normalizeAttachments(in []RichMessageAttachment) []RichMessageAttachment {
	out := make([]RichMessageAttachment, 0, len(in))
	for _, it := range in {
		mediaID := strings.TrimSpace(it.MediaID)
		mimeType := strings.TrimSpace(it.MimeType)
		url := strings.TrimSpace(it.URL)
		if mediaID == "" || mimeType == "" || url == "" {
			continue
		}
		out = append(out, RichMessageAttachment{
			MediaID:      mediaID,
			MimeType:     mimeType,
			URL:          url,
			ThumbnailURL: strings.TrimSpace(it.ThumbnailURL),
			FileSize:     it.FileSize,
		})
	}
	return out
}

func shrinkText(s string, maxLen int) string {
	if maxLen <= 0 {
		return s
	}
	r := []rune(s)
	if len(r) <= maxLen {
		return s
	}
	return strings.TrimSpace(string(r[:maxLen])) + "..."
}
