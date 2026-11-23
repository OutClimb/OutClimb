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
	"testing"
	"time"

	"github.com/OutClimb/OutClimb/internal/store"
)

type fakeEventStore struct {
	store.StoreLayer
	events      []store.Event
	rangeStart  time.Time
	rangeEnd    time.Time
	assetURLFor map[string]string
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
