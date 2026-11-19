//
// Redirect Www Middleware Tests
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
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

const (
	testApexDomain      = "outcl.im"
	testOtherApexDomain = "outclimb.gay"
)

func performHostRequest(host string, target string) *httptest.ResponseRecorder {
	router := gin.New()
	router.Use(RedirectWwwToApex())
	router.GET("/*path", func(c *gin.Context) { c.Status(http.StatusOK) })

	request := httptest.NewRequest(http.MethodGet, target, nil)
	request.Host = host
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func TestRedirectWwwToApexRedirectsWwwHostPreservingPathAndQuery(t *testing.T) {
	recorder := performHostRequest("www."+testApexDomain, "/b/abc?x=1")

	if recorder.Code != http.StatusMovedPermanently {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusMovedPermanently)
	}
	if got, want := recorder.Header().Get("Location"), "http://outcl.im/b/abc?x=1"; got != want {
		t.Fatalf("location = %q, want %q", got, want)
	}
}

func TestRedirectWwwToApexPassesThroughOtherHosts(t *testing.T) {
	recorder := performHostRequest(testApexDomain, "/b/abc")

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}

func TestRedirectWwwToApexRedirectsAnyWwwHost(t *testing.T) {
	recorder := performHostRequest("www."+testOtherApexDomain, "/")

	if got, want := recorder.Header().Get("Location"), "http://outclimb.gay/"; got != want {
		t.Fatalf("location = %q, want %q", got, want)
	}
}

func TestRedirectWwwToApexKeepsPortInRedirect(t *testing.T) {
	recorder := performHostRequest("www.outclimb.local:8080", "/")

	if got, want := recorder.Header().Get("Location"), "http://outclimb.local:8080/"; got != want {
		t.Fatalf("location = %q, want %q", got, want)
	}
}
