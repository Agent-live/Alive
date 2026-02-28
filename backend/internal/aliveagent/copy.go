package aliveagent

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// copyDir recursively copies srcDir into dstDir.
// dstDir must exist; callers typically mkdir it first.
func copyDir(srcDir, dstDir string) error {
	srcDir = filepath.Clean(srcDir)
	dstDir = filepath.Clean(dstDir)

	entries, err := os.ReadDir(srcDir)
	if err != nil {
		return err
	}

	for _, e := range entries {
		name := e.Name()
		if name == ".git" {
			continue
		}
		srcPath := filepath.Join(srcDir, name)
		dstPath := filepath.Join(dstDir, name)

		info, err := e.Info()
		if err != nil {
			return err
		}

		// Skip symlinks for safety and portability.
		if info.Mode()&os.ModeSymlink != 0 {
			continue
		}

		if info.IsDir() {
			if err := os.MkdirAll(dstPath, 0755); err != nil {
				return err
			}
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
			continue
		}

		perm := info.Mode() & 0777
		if perm == 0 {
			perm = 0644
		}
		if err := copyFile(srcPath, dstPath, perm); err != nil {
			return err
		}
	}

	return nil
}

func copyFile(src, dst string, perm os.FileMode) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, perm)
	if err != nil {
		return err
	}
	defer func() { _ = out.Close() }()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	if err := out.Close(); err != nil {
		return fmt.Errorf("close %s: %w", dst, err)
	}
	return nil
}
