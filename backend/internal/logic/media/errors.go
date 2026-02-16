package media

import "fmt"

// FileTooLargeError indicates the upload exceeds configured max bytes.
type FileTooLargeError struct {
	MaxBytes int64
	Size     int64
}

func (e *FileTooLargeError) Error() string {
	if e == nil {
		return "file is too large"
	}
	switch {
	case e.MaxBytes > 0 && e.Size > 0:
		return fmt.Sprintf("file is too large: %d bytes exceeds max %d bytes", e.Size, e.MaxBytes)
	case e.MaxBytes > 0:
		return fmt.Sprintf("file is too large: max %d bytes", e.MaxBytes)
	default:
		return "file is too large"
	}
}

// UploadOffsetMismatchError indicates client offset does not match server offset.
type UploadOffsetMismatchError struct {
	CurrentOffset int64
	Expected      int64
}

func (e *UploadOffsetMismatchError) Error() string {
	if e == nil {
		return "upload offset mismatch"
	}
	return fmt.Sprintf("upload offset mismatch: current %d expected %d", e.CurrentOffset, e.Expected)
}

// UploadIncompleteError indicates client marked upload complete before full payload arrived.
type UploadIncompleteError struct {
	Current  int64
	Expected int64
}

func (e *UploadIncompleteError) Error() string {
	if e == nil {
		return "upload incomplete"
	}
	return fmt.Sprintf("upload incomplete: current %d expected %d", e.Current, e.Expected)
}
