//
// Permission Middleware Tests
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
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPermission(t *testing.T) {
	const entity = "form"

	tests := []struct {
		name       string
		role       string
		level      uint
		method     string
		wantStatus int
	}{
		{"owner can read without permission", "Owner", 0, http.MethodGet, http.StatusOK},
		{"owner can write without permission", "Owner", 0, http.MethodDelete, http.StatusOK},
		{"no permission cannot read", "Editor", 0, http.MethodGet, http.StatusUnauthorized},
		{"no permission cannot write", "Editor", 0, http.MethodPost, http.StatusUnauthorized},
		{"read permission can read", "Editor", 1, http.MethodGet, http.StatusOK},
		{"read permission cannot post", "Editor", 1, http.MethodPost, http.StatusUnauthorized},
		{"read permission cannot put", "Editor", 1, http.MethodPut, http.StatusUnauthorized},
		{"read permission cannot delete", "Editor", 1, http.MethodDelete, http.StatusUnauthorized},
		{"write permission can read", "Editor", 2, http.MethodGet, http.StatusOK},
		{"write permission can post", "Editor", 2, http.MethodPost, http.StatusOK},
		{"write permission can delete", "Editor", 2, http.MethodDelete, http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setUser := func(c *gin.Context) {
				c.Set("user", JwtUserClaim{Role: tt.role, Permissions: map[string]uint{entity: tt.level}})
			}
			router := newTestRouter(setUser, Permission(entity))

			recorder := performRequest(router, tt.method, nil)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}
		})
	}
}

func TestPermissionIsScopedToEntity(t *testing.T) {
	setUser := func(c *gin.Context) {
		c.Set("user", JwtUserClaim{Role: "Editor", Permissions: map[string]uint{"event": 2}})
	}
	router := newTestRouter(setUser, Permission("form"))

	recorder := performRequest(router, http.MethodGet, nil)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d: permission on another entity must not grant access", recorder.Code, http.StatusUnauthorized)
	}
}
