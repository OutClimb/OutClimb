//
// Tag Store
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
	"time"

	"gorm.io/gorm"
)

type Tag struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	Name      string
}

func (s *storeLayer) GetAllTags() (*[]Tag, error) {
	tags := []Tag{}

	if result := s.db.Order("lower(name)").Find(&tags); result.Error != nil {
		return &[]Tag{}, result.Error
	}

	return &tags, nil
}

func findOrCreateTags(tx *gorm.DB, names []string) ([]Tag, error) {
	tags := make([]Tag, 0, len(names))

	for _, name := range names {
		tag := Tag{}
		result := tx.Where("lower(name) = lower(?)", name).Attrs(Tag{Name: name}).FirstOrCreate(&tag)
		if result.Error != nil {
			return nil, result.Error
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func replaceEventTags(tx *gorm.DB, event *Event, names []string) error {
	tags, err := findOrCreateTags(tx, names)
	if err != nil {
		return err
	}

	return tx.Model(event).Association("Tags").Replace(tags)
}

func orderTagsByName(db *gorm.DB) *gorm.DB {
	return db.Order("lower(name)")
}
