//
// Event Model
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

package models

import (
	"time"

	"github.com/OutClimb/OutClimb/internal/store"
)

type EventInternal struct {
	Title          string
	Link           string
	Description    string
	ContentEncoded string
	MediaURL       string
	MediaType      string
	PubDate        string
	EventDate      time.Time
	GUID           string
}

func (e *EventInternal) Internalize(event *store.Event) {
	e.Title = event.Title
	e.Link = event.Link
	e.Description = event.Description
	e.ContentEncoded = event.ContentEncoded
	e.MediaURL = event.MediaURL
	e.MediaType = event.MediaType
	e.PubDate = event.PubDate
	e.EventDate = event.EventDate
	e.GUID = event.GUID
}

type EventFeedInternal struct {
	Title       string
	Link        string
	Description string
	Events      []*EventInternal
}

func (f *EventFeedInternal) Internalize(feed *store.EventFeed) {
	f.Title = feed.Title
	f.Link = feed.Link
	f.Description = feed.Description
	f.Events = make([]*EventInternal, 0, len(feed.Events))
	for _, e := range feed.Events {
		ei := &EventInternal{}
		ei.Internalize(e)
		f.Events = append(f.Events, ei)
	}
}
