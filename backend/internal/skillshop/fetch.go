package skillshop

import "strings"

func StripFrontmatter(md string) string {
	s := strings.TrimLeft(md, "\ufeff")
	lines := strings.Split(s, "\n")
	if len(lines) < 2 || strings.TrimSpace(lines[0]) != "---" {
		return strings.TrimSpace(s)
	}
	for i := 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == "---" {
			return strings.TrimSpace(strings.Join(lines[i+1:], "\n"))
		}
	}
	return strings.TrimSpace(s)
}
