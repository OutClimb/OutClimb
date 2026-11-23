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
	"errors"
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
	event, err := a.internalizeEvent(storedEvent)
	if err != nil {
		return nil, err
	}

	bodyHTML, err := RenderEventBodyHTML(storedEvent.Body)
	if err != nil {
		return nil, err
	}
	event.BodyHTML = bodyHTML

	return event, nil
}

func (a *appLayer) attachFeaturedImage(event *models.EventInternal, storedEvent *store.Event) error {
	if storedEvent.FeaturedImage.ID == 0 {
		return nil
	}

	imageURL, err := a.store.FindAsset(storedEvent.FeaturedImage.FileName)
	if err != nil {
		return err
	}

	event.FeaturedImageURL = imageURL
	event.FeaturedImageType = mime.TypeByExtension(path.Ext(storedEvent.FeaturedImage.FileName))

	return nil
}

func (a *appLayer) internalizeEvent(storedEvent *store.Event) (*models.EventInternal, error) {
	event := &models.EventInternal{}
	event.Internalize(storedEvent)

	if err := a.attachFeaturedImage(event, storedEvent); err != nil {
		return &models.EventInternal{}, err
	}

	return event, nil
}

func (a *appLayer) CreateEvent(user *models.UserInternal, title string, startsAt, endsAt time.Time, locationID *uint, locationName, address, city, state, zip string, featuredImageAssetID uint, featuredImageAltText, excerpt, body string) (*models.EventInternal, error) {
	if err := a.validateEvent(title, startsAt, endsAt, locationName, address, city, state, zip, featuredImageAssetID, excerpt, body); err != nil {
		return &models.EventInternal{}, err
	}

	event, err := a.store.CreateEvent(user.Username, title, startsAt, endsAt, locationID, locationName, address, city, state, zip, featuredImageAssetID, featuredImageAltText, excerpt, body)
	if err != nil {
		return &models.EventInternal{}, err
	}

	return a.internalizeEvent(event)
}

func (a *appLayer) UpdateEvent(user *models.UserInternal, id uint, title string, startsAt, endsAt time.Time, locationID *uint, locationName, address, city, state, zip string, featuredImageAssetID uint, featuredImageAltText, excerpt, body string) (*models.EventInternal, error) {
	if err := a.validateEvent(title, startsAt, endsAt, locationName, address, city, state, zip, featuredImageAssetID, excerpt, body); err != nil {
		return &models.EventInternal{}, err
	}

	event, err := a.store.UpdateEvent(id, user.Username, title, startsAt, endsAt, locationID, locationName, address, city, state, zip, featuredImageAssetID, featuredImageAltText, excerpt, body)
	if err != nil {
		return &models.EventInternal{}, err
	}

	return a.internalizeEvent(event)
}

func (a *appLayer) DeleteEvent(id uint) error {
	return a.store.DeleteEvent(id)
}

func (a *appLayer) GetEvent(id uint) (*models.EventInternal, error) {
	event, err := a.store.GetEvent(id)
	if err != nil {
		return &models.EventInternal{}, err
	}

	return a.internalizeEvent(event)
}

func (a *appLayer) GetAllEvents() (*[]models.EventInternal, error) {
	events, err := a.store.GetAllEvents()
	if err != nil {
		return &[]models.EventInternal{}, err
	}

	eventsInternal := make([]models.EventInternal, len(*events))
	for i := range *events {
		event, err := a.internalizeEvent(&(*events)[i])
		if err != nil {
			return &[]models.EventInternal{}, err
		}
		eventsInternal[i] = *event
	}

	return &eventsInternal, nil
}

func (a *appLayer) validateEvent(title string, startsAt, endsAt time.Time, locationName, address, city, state, zip string, featuredImageAssetID uint, excerpt, body string) error {
	requiredTexts := []string{title, locationName, address, city, state, zip, excerpt, body}
	for _, text := range requiredTexts {
		if len(text) == 0 {
			return errors.New("bad request")
		}
	}

	if startsAt.IsZero() || endsAt.IsZero() || !endsAt.After(startsAt) {
		return errors.New("bad request")
	}

	if featuredImageAssetID == 0 {
		return errors.New("bad request")
	}

	if _, err := a.store.GetAsset(featuredImageAssetID); err != nil {
		if errors.Is(err, store.ErrAssetNotFound) {
			return errors.New("bad request")
		}
		return err
	}

	return nil
}
