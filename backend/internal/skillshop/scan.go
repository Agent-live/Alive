package skillshop

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type localMeta struct {
	DisplayName string `json:"displayName"`
}

// scanLocalSkills scans a local checkout of alive-agent/skills for skill entries.
//
// It returns minimal catalog items for skill directories shaped like:
//
//	skills/<owner>/<slug>/(SKILL.md|skill.md)
//
// This intentionally does not try to infer categories; unknown skills are put into "Other".
func scanLocalSkills(repoRoot string, skipSlugs map[string]bool) ([]Item, error) {
	if strings.TrimSpace(repoRoot) == "" {
		return nil, nil
	}

	skillsRoot := filepath.Join(repoRoot, "skills")
	owners, err := os.ReadDir(skillsRoot)
	if err != nil {
		return nil, err
	}

	items := make([]Item, 0, 4096)
	for _, ownerEnt := range owners {
		if !ownerEnt.IsDir() {
			continue
		}
		owner := ownerEnt.Name()
		if owner == "" || strings.HasPrefix(owner, ".") {
			continue
		}

		ownerDir := filepath.Join(skillsRoot, owner)
		skills, err := os.ReadDir(ownerDir)
		if err != nil {
			continue
		}

		for _, skillEnt := range skills {
			if !skillEnt.IsDir() {
				continue
			}
			slug := skillEnt.Name()
			if strings.TrimSpace(slug) == "" || strings.HasPrefix(slug, ".") {
				continue
			}
			if skipSlugs != nil {
				key := strings.ToLower(strings.TrimSpace(slug))
				if key != "" && skipSlugs[key] {
					continue
				}
			}
			skillDir := filepath.Join(ownerDir, slug)

			skillFile := "SKILL.md"
			if _, err := os.Stat(filepath.Join(skillDir, skillFile)); err != nil {
				// Some skills use lowercase filename.
				if _, err2 := os.Stat(filepath.Join(skillDir, "skill.md")); err2 == nil {
					skillFile = "skill.md"
				} else {
					continue
				}
			}

			repoPath := filepath.ToSlash(filepath.Join("skills", owner, slug, skillFile))
			name := slug

			// Prefer displayName from _meta.json when present.
			if b, err := os.ReadFile(filepath.Join(skillDir, "_meta.json")); err == nil {
				var m localMeta
				if json.Unmarshal(b, &m) == nil {
					if strings.TrimSpace(m.DisplayName) != "" {
						name = strings.TrimSpace(m.DisplayName)
					}
				}
			}

			desc := ""
			if b, err := readFilePrefix(filepath.Join(skillDir, skillFile), 16*1024); err == nil {
				desc = parseFrontmatterValue(b, "description")
			}

			url := "https://github.com/alive-agent/skills/tree/main/" + repoPath
			items = append(items, Item{
				Slug:        slug,
				Name:        name,
				Description: strings.TrimSpace(desc),
				Category:    "Other",
				URL:         url,
				RepoPath:    repoPath,
				Bundled:     false,
			})
		}
	}

	return items, nil
}

func readFilePrefix(path string, limit int64) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return io.ReadAll(io.LimitReader(f, limit))
}

func parseFrontmatterValue(md []byte, key string) string {
	s := md
	// Strip UTF-8 BOM if present.
	if bytes.HasPrefix(s, []byte{0xEF, 0xBB, 0xBF}) {
		s = s[3:]
	}
	r := bufio.NewReader(bytes.NewReader(s))

	line, err := r.ReadString('\n')
	if err != nil && err != io.EOF {
		return ""
	}
	line = strings.TrimSpace(line)
	if line != "---" {
		return ""
	}

	key = strings.ToLower(strings.TrimSpace(key))
	var (
		foundKey bool
		value    strings.Builder
		block    bool
	)

	for {
		l, err := r.ReadString('\n')
		if err != nil && err != io.EOF {
			return ""
		}
		ltrim := strings.TrimRight(l, "\r\n")
		trimmed := strings.TrimSpace(ltrim)

		// End of frontmatter.
		if trimmed == "---" {
			break
		}

		// YAML block continuation.
		if block && foundKey {
			if strings.HasPrefix(ltrim, " ") || strings.HasPrefix(ltrim, "\t") {
				value.WriteString(strings.TrimLeft(ltrim, " \t"))
				value.WriteByte('\n')
				if err == io.EOF {
					break
				}
				continue
			}
			// Non-indented line ends the block.
			break
		}

		// Simple "key: value" line.
		colon := strings.IndexByte(trimmed, ':')
		if colon <= 0 {
			if err == io.EOF {
				break
			}
			continue
		}

		k := strings.ToLower(strings.TrimSpace(trimmed[:colon]))
		v := strings.TrimSpace(trimmed[colon+1:])
		if k != key {
			if err == io.EOF {
				break
			}
			continue
		}

		foundKey = true
		if v == "|" || v == ">" || strings.HasPrefix(v, "|") || strings.HasPrefix(v, ">") {
			block = true
			if err == io.EOF {
				break
			}
			continue
		}

		// Try to unquote "..." values for cleaner UI.
		if len(v) >= 2 && (strings.HasPrefix(v, "\"") || strings.HasPrefix(v, "'")) {
			if unq, err := strconv.Unquote(v); err == nil {
				v = unq
			} else if strings.HasPrefix(v, "'") && strings.HasSuffix(v, "'") {
				v = strings.Trim(v, "'")
			}
		}
		value.WriteString(v)
		break
	}

	return strings.TrimSpace(value.String())
}
