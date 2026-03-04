package mapper

import (
	"backend/ent"
	"backend/internal/domain"
	"backend/internal/types"
)

func ToMediaResp(m *ent.Media) types.MediaResp {
	return types.MediaResp{
		MediaId:      m.ID.String(),
		Status:       m.Status,
		URL:          domain.PtrString(m.URL),
		ThumbnailURL: domain.PtrString(m.ThumbnailURL),
		MimeType:     m.MimeType,
		FileSize:     m.FileSize,
		CreatedAt:    domain.TimeToISO(m.CreatedAt),
	}
}
