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

package responses

import (
	"encoding/xml"
	"strings"
	"testing"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
)

func TestPublicizeMapsEventToRSSItem(t *testing.T) {
	lateNovemberEvent := &models.EventInternal{
		ID:                   9,
		Title:                "Night Climb",
		StartsAt:             time.Date(2026, time.December, 1, 5, 30, 0, 0, time.UTC),
		Excerpt:              "Climb after dark",
		BodyHTML:             "&lt;b&gt;hi&lt;/b&gt;",
		FeaturedImageURL:     "https://assets.example.test/poster",
		FeaturedImageType:    "image/png",
		FeaturedImageAltText: "A climber on a purple wall",
		Tags:                 []string{"Bouldering", "Free & Fun"},
	}
	feed := &models.EventFeedInternal{Title: "T", Link: "L", Description: "D", Events: []*models.EventInternal{lateNovemberEvent}}

	var resp EventFeedPublic
	resp.Publicize(feed)
	output, err := xml.Marshal(resp)
	if err != nil {
		t.Fatalf("unexpected error %v", err)
	}
	got := string(output)

	wantFragments := []string{
		"<pubDate>Mon, 30 Nov 2026 23:30:00 -0600</pubDate>",
		"<description>Climb after dark</description>",
		`<guid isPermaLink="false">event-9</guid>`,
		"<![CDATA[&lt;b&gt;hi&lt;/b&gt;]]>",
		`url="https://assets.example.test/poster"`,
		`type="image/png"`,
		"A climber on a purple wall</description>",
		"<category>Bouldering</category>",
		"<category>Free &amp; Fun</category>",
	}
	for _, fragment := range wantFragments {
		if !strings.Contains(got, fragment) {
			t.Errorf("feed missing %q in %s", fragment, got)
		}
	}
	if strings.Count(got, "<link>") != 1 {
		t.Errorf("want only the channel link, got: %s", got)
	}
}

func TestPublicizeOmitsMediaAndContentWhenEmpty(t *testing.T) {
	feed := &models.EventFeedInternal{Events: []*models.EventInternal{{ID: 1, Title: "Bare", StartsAt: time.Now()}}}

	var resp EventFeedPublic
	resp.Publicize(feed)
	output, err := xml.Marshal(resp)
	if err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	if strings.Contains(string(output), "content") || strings.Contains(string(output), "<category") {
		t.Errorf("unexpected media, content or category element: %s", output)
	}
}
