//
// Events App
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

package app

import (
	"html"
	"mime"
	"path"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/store"
)

const (
	eventsTimezoneName    = "America/Chicago"
	eventsFeedTitle       = "OutClimb Events"
	eventsFeedLink        = "https://outclimb.gay/events"
	eventsFeedDescription = "Upcoming events from OutClimb"
)

func (a *appLayer) GetEventsForMonth(year int, month time.Month) (*models.EventFeedInternal, error) {
	centralTime, err := time.LoadLocation(eventsTimezoneName)
	if err != nil {
		return nil, err
	}

	monthStart := time.Date(year, month, 1, 0, 0, 0, 0, centralTime)
	nextMonthStart := monthStart.AddDate(0, 1, 0)

	events, err := a.store.GetEventsBetween(monthStart, nextMonthStart)
	if err != nil {
		return nil, err
	}

	feed := &models.EventFeedInternal{
		Title:       eventsFeedTitle,
		Link:        eventsFeedLink,
		Description: eventsFeedDescription,
		Events:      make([]*models.EventInternal, 0, len(*events)),
	}

	for i := range *events {
		event, err := a.buildFeedEvent(&(*events)[i])
		if err != nil {
			return nil, err
		}
		feed.Events = append(feed.Events, event)
	}

	return feed, nil
}

func (a *appLayer) buildFeedEvent(storedEvent *store.Event) (*models.EventInternal, error) {
	event := &models.EventInternal{}
	event.Internalize(storedEvent)
	event.BodyHTML = html.EscapeString(storedEvent.Body)

	if storedEvent.FeaturedImage.ID == 0 {
		return event, nil
	}

	imageURL, err := a.store.FindAsset(storedEvent.FeaturedImage.FileName)
	if err != nil {
		return nil, err
	}

	event.FeaturedImageURL = imageURL
	event.FeaturedImageType = mime.TypeByExtension(path.Ext(storedEvent.FeaturedImage.FileName))

	return event, nil
}
