package http

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

func TestOpenDonateFile(t *testing.T) {
	const (
		rootIndexContent   = "root index"
		nestedIndexContent = "thank you index"
		assetContent       = "asset"
	)

	donateDirectory := t.TempDir()
	writeTestFile(t, filepath.Join(donateDirectory, "index.html"), rootIndexContent)
	writeTestFile(t, filepath.Join(donateDirectory, "thank-you", "index.html"), nestedIndexContent)
	writeTestFile(t, filepath.Join(donateDirectory, "assets", "app.js"), assetContent)
	if err := os.MkdirAll(filepath.Join(donateDirectory, "empty-directory"), 0o755); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name         string
		requestPath  string
		wantContents string
	}{
		{"root", "/", rootIndexContent},
		{"asset file", "/assets/app.js", assetContent},
		{"nested index", "/thank-you", nestedIndexContent},
		{"missing path falls back to root", "/nonexistent", rootIndexContent},
		{"directory without index falls back to root", "/empty-directory", rootIndexContent},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			file, _ := openDonateFile(http.Dir(donateDirectory), test.requestPath)
			if file == nil {
				t.Fatal("expected a file, got nil")
			}
			defer func() { _ = file.Close() }()

			contents, err := io.ReadAll(file)
			if err != nil {
				t.Fatal(err)
			}
			if string(contents) != test.wantContents {
				t.Errorf("got %q, want %q", contents, test.wantContents)
			}
		})
	}
}

func writeTestFile(t *testing.T, filePath string, contents string) {
	t.Helper()

	if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filePath, []byte(contents), 0o644); err != nil {
		t.Fatal(err)
	}
}
