package feed

import (
	"testing"

	"backend/internal/types"
)

func TestDerivePostPreview(t *testing.T) {
	longText := "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"

	tests := []struct {
		name   string
		blocks []postContentBlock
		want   string
	}{
		{
			name: "text preview",
			blocks: []postContentBlock{
				{Type: "text", Text: "hello world"},
				{Type: "video", URL: "https://example.com/v.mp4"},
			},
			want: "hello world",
		},
		{
			name: "text preview clipped to 140",
			blocks: []postContentBlock{
				{Type: "text", Text: longText},
			},
			want: longText[:140],
		},
		{
			name: "video fallback",
			blocks: []postContentBlock{
				{Type: "video", URL: "https://example.com/v.mp4"},
			},
			want: "[Video]",
		},
		{
			name: "image fallback",
			blocks: []postContentBlock{
				{Type: "image", URL: "https://example.com/p.jpg"},
			},
			want: "[Image]",
		},
		{
			name: "audio fallback",
			blocks: []postContentBlock{
				{Type: "audio", URL: "https://example.com/a.mp3"},
			},
			want: "[Audio]",
		},
		{
			name: "empty fallback",
			blocks: []postContentBlock{
				{Type: "embed", URL: "https://example.com"},
			},
			want: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := derivePostPreview(tt.blocks)
			if got != tt.want {
				t.Fatalf("derivePostPreview() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestNormalizeBlocks_TooMany(t *testing.T) {
	logic := &CreatePostLogic{}
	input := make([]types.PostContentBlockReq, 21)
	for i := range input {
		input[i] = types.PostContentBlockReq{Type: "text", Text: "x"}
	}

	_, err := logic.normalizeBlocks(input)
	if err == nil {
		t.Fatalf("expected max length error")
	}
}

func TestNormalizeOneBlock(t *testing.T) {
	logic := &CreatePostLogic{}

	tests := []struct {
		name    string
		input   types.PostContentBlockReq
		wantNil bool
		wantErr bool
	}{
		{
			name: "text normal",
			input: types.PostContentBlockReq{
				Type: "text",
				Text: "hello",
			},
		},
		{
			name: "text blank ignored",
			input: types.PostContentBlockReq{
				Type: "text",
				Text: "   ",
			},
			wantNil: true,
		},
		{
			name: "video with direct url",
			input: types.PostContentBlockReq{
				Type: "video",
				Url:  "https://example.com/video.mp4",
			},
		},
		{
			name: "video invalid media id",
			input: types.PostContentBlockReq{
				Type:    "video",
				MediaId: "bad-media-id",
			},
			wantErr: true,
		},
		{
			name: "embed missing url",
			input: types.PostContentBlockReq{
				Type: "embed",
			},
			wantErr: true,
		},
		{
			name: "unsupported block type",
			input: types.PostContentBlockReq{
				Type: "unknown",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := logic.normalizeOneBlock(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tt.wantNil && got != nil {
				t.Fatalf("expected nil block")
			}
			if !tt.wantNil && got == nil {
				t.Fatalf("expected non-nil block")
			}
		})
	}
}
