package skillshop

import "strings"

// MapShopCategoryToInternal maps the AliveAgent community skill shop categories into Alive's
// internal skill categories (creative|analytical|social|technical|other).
//
// This is intentionally coarse so skills remain usable in the existing UI.
func MapShopCategoryToInternal(cat string) string {
	cat = strings.ToLower(strings.TrimSpace(cat))
	switch cat {
	case "image & video generation", "media & streaming", "web & frontend development":
		return "creative"
	case "data & analytics", "finance", "ai & llms", "search & research":
		return "analytical"
	case "communication", "marketing & sales", "calendar & scheduling":
		return "social"
	case "coding agents & ides", "git & github", "devops & cloud", "browser & automation", "cli utilities", "security & passwords", "pdf & documents":
		return "technical"
	default:
		return "other"
	}
}
