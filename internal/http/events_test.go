//
// Events Route
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

package http

import (
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/golang-jwt/jwt/v5"
)

const (
	eventTestJwtSecret      = "test-secret"
	eventTestJwtIssuer      = "test-issuer"
	eventTestRateLimit      = 2
	eventTestMaxBodySize    = 1 << 20
	eventTestRateLimitSpan  = "1m"
	eventTestExistingID     = 7
	eventTestAdminUserID    = 1
	eventPermissionRead     = 1
	eventPermissionWrite    = 2
	eventTestRemoteAddress  = "192.0.2.10:4321"
	eventTestAssetsDomain   = "assets.example.test"
	eventTestCreateBodyJSON = `{"title":"Night Climb","startsAt":"2026-12-01T18:00:00-06:00","endsAt":"2026-12-01T20:00:00-06:00","locationName":"Gym","address":"1 Main St","city":"Austin","state":"TX","zip":"78701","featuredImageAssetId":3,"excerpt":"Climb","body":"Hello","tags":["Bouldering","Free"]}`
)

type fakeEventApp struct {
	app.AppLayer
	createdTitle string
	createdTags  []string
}

func (f *fakeEventApp) GetUser(userID uint) (*models.UserInternal, error) {
	return &models.UserInternal{ID: userID, Username: "admin"}, nil
}

func (f *fakeEventApp) GetEvent(id uint) (*models.EventInternal, error) {
	if id != eventTestExistingID {
		return &models.EventInternal{}, app.ErrEventNotFound
	}

	return newTestEventInternal(id), nil
}

func (f *fakeEventApp) GetAllEvents() (*[]models.EventInternal, error) {
	return &[]models.EventInternal{*newTestEventInternal(eventTestExistingID)}, nil
}

func (f *fakeEventApp) CreateEvent(user *models.UserInternal, title, slug string, startsAt, endsAt time.Time, locationID *uint, locationName, address, city, state, zip string, featuredImageAssetID uint, featuredImageAltText, excerpt, body string, tags []string) (*models.EventInternal, error) {
	f.createdTitle = title
	f.createdTags = tags
	return newTestEventInternal(eventTestExistingID), nil
}

func (f *fakeEventApp) GetAllTags() ([]string, error) {
	return []string{"Bouldering", "Free"}, nil
}

func (f *fakeEventApp) DeleteEvent(id uint) error {
	return nil
}

func newTestEventInternal(id uint) *models.EventInternal {
	return &models.EventInternal{
		ID:                   id,
		Title:                "Night Climb",
		StartsAt:             time.Date(2026, time.December, 2, 0, 0, 0, 0, time.UTC),
		EndsAt:               time.Date(2026, time.December, 2, 2, 0, 0, 0, time.UTC),
		LocationName:         "Gym",
		FeaturedImageAssetID: 3,
		FeaturedImageURL:     "https://assets.example.test/poster",
		Excerpt:              "Climb",
		Body:                 "Hello",
	}
}

func newEventTestEngine(fake *fakeEventApp) http.Handler {
	config := &utils.HttpConfig{
		AssetsDomain:         eventTestAssetsDomain,
		EventRateLimit:       eventTestRateLimit,
		EventRateLimitWindow: eventTestRateLimitSpan,
		MaxJsonBodySize:      eventTestMaxBodySize,
		Jwt:                  utils.JwtConfig{Secret: eventTestJwtSecret, Issuer: eventTestJwtIssuer},
	}

	return New(fake, config, "test").engine
}

func signEventToken(t *testing.T, role string, eventPermission uint) string {
	t.Helper()

	claims := middleware.JwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    eventTestJwtIssuer + "-" + middleware.JwtVersion,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
		User: middleware.JwtUserClaim{
			ID:          eventTestAdminUserID,
			Role:        role,
			Permissions: map[string]uint{"event": eventPermission},
		},
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(eventTestJwtSecret))
	if err != nil {
		t.Fatalf("signing token: %v", err)
	}

	return signed
}

func performEventRequest(handler http.Handler, method, target, token, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.RemoteAddr = eventTestRemoteAddress
	request.Host = eventTestAssetsDomain
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)

	return recorder
}

func TestAdminEventRoutesRejectRequestsWithoutValidToken(t *testing.T) {
	handler := newEventTestEngine(&fakeEventApp{})

	routes := []struct{ method, target string }{
		{http.MethodGet, "/api/v1/event"},
		{http.MethodGet, "/api/v1/event/7"},
		{http.MethodPost, "/api/v1/event"},
		{http.MethodPut, "/api/v1/event/7"},
		{http.MethodDelete, "/api/v1/event/7"},
	}
	for _, route := range routes {
		withoutHeader := performEventRequest(handler, route.method, route.target, "", "")
		if withoutHeader.Code != http.StatusBadRequest {
			t.Errorf("%s %s without header = %d, want %d", route.method, route.target, withoutHeader.Code, http.StatusBadRequest)
		}

		withInvalidToken := performEventRequest(handler, route.method, route.target, "not-a-jwt", "")
		if withInvalidToken.Code != http.StatusUnauthorized {
			t.Errorf("%s %s with invalid token = %d, want %d", route.method, route.target, withInvalidToken.Code, http.StatusUnauthorized)
		}
	}
}

func TestAdminEventRoutesEnforceEventPermission(t *testing.T) {
	tests := []struct {
		name       string
		permission uint
		method     string
		target     string
		wantStatus int
	}{
		{"no permission cannot list", 0, http.MethodGet, "/api/v1/event", http.StatusUnauthorized},
		{"read permission can list", eventPermissionRead, http.MethodGet, "/api/v1/event", http.StatusOK},
		{"read permission can get one", eventPermissionRead, http.MethodGet, "/api/v1/event/7", http.StatusOK},
		{"read permission cannot delete", eventPermissionRead, http.MethodDelete, "/api/v1/event/7", http.StatusUnauthorized},
		{"write permission can delete", eventPermissionWrite, http.MethodDelete, "/api/v1/event/7", http.StatusOK},
		{"missing event is not found", eventPermissionRead, http.MethodGet, "/api/v1/event/99", http.StatusNotFound},
		{"non-numeric id is rejected", eventPermissionRead, http.MethodGet, "/api/v1/event/abc", http.StatusBadRequest},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			handler := newEventTestEngine(&fakeEventApp{})
			token := signEventToken(t, "Editor", test.permission)

			recorder := performEventRequest(handler, test.method, test.target, token, "")

			if recorder.Code != test.wantStatus {
				t.Errorf("status = %d, want %d: %s", recorder.Code, test.wantStatus, recorder.Body.String())
			}
		})
	}
}

func TestCreateEventParsesCamelCaseBodyAndReturnsEvent(t *testing.T) {
	fake := &fakeEventApp{}
	handler := newEventTestEngine(fake)
	token := signEventToken(t, "Editor", eventPermissionWrite)

	recorder := performEventRequest(handler, http.MethodPost, "/api/v1/event", token, eventTestCreateBodyJSON)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", recorder.Code, recorder.Body.String())
	}
	if fake.createdTitle != "Night Climb" {
		t.Errorf("app received title %q, want %q", fake.createdTitle, "Night Climb")
	}
	if !slices.Equal(fake.createdTags, []string{"Bouldering", "Free"}) {
		t.Errorf("app received tags %q, want [Bouldering Free]", fake.createdTags)
	}
	for _, fragment := range []string{`"startsAt":"2026-12-02T00:00:00Z"`, `"featuredImage":{"assetId":3,"url":"https://assets.example.test/poster"`, `"locationName":"Gym"`} {
		if !strings.Contains(recorder.Body.String(), fragment) {
			t.Errorf("response missing %s in %s", fragment, recorder.Body.String())
		}
	}
}

func TestCreateEventRejectsMalformedBody(t *testing.T) {
	handler := newEventTestEngine(&fakeEventApp{})
	token := signEventToken(t, "Editor", eventPermissionWrite)

	recorder := performEventRequest(handler, http.MethodPost, "/api/v1/event", token, `{"startsAt":"not a date"}`)

	if recorder.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", recorder.Code)
	}
}

func TestPublicEventRoutesNeedNoToken(t *testing.T) {
	handler := newEventTestEngine(&fakeEventApp{})

	list := performEventRequest(handler, http.MethodGet, "/api/v1/events", "", "")
	one := performEventRequest(handler, http.MethodGet, "/api/v1/events/7", "", "")
	missing := performEventRequest(handler, http.MethodGet, "/api/v1/events/99", "", "")

	if list.Code != http.StatusOK || one.Code != http.StatusOK {
		t.Errorf("list = %d, one = %d, want both 200", list.Code, one.Code)
	}
	if missing.Code != http.StatusNotFound {
		t.Errorf("missing = %d, want 404", missing.Code)
	}
}

func TestPublicEventRoutesAreRateLimited(t *testing.T) {
	handler := newEventTestEngine(&fakeEventApp{})

	var lastStatus int
	for range eventTestRateLimit + 1 {
		lastStatus = performEventRequest(handler, http.MethodGet, "/api/v1/events", "", "").Code
	}

	if lastStatus != http.StatusTooManyRequests {
		t.Errorf("status after exceeding limit = %d, want 429", lastStatus)
	}
}

func TestEventsFeedIsRateLimited(t *testing.T) {
	handler := newEventTestEngine(&fakeEventApp{})

	var lastStatus int
	for range eventTestRateLimit + 1 {
		lastStatus = performEventRequest(handler, http.MethodGet, "/events/not-a-month", "", "").Code
	}

	if lastStatus != http.StatusTooManyRequests {
		t.Errorf("status after exceeding limit = %d, want 429", lastStatus)
	}
}

func TestGetTagsIsNotShadowedByEventIDRoute(t *testing.T) {
	handler := newEventTestEngine(&fakeEventApp{})
	token := signEventToken(t, "Editor", eventPermissionRead)

	recorder := performEventRequest(handler, http.MethodGet, "/api/v1/event/tags", token, "")

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", recorder.Code, recorder.Body.String())
	}
	if recorder.Body.String() != `["Bouldering","Free"]` {
		t.Errorf("body = %s, want tag names", recorder.Body.String())
	}
}
