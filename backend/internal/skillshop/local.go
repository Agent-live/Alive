package skillshop

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
)

var (
	localRepoOnce sync.Once
	localRepoRoot string
)

// LocalRepoRoot returns a filesystem path to a local clone of the alive-agent/skills repo if found.
//
// This is optional: if not found, the backend will fall back to fetching skill markdown from GitHub.
func LocalRepoRoot() string {
	localRepoOnce.Do(func() {
		localRepoRoot = findLocalRepoRoot()
	})
	return localRepoRoot
}

// LocalRepoPath resolves a repository-relative path against LocalRepoRoot.
// It returns ("",false) if no local repo root is available or if repoPath is invalid.
func LocalRepoPath(repoPath string) (string, bool) {
	root := LocalRepoRoot()
	if root == "" {
		return "", false
	}
	return safeJoin(root, repoPath)
}

func findLocalRepoRoot() string {
	// Highest priority: explicit env override.
	for _, key := range []string{
		"ALIVE_AGENT_SKILLS_DIR",
		"ALIVE_SKILLS_REPO_ROOT",
	} {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" && dirExists(v) {
			return v
		}
	}

	// Common container mount / host paths.
	for _, p := range []string{
		"/opt/alive-agent-skills",
		"/app/alive-agent-skills",
	} {
		if dirExists(p) {
			return p
		}
	}

	// Repo-relative defaults for local dev.
	for _, p := range []string{
		"alive-agent-skills",
		filepath.Join("..", "alive-agent-skills"),
	} {
		if dirExists(p) {
			if abs, err := filepath.Abs(p); err == nil {
				return abs
			}
			return p
		}
	}

	return ""
}

func dirExists(path string) bool {
	st, err := os.Stat(path)
	if err != nil {
		return false
	}
	return st.IsDir()
}

// safeJoin joins repoRoot and repoPath, rejecting path traversal.
func safeJoin(repoRoot, repoPath string) (string, bool) {
	root := strings.TrimSpace(repoRoot)
	rel := strings.TrimSpace(repoPath)
	if root == "" || rel == "" {
		return "", false
	}

	rel = strings.TrimPrefix(rel, "/")
	rel = filepath.Clean(rel)
	if rel == "." || rel == "" {
		return "", false
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", false
	}

	return filepath.Join(root, rel), true
}
