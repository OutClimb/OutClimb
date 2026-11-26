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
	ID                   uint
	Title                string
	Slug                 string
	StartsAt             time.Time
	EndsAt               time.Time
	LocationID           *uint
	LocationName         string
	Address              string
	City                 string
	State                string
	Zip                  string
	FeaturedImageAssetID uint
	FeaturedImageAltText string
	FeaturedImageURL     string
	FeaturedImageType    string
	Excerpt              string
	Body                 string
	BodyHTML             string
	Tags                 []string
	Links                []EventLinkInternal
}

type EventLinkInternal struct {
	Label string
	URL   string
}

func (e *EventInternal) Internalize(event *store.Event) {
	e.ID = event.ID
	e.Title = event.Title
	e.Slug = event.Slug
	e.StartsAt = event.StartsAt
	e.EndsAt = event.EndsAt
	e.LocationID = event.LocationID
	e.LocationName = event.LocationName
	e.Address = event.Address
	e.City = event.City
	e.State = event.State
	e.Zip = event.Zip
	e.FeaturedImageAssetID = event.FeaturedImageAssetID
	e.FeaturedImageAltText = event.FeaturedImageAltText
	e.Excerpt = event.Excerpt
	e.Body = event.Body

	e.Tags = make([]string, len(event.Tags))
	for i, tag := range event.Tags {
		e.Tags[i] = tag.Name
	}

	e.Links = make([]EventLinkInternal, len(event.Links))
	for i, link := range event.Links {
		e.Links[i] = EventLinkInternal{Label: link.Label, URL: link.URL}
	}
}

type EventFeedInternal struct {
	Title       string
	Link        string
	Description string
	Events      []*EventInternal
}
