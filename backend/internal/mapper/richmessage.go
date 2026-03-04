package mapper

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"backend/ent"
	"backend/internal/domain"
)

func EncodeRichMessage(text string, attachments []domain.RichMessageAttachment) (content string, messageType string, err error) {
	text = strings.TrimSpace(text)
	normalized := normalizeAttachments(attachments)

	if text == "" && len(normalized) == 0 {
		return "", "", errors.New("message or attachments are required")
	}
	if len(normalized) == 0 {
		return text, domain.MessageTypeText, nil
	}

	env := domain.RichMessageEnvelope{
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

func DecodeRichMessage(content string) (domain.RichMessageEnvelope, bool) {
	out := domain.RichMessageEnvelope{}
	raw := strings.TrimSpace(content)
	if raw == "" || !strings.HasPrefix(raw, "{") {
		return out, false
	}
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return domain.RichMessageEnvelope{}, false
	}
	out.Text = strings.TrimSpace(out.Text)
	out.Attachments = normalizeAttachments(out.Attachments)
	if out.Text == "" && len(out.Attachments) == 0 {
		return domain.RichMessageEnvelope{}, false
	}
	return out, true
}

func RichMessagePreview(text string, attachments []domain.RichMessageAttachment, maxLen int) string {
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

func ResolveRichAttachments(mediaEntries []*ent.Media) []domain.RichMessageAttachment {
	if len(mediaEntries) == 0 {
		return nil
	}

	out := make([]domain.RichMessageAttachment, 0, len(mediaEntries))
	for _, m := range mediaEntries {
		if m == nil {
			continue
		}
		url := strings.TrimSpace(domain.PtrString(m.URL))
		if url == "" {
			continue
		}
		out = append(out, domain.RichMessageAttachment{
			MediaID:      m.ID.String(),
			MimeType:     strings.TrimSpace(m.MimeType),
			URL:          url,
			ThumbnailURL: strings.TrimSpace(domain.PtrString(m.ThumbnailURL)),
			FileSize:     m.FileSize,
		})
	}
	return out
}

func normalizeAttachments(in []domain.RichMessageAttachment) []domain.RichMessageAttachment {
	out := make([]domain.RichMessageAttachment, 0, len(in))
	for _, it := range in {
		mediaID := strings.TrimSpace(it.MediaID)
		mimeType := strings.TrimSpace(it.MimeType)
		url := strings.TrimSpace(it.URL)
		if mediaID == "" || mimeType == "" || url == "" {
			continue
		}
		out = append(out, domain.RichMessageAttachment{
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
