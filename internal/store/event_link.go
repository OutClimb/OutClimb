//
// Event Link Store
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
	"gorm.io/gorm"
)

type EventLink struct {
	ID       uint `gorm:"primarykey"`
	EventID  uint
	Position int
	Label    string
	URL      string
}

func replaceEventLinks(tx *gorm.DB, eventID uint, links []EventLink) error {
	if result := tx.Where("event_id = ?", eventID).Delete(&EventLink{}); result.Error != nil {
		return result.Error
	}

	if len(links) == 0 {
		return nil
	}

	linksToCreate := make([]EventLink, len(links))
	for i, link := range links {
		linksToCreate[i] = EventLink{EventID: eventID, Position: i, Label: link.Label, URL: link.URL}
	}

	return tx.Create(&linksToCreate).Error
}

func orderLinksByPosition(db *gorm.DB) *gorm.DB {
	return db.Order("position")
}
