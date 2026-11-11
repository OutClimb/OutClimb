//
// Request Guard Middleware Tests
// Copyright 2026 OutClimb
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

package middleware

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequestBodyLimit(t *testing.T) {
	const limit = 8

	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{"body under limit", "1234", false},
		{"body at limit", "12345678", false},
		{"body over limit", "123456789", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var readErr error
			router := gin.New()
			router.POST("/", RequestBodyLimit(limit), func(c *gin.Context) {
				_, readErr = io.ReadAll(c.Request.Body)
				c.Status(http.StatusOK)
			})

			request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			router.ServeHTTP(httptest.NewRecorder(), request)

			var tooLarge *http.MaxBytesError
			if got := errors.As(readErr, &tooLarge); got != tt.wantErr {
				t.Fatalf("read error = %v, want max bytes error: %v", readErr, tt.wantErr)
			}
		})
	}
}

func TestDomain(t *testing.T) {
	const allowedHost = "example.org"

	tests := []struct {
		name       string
		host       string
		wantStatus int
	}{
		{"matching host", allowedHost, http.StatusOK},
		{"other host", "evil.example.com", http.StatusNotFound},
		{"subdomain of host", "www." + allowedHost, http.StatusNotFound},
		{"host with port", allowedHost + ":8080", http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newTestRouter(Domain(allowedHost))

			recorder := performRequest(router, http.MethodGet, func(r *http.Request) { r.Host = tt.host })

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}
		})
	}
}

func TestSecurityHeaders(t *testing.T) {
	const hstsHeader = "Strict-Transport-Security"

	alwaysSet := map[string]string{
		"X-Content-Type-Options":  "nosniff",
		"X-Frame-Options":         "DENY",
		"Content-Security-Policy": "frame-ancestors 'none'",
	}

	for _, behindTLS := range []bool{false, true} {
		name := "not behind tls"
		if behindTLS {
			name = "behind tls"
		}

		t.Run(name, func(t *testing.T) {
			recorder := performRequest(newTestRouter(SecurityHeaders(behindTLS)), http.MethodGet, nil)

			for header, want := range alwaysSet {
				if got := recorder.Header().Get(header); got != want {
					t.Errorf("%s = %q, want %q", header, got, want)
				}
			}
			if hasHsts := recorder.Header().Get(hstsHeader) != ""; hasHsts != behindTLS {
				t.Errorf("%s present = %v, want %v", hstsHeader, hasHsts, behindTLS)
			}
		})
	}
}
