package domain

import "fmt"

// ValidationError indicates a client request violated input constraints.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	if e.Message == "" {
		return "validation error"
	}
	return e.Message
}

// ForbiddenError indicates the caller lacks permission for the requested action.
type ForbiddenError struct {
	Message string
}

func (e *ForbiddenError) Error() string {
	if e.Message == "" {
		return "forbidden"
	}
	return e.Message
}

// UnauthorizedError indicates missing or invalid authentication credentials.
type UnauthorizedError struct {
	Message string
}

func (e *UnauthorizedError) Error() string {
	if e.Message == "" {
		return "unauthorized"
	}
	return e.Message
}

// ConflictError indicates the action conflicts with current resource state.
type ConflictError struct {
	Message string
}

func (e *ConflictError) Error() string {
	if e.Message == "" {
		return "conflict"
	}
	return e.Message
}

// Newf helpers for concise construction.

func NewValidationError(format string, args ...any) *ValidationError {
	return &ValidationError{Message: fmt.Sprintf(format, args...)}
}

func NewForbiddenError(format string, args ...any) *ForbiddenError {
	return &ForbiddenError{Message: fmt.Sprintf(format, args...)}
}

func NewUnauthorizedError(format string, args ...any) *UnauthorizedError {
	return &UnauthorizedError{Message: fmt.Sprintf(format, args...)}
}

func NewConflictError(format string, args ...any) *ConflictError {
	return &ConflictError{Message: fmt.Sprintf(format, args...)}
}
