// Donation Logic Tests
// Copyright 2026 OutClimb
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package app

import (
	"errors"
	"testing"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/store"
)

type fakeEventStore struct {
	store.StoreLayer
	events      []store.Event
	rangeStart  time.Time
	rangeEnd    time.Time
	assetURLFor map[string]string
	knownAssets map[uint]bool
	savedEvent  *store.Event
}

func (f *fakeEventStore) GetAsset(id uint) (*store.Asset, error) {
	if !f.knownAssets[id] {
		return &store.Asset{}, store.ErrAssetNotFound
	}

	return &store.Asset{}, nil
}

func (f *fakeEventStore) CreateEvent(createdBy, title, slug string, startsAt, endsAt time.Time, locationID *uint, locationName, address, city, state, zip string, featuredImageAssetID uint, featuredImageAltText, excerpt, body string) (*store.Event, error) {
	f.savedEvent = &store.Event{Title: title, Slug: slug, StartsAt: startsAt, EndsAt: endsAt}
	return f.savedEvent, nil
}

func (f *fakeEventStore) UpdateEvent(id uint, updatedBy, title, slug string, startsAt, endsAt time.Time, locationID *uint, locationName, address, city, state, zip string, featuredImageAssetID uint, featuredImageAltText, excerpt, body string) (*store.Event, error) {
	f.savedEvent = &store.Event{Title: title, Slug: slug, StartsAt: startsAt, EndsAt: endsAt}
	return f.savedEvent, nil
}

func (f *fakeEventStore) GetEventsBetween(start, end time.Time) (*[]store.Event, error) {
	f.rangeStart = start
	f.rangeEnd = end

	inRange := []store.Event{}
	for _, event := range f.events {
		if !event.StartsAt.Before(start) && event.StartsAt.Before(end) {
			inRange = append(inRange, event)
		}
	}

	return &inRange, nil
}

func (f *fakeEventStore) FindAsset(fileName string) (string, error) {
	return f.assetURLFor[fileName], nil
}

func newEventTestApp(t *testing.T, events ...store.Event) *appLayer {
	t.Helper()
	return &appLayer{store: &fakeEventStore{
		events:      events,
		assetURLFor: map[string]string{"poster.png": "https://assets.example.test/poster"},
	}}
}

func newEventAt(t *testing.T, id uint, startsAt string) store.Event {
	t.Helper()

	parsedStart, err := time.Parse(time.RFC3339, startsAt)
	if err != nil {
		t.Fatalf("bad test time %q: %v", startsAt, err)
	}

	event := store.Event{Title: "Event", StartsAt: parsedStart, EndsAt: parsedStart.Add(2 * time.Hour)}
	event.ID = id

	return event
}

func TestGetEventsForMonthIncludesLateNightEventOnLastDayOfMonth(t *testing.T) {
	// 23:30 CST on Nov 30 is already Dec 1 in UTC.
	lateNovemberEvent := newEventAt(t, 1, "2026-11-30T23:30:00-06:00")
	app := newEventTestApp(t, lateNovemberEvent)

	november, err := app.GetEventsForMonth(2026, time.November)
	if err != nil {
		t.Fatalf("unexpected error %v", err)
	}
	december, err := app.GetEventsForMonth(2026, time.December)
	if err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	if len(november.Events) != 1 {
		t.Errorf("november has %d events, want 1", len(november.Events))
	}
	if len(december.Events) != 0 {
		t.Errorf("december has %d events, want 0", len(december.Events))
	}
}

func TestGetEventsForMonthUsesCentralTimeMonthBoundaries(t *testing.T) {
	fake := &fakeEventStore{}
	app := &appLayer{store: fake}

	if _, err := app.GetEventsForMonth(2026, time.March); err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	// March 8, 2026 is the US DST change, so the month starts in CST and ends in CDT.
	wantStart := time.Date(2026, time.March, 1, 6, 0, 0, 0, time.UTC)
	wantEnd := time.Date(2026, time.April, 1, 5, 0, 0, 0, time.UTC)
	if !fake.rangeStart.Equal(wantStart) {
		t.Errorf("range start = %v, want %v", fake.rangeStart.UTC(), wantStart)
	}
	if !fake.rangeEnd.Equal(wantEnd) {
		t.Errorf("range end = %v, want %v", fake.rangeEnd.UTC(), wantEnd)
	}
}

func TestGetEventsForMonthIncludesFeaturedImageURLAndType(t *testing.T) {
	eventWithImage := newEventAt(t, 1, "2026-12-05T18:00:00-06:00")
	eventWithImage.FeaturedImage = store.Asset{FileName: "poster.png"}
	eventWithImage.FeaturedImage.ID = 9
	app := newEventTestApp(t, eventWithImage)

	feed, err := app.GetEventsForMonth(2026, time.December)
	if err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	event := feed.Events[0]
	if event.FeaturedImageURL != "https://assets.example.test/poster" {
		t.Errorf("image url = %q", event.FeaturedImageURL)
	}
	if event.FeaturedImageType != "image/png" {
		t.Errorf("image type = %q, want image/png", event.FeaturedImageType)
	}
}

func TestGetEventsForMonthRendersBodyMarkdownAsHTML(t *testing.T) {
	event := newEventAt(t, 1, "2026-12-05T18:00:00-06:00")
	event.Body = "**Bring** shoes ]]>"
	app := newEventTestApp(t, event)

	feed, err := app.GetEventsForMonth(2026, time.December)
	if err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	want := "<p><strong>Bring</strong> shoes ]]&gt;</p>\n"
	if feed.Events[0].BodyHTML != want {
		t.Errorf("body html = %q, want %q", feed.Events[0].BodyHTML, want)
	}
}

type eventInput struct {
	title                string
	slug                 string
	startsAt             time.Time
	endsAt               time.Time
	locationName         string
	address              string
	city                 string
	state                string
	zip                  string
	assetID              uint
	featuredImageAltText string
	excerpt              string
	body                 string
}

const knownAssetID uint = 7

func newValidEventInput() eventInput {
	startsAt := time.Date(2026, time.December, 5, 18, 0, 0, 0, time.UTC)

	return eventInput{
		title:                "Climb Night",
		slug:                 "climb-night",
		startsAt:             startsAt,
		endsAt:               startsAt.Add(2 * time.Hour),
		locationName:         "Gym",
		address:              "1 Main St",
		city:                 "Minneapolis",
		state:                "MN",
		zip:                  "55401",
		assetID:              knownAssetID,
		featuredImageAltText: "Climber on a wall",
		excerpt:              "Come climb",
		body:                 "All welcome",
	}
}

func TestCreateAndUpdateEventValidation(t *testing.T) {
	tests := []struct {
		name    string
		mutate  func(*eventInput)
		wantErr error
	}{
		{"valid", func(*eventInput) {}, nil},
		{"missing title", func(in *eventInput) { in.title = "" }, ErrInvalidEvent},
		{"missing slug", func(in *eventInput) { in.slug = "" }, ErrInvalidEvent},
		{"missing start", func(in *eventInput) { in.startsAt = time.Time{} }, ErrInvalidEvent},
		{"missing end", func(in *eventInput) { in.endsAt = time.Time{} }, ErrInvalidEvent},
		{"missing location name", func(in *eventInput) { in.locationName = "" }, ErrInvalidEvent},
		{"missing address", func(in *eventInput) { in.address = "" }, ErrInvalidEvent},
		{"missing city", func(in *eventInput) { in.city = "" }, ErrInvalidEvent},
		{"missing state", func(in *eventInput) { in.state = "" }, ErrInvalidEvent},
		{"missing zip", func(in *eventInput) { in.zip = "" }, ErrInvalidEvent},
		{"missing featured image alt text", func(in *eventInput) { in.featuredImageAltText = "" }, ErrInvalidEvent},
		{"missing excerpt", func(in *eventInput) { in.excerpt = "" }, ErrInvalidEvent},
		{"missing body", func(in *eventInput) { in.body = "" }, ErrInvalidEvent},
		{"end before start", func(in *eventInput) { in.endsAt = in.startsAt.Add(-time.Minute) }, ErrInvalidEvent},
		{"end equals start", func(in *eventInput) { in.endsAt = in.startsAt }, ErrInvalidEvent},
		{"no featured image", func(in *eventInput) { in.assetID = 0 }, ErrInvalidEvent},
		{"unknown featured image", func(in *eventInput) { in.assetID = 99 }, ErrInvalidEvent},
	}

	user := &models.UserInternal{Username: "tester"}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := newValidEventInput()
			tt.mutate(&input)

			createApp := &appLayer{store: &fakeEventStore{knownAssets: map[uint]bool{knownAssetID: true}}}
			_, createErr := createApp.CreateEvent(user, input.title, input.slug, input.startsAt, input.endsAt, nil, input.locationName, input.address, input.city, input.state, input.zip, input.assetID, input.featuredImageAltText, input.excerpt, input.body)

			updateApp := &appLayer{store: &fakeEventStore{knownAssets: map[uint]bool{knownAssetID: true}}}
			_, updateErr := updateApp.UpdateEvent(user, 1, input.title, input.slug, input.startsAt, input.endsAt, nil, input.locationName, input.address, input.city, input.state, input.zip, input.assetID, input.featuredImageAltText, input.excerpt, input.body)

			for _, err := range []error{createErr, updateErr} {
				if !errors.Is(err, tt.wantErr) {
					t.Errorf("error = %v, want %v", err, tt.wantErr)
				}
			}
		})
	}
}

func TestCreateEventDoesNotSaveInvalidEvent(t *testing.T) {
	fake := &fakeEventStore{knownAssets: map[uint]bool{knownAssetID: true}}
	app := &appLayer{store: fake}
	input := newValidEventInput()
	input.endsAt = input.startsAt

	_, err := app.CreateEvent(&models.UserInternal{Username: "tester"}, input.title, input.slug, input.startsAt, input.endsAt, nil, input.locationName, input.address, input.city, input.state, input.zip, input.assetID, input.featuredImageAltText, input.excerpt, input.body)

	if err == nil {
		t.Fatal("expected error")
	}
	if fake.savedEvent != nil {
		t.Error("invalid event reached the store")
	}
}

type failingAssetStore struct {
	fakeEventStore
}

func (f *failingAssetStore) GetAsset(id uint) (*store.Asset, error) {
	return &store.Asset{}, errors.New("database down")
}

func TestCreateEventPassesThroughAssetLookupFailure(t *testing.T) {
	app := &appLayer{store: &failingAssetStore{}}
	input := newValidEventInput()

	_, err := app.CreateEvent(&models.UserInternal{Username: "tester"}, input.title, input.slug, input.startsAt, input.endsAt, nil, input.locationName, input.address, input.city, input.state, input.zip, input.assetID, input.featuredImageAltText, input.excerpt, input.body)

	if err == nil || err.Error() != "database down" {
		t.Errorf("error = %v, want database down", err)
	}
}

type missingEventStore struct {
	store.StoreLayer
}

func (m *missingEventStore) GetEvent(id uint) (*store.Event, error) {
	return &store.Event{}, store.ErrEventNotFound
}

func (m *missingEventStore) DeleteEvent(id uint) error {
	return store.ErrEventNotFound
}

func TestMissingEventReturnsEventNotFound(t *testing.T) {
	app := &appLayer{store: &missingEventStore{}}

	_, getErr := app.GetEvent(1)
	deleteErr := app.DeleteEvent(1)

	for _, err := range []error{getErr, deleteErr} {
		if !errors.Is(err, ErrEventNotFound) {
			t.Errorf("error = %v, want ErrEventNotFound", err)
		}
	}
}
