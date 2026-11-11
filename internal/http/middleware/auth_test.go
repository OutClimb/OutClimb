//
// Auth Middleware Tests
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
	"time"

	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	testJwtSecret = "test-secret"
	testJwtIssuer = "test-issuer"
)

func newTestJwtConfig() *utils.HttpConfig {
	return &utils.HttpConfig{Jwt: utils.JwtConfig{Secret: testJwtSecret, Issuer: testJwtIssuer}}
}

type tokenOptions struct {
	secret    string
	issuer    string
	expiresAt time.Time
	user      JwtUserClaim
}

func signToken(t *testing.T, options tokenOptions) string {
	t.Helper()

	if options.secret == "" {
		options.secret = testJwtSecret
	}
	if options.issuer == "" {
		options.issuer = testJwtIssuer + "-" + JwtVersion
	}
	if options.expiresAt.IsZero() {
		options.expiresAt = time.Now().Add(time.Hour)
	}

	claims := JwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{Issuer: options.issuer, ExpiresAt: jwt.NewNumericDate(options.expiresAt)},
		User:             options.user,
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(options.secret))
	if err != nil {
		t.Fatalf("signing token: %v", err)
	}
	return signed
}

func bearer(token string) func(*http.Request) {
	return func(r *http.Request) { r.Header.Set("Authorization", "Bearer "+token) }
}

func TestAuth(t *testing.T) {
	tests := []struct {
		name                  string
		authorization         func(t *testing.T) string
		resetAllowed          bool
		twoFactorSetupAllowed bool
		wantStatus            int
	}{
		{
			name:          "missing header",
			authorization: func(t *testing.T) string { return "" },
			wantStatus:    http.StatusBadRequest,
		},
		{
			name:          "wrong scheme",
			authorization: func(t *testing.T) string { return "Basic abc" },
			wantStatus:    http.StatusBadRequest,
		},
		{
			name:          "garbage token",
			authorization: func(t *testing.T) string { return "Bearer not-a-jwt" },
			wantStatus:    http.StatusUnauthorized,
		},
		{
			name: "signed with wrong secret",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{secret: "other-secret"})
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "expired",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{expiresAt: time.Now().Add(-time.Minute)})
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "old jwt version",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{issuer: testJwtIssuer + "-0"})
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "unsigned token (alg none)",
			authorization: func(t *testing.T) string {
				claims := JwtClaims{RegisteredClaims: jwt.RegisteredClaims{Issuer: testJwtIssuer + "-" + JwtVersion}}
				signed, err := jwt.NewWithClaims(jwt.SigningMethodNone, claims).SignedString(jwt.UnsafeAllowNoneSignatureType)
				if err != nil {
					t.Fatalf("signing token: %v", err)
				}
				return "Bearer " + signed
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "valid",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{})
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "password reset required but not allowed",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{user: JwtUserClaim{RequirePasswordReset: true}})
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "password reset required and allowed",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{user: JwtUserClaim{RequirePasswordReset: true}})
			},
			resetAllowed: true,
			wantStatus:   http.StatusOK,
		},
		{
			name: "two factor setup required but not allowed",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{user: JwtUserClaim{RequireTwoFactorSetup: true}})
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "two factor setup required and allowed",
			authorization: func(t *testing.T) string {
				return "Bearer " + signToken(t, tokenOptions{user: JwtUserClaim{RequireTwoFactorSetup: true}})
			},
			twoFactorSetupAllowed: true,
			wantStatus:            http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newTestRouter(Auth(newTestJwtConfig(), tt.resetAllowed, tt.twoFactorSetupAllowed))

			recorder := performRequest(router, http.MethodGet, func(r *http.Request) {
				if authorization := tt.authorization(t); authorization != "" {
					r.Header.Set("Authorization", authorization)
				}
			})

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}
		})
	}
}

func TestAuthSetsUserInContext(t *testing.T) {
	wantUser := JwtUserClaim{ID: 7, Username: "climber", Role: "Owner", Permissions: map[string]uint{"form": 2}}
	var gotUser JwtUserClaim

	router := gin.New()
	router.GET("/", Auth(newTestJwtConfig(), false, false), func(c *gin.Context) {
		gotUser = c.MustGet("user").(JwtUserClaim)
		c.Status(http.StatusOK)
	})

	recorder := performRequest(router, http.MethodGet, bearer(signToken(t, tokenOptions{user: wantUser})))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if gotUser.ID != wantUser.ID || gotUser.Username != wantUser.Username || gotUser.Role != wantUser.Role || gotUser.Permissions["form"] != 2 {
		t.Fatalf("user in context = %+v, want %+v", gotUser, wantUser)
	}
}

func TestOptionalAuth(t *testing.T) {
	tests := []struct {
		name        string
		configure   func(t *testing.T) func(*http.Request)
		wantUserSet bool
	}{
		{
			name:      "no header",
			configure: func(t *testing.T) func(*http.Request) { return nil },
		},
		{
			name: "wrong scheme",
			configure: func(t *testing.T) func(*http.Request) {
				return func(r *http.Request) { r.Header.Set("Authorization", "Basic abc") }
			},
		},
		{
			name:      "invalid token",
			configure: func(t *testing.T) func(*http.Request) { return bearer("garbage") },
		},
		{
			name: "wrong secret",
			configure: func(t *testing.T) func(*http.Request) {
				return bearer(signToken(t, tokenOptions{secret: "other-secret"}))
			},
		},
		{
			name: "password reset required",
			configure: func(t *testing.T) func(*http.Request) {
				return bearer(signToken(t, tokenOptions{user: JwtUserClaim{RequirePasswordReset: true}}))
			},
		},
		{
			name: "two factor setup required",
			configure: func(t *testing.T) func(*http.Request) {
				return bearer(signToken(t, tokenOptions{user: JwtUserClaim{RequireTwoFactorSetup: true}}))
			},
		},
		{
			name: "valid",
			configure: func(t *testing.T) func(*http.Request) {
				return bearer(signToken(t, tokenOptions{}))
			},
			wantUserSet: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var userSet bool
			router := gin.New()
			router.GET("/", OptionalAuth(newTestJwtConfig()), func(c *gin.Context) {
				_, userSet = c.Get("user")
				c.Status(http.StatusOK)
			})

			recorder := performRequest(router, http.MethodGet, tt.configure(t))

			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d: optional auth must never block", recorder.Code, http.StatusOK)
			}
			if userSet != tt.wantUserSet {
				t.Fatalf("user set = %v, want %v", userSet, tt.wantUserSet)
			}
		})
	}
}
