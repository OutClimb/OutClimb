//
// Rate Limit Middleware Tests
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
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	testRateLimitCount  = 2
	testRateLimitWindow = time.Hour
)

func setForwardedFor(address string) func(*http.Request) {
	return func(r *http.Request) { r.Header.Set("X-Forwarded-For", address) }
}

func TestRateLimitRejectsRequestsOverTheLimit(t *testing.T) {
	router := newTestRouter(RateLimit(testRateLimitCount, testRateLimitWindow, nil))

	for i := 0; i < testRateLimitCount; i++ {
		if recorder := performRequest(router, http.MethodGet, nil); recorder.Code != http.StatusOK {
			t.Fatalf("request %d status = %d, want %d", i+1, recorder.Code, http.StatusOK)
		}
	}

	if recorder := performRequest(router, http.MethodGet, nil); recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("over-limit status = %d, want %d", recorder.Code, http.StatusTooManyRequests)
	}
}

func TestRateLimitTracksEachIPSeparately(t *testing.T) {
	router := newTestRouter(RateLimit(1, testRateLimitWindow, nil))

	first := performRequest(router, http.MethodGet, func(r *http.Request) { r.RemoteAddr = "192.0.2.1:1000" })
	second := performRequest(router, http.MethodGet, func(r *http.Request) { r.RemoteAddr = "192.0.2.2:1000" })

	if first.Code != http.StatusOK || second.Code != http.StatusOK {
		t.Fatalf("statuses = %d, %d, want both %d", first.Code, second.Code, http.StatusOK)
	}
}

func TestRateLimitIgnoresForwardedForWithoutTrustedProxies(t *testing.T) {
	router := newTestRouter(RateLimit(1, testRateLimitWindow, nil))

	performRequest(router, http.MethodGet, setForwardedFor("198.51.100.1"))
	recorder := performRequest(router, http.MethodGet, setForwardedFor("198.51.100.2"))

	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want %d: spoofed X-Forwarded-For must not evade the limit", recorder.Code, http.StatusTooManyRequests)
	}
}

func TestRateLimitUsesClientIPWithTrustedProxies(t *testing.T) {
	router := gin.New()
	if err := router.SetTrustedProxies([]string{"192.0.2.10"}); err != nil {
		t.Fatalf("setting trusted proxies: %v", err)
	}
	router.GET("/", RateLimit(1, testRateLimitWindow, []string{"192.0.2.10"}), func(c *gin.Context) { c.Status(http.StatusOK) })

	first := performRequest(router, http.MethodGet, setForwardedFor("198.51.100.1"))
	second := performRequest(router, http.MethodGet, setForwardedFor("198.51.100.2"))
	repeat := performRequest(router, http.MethodGet, setForwardedFor("198.51.100.1"))

	if first.Code != http.StatusOK || second.Code != http.StatusOK {
		t.Fatalf("distinct clients statuses = %d, %d, want both %d", first.Code, second.Code, http.StatusOK)
	}
	if repeat.Code != http.StatusTooManyRequests {
		t.Fatalf("repeat client status = %d, want %d", repeat.Code, http.StatusTooManyRequests)
	}
}

func TestUnauthenticatedRateLimitSkipsAuthenticatedUsers(t *testing.T) {
	setUser := func(c *gin.Context) { c.Set("user", JwtUserClaim{}) }

	authenticated := newTestRouter(setUser, UnauthenticatedRateLimit(1, testRateLimitWindow, nil))
	for i := 0; i < testRateLimitCount+1; i++ {
		if recorder := performRequest(authenticated, http.MethodGet, nil); recorder.Code != http.StatusOK {
			t.Fatalf("authenticated request %d status = %d, want %d", i+1, recorder.Code, http.StatusOK)
		}
	}

	anonymous := newTestRouter(UnauthenticatedRateLimit(1, testRateLimitWindow, nil))
	performRequest(anonymous, http.MethodGet, nil)
	if recorder := performRequest(anonymous, http.MethodGet, nil); recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("anonymous over-limit status = %d, want %d", recorder.Code, http.StatusTooManyRequests)
	}
}

func TestIPRateLimiterEvictsLeastRecentlyUsedEntry(t *testing.T) {
	limiter := newIPRateLimiter(testRateLimitCount, testRateLimitWindow)

	for i := 0; i < rateLimitMaxEntries; i++ {
		limiter.get("ip-" + strconv.Itoa(i))
	}
	limiter.get("ip-0")
	limiter.get("overflow")

	if len(limiter.entries) != rateLimitMaxEntries {
		t.Fatalf("entries = %d, want cap of %d", len(limiter.entries), rateLimitMaxEntries)
	}
	if _, kept := limiter.entries["ip-0"]; !kept {
		t.Fatal("recently used entry was evicted")
	}
	if _, evicted := limiter.entries["ip-1"]; evicted {
		t.Fatal("least recently used entry was not evicted")
	}
}
