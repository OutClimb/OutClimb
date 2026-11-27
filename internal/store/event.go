//
// Event Store
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

package store

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

var ErrEventNotFound = errors.New("event not found")

type Event struct {
	StandardAudit
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
	FeaturedImage        Asset `gorm:"foreignKey:FeaturedImageAssetID"`
	FeaturedImageAltText string
	Excerpt              string
	Body                 string
	Tags                 []Tag `gorm:"many2many:event_tags"`
	Links                []EventLink
}

func (s *storeLayer) CreateEvent(createdBy, title, slug string, startsAt, endsAt time.Time, locationID *uint, locationName, address, city, state, zip string, featuredImageAssetID uint, featuredImageAltText, excerpt, body string, tagNames []string, links []EventLink) (*Event, error) {
	event := Event{
		Title:                title,
		Slug:                 slug,
		StartsAt:             startsAt,
		EndsAt:               endsAt,
		LocationID:           locationID,
		LocationName:         locationName,
		Address:              address,
		City:                 city,
		State:                state,
		Zip:                  zip,
		FeaturedImageAssetID: featuredImageAssetID,
		FeaturedImageAltText: featuredImageAltText,
		Excerpt:              excerpt,
		Body:                 body,
	}

	event.CreatedBy = createdBy
	event.UpdatedBy = createdBy

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if result := tx.Create(&event); result.Error != nil {
			return result.Error
		}

		if err := replaceEventTags(tx, &event, tagNames); err != nil {
			return err
		}

		return replaceEventLinks(tx, event.ID, links)
	})
	if err != nil {
		return nil, err
	}

	return s.GetEvent(event.ID)
}

func (s *storeLayer) DeleteEvent(id uint) error {
	result := s.db.Delete(&Event{}, id)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrEventNotFound
	}

	return nil
}

func (s *storeLayer) EventExistsWithSlug(slug string) (bool, error) {
	var count int64

	if result := s.db.Model(&Event{}).Where("slug = ?", slug).Count(&count); result.Error != nil {
		return false, result.Error
	}

	return count > 0, nil
}

func (s *storeLayer) GetAllEvents() (*[]Event, error) {
	events := []Event{}

	if result := s.db.Preload("FeaturedImage").Preload("Tags", orderTagsByName).Preload("Links", orderLinksByPosition).Order("starts_at").Find(&events); result.Error != nil {
		return &[]Event{}, result.Error
	}

	return &events, nil
}

func (s *storeLayer) GetEvent(id uint) (*Event, error) {
	event := Event{}

	if result := s.db.Preload("FeaturedImage").Preload("Tags", orderTagsByName).Preload("Links", orderLinksByPosition).First(&event, id); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return &Event{}, ErrEventNotFound
		}
		return &Event{}, result.Error
	}

	return &event, nil
}

// GetEventsBetween returns events starting at or after start and before end.
func (s *storeLayer) GetEventsBetween(start, end time.Time) (*[]Event, error) {
	events := []Event{}

	query := s.db.Preload("FeaturedImage").Preload("Tags", orderTagsByName).Preload("Links", orderLinksByPosition).
		Where("starts_at >= ? AND starts_at < ?", start, end).
		Order("starts_at")
	if result := query.Find(&events); result.Error != nil {
		return &[]Event{}, result.Error
	}

	return &events, nil
}

func (s *storeLayer) UpdateEvent(id uint, updatedBy, title, slug string, startsAt, endsAt time.Time, locationID *uint, locationName, address, city, state, zip string, featuredImageAssetID uint, featuredImageAltText, excerpt, body string, tagNames []string, links []EventLink) (*Event, error) {
	event, err := s.GetEvent(id)
	if err != nil {
		return nil, err
	}

	event.UpdatedBy = updatedBy
	event.Title = title
	event.Slug = slug
	event.StartsAt = startsAt
	event.EndsAt = endsAt
	event.LocationID = locationID
	event.LocationName = locationName
	event.Address = address
	event.City = city
	event.State = state
	event.Zip = zip
	event.FeaturedImageAssetID = featuredImageAssetID
	event.FeaturedImageAltText = featuredImageAltText
	event.Excerpt = excerpt
	event.Body = body

	err = s.db.Transaction(func(tx *gorm.DB) error {
		if result := tx.Omit("FeaturedImage", "Tags", "Links").Save(event); result.Error != nil {
			return result.Error
		}

		if err := replaceEventTags(tx, event, tagNames); err != nil {
			return err
		}

		return replaceEventLinks(tx, event.ID, links)
	})
	if err != nil {
		return nil, err
	}

	return s.GetEvent(id)
}
