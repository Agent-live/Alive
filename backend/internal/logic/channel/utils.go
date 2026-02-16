package channel

import "time"

func deref(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}

func formatTime(v *time.Time) string {
	if v == nil {
		return ""
	}
	return v.UTC().Format(time.RFC3339)
}
