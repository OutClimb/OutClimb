//
// Redirect DB Object
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

import "time"

type Redirect struct {
	StandardAudit
	FromPath string `gorm:"not null"`
	ToUrl    string `gorm:"not null"`
	StartsOn *time.Time
	StopsOn  *time.Time
}

func (s *storeLayer) CreateRedirect(createdBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error) {
	redirect := Redirect{
		FromPath: fromPath,
		StartsOn: startsOn,
		StopsOn:  stopsOn,
		ToUrl:    toUrl,
	}

	redirect.CreatedBy = createdBy
	redirect.UpdatedBy = createdBy

	if result := s.db.Create(&redirect); result.Error != nil {
		return nil, result.Error
	}

	return &redirect, nil
}

func (s *storeLayer) DeleteRedirect(id uint) error {
	if result := s.db.Delete(&Redirect{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) FindActiveRedirectByPath(path string) (*Redirect, error) {
	redirect := Redirect{}

	if result := s.db.Model(&Redirect{}).Where("from_path = ? AND (starts_on IS NULL or starts_on <= NOW()) AND (stops_on IS NULL or stops_on > NOW())", path).First(&redirect); result.Error != nil {
		return &Redirect{}, result.Error
	}

	return &redirect, nil
}

func (s *storeLayer) GetAllRedirects() (*[]Redirect, error) {
	redirects := []Redirect{}

	if result := s.db.Find(&redirects); result.Error != nil {
		return &[]Redirect{}, result.Error
	}

	return &redirects, nil
}

func (s *storeLayer) GetRedirect(id uint) (*Redirect, error) {
	redirect := Redirect{}

	if result := s.db.Where("id = ?", id).First(&redirect); result.Error != nil {
		return &Redirect{}, result.Error
	}

	return &redirect, nil
}

func (s *storeLayer) UpdateRedirect(id uint, updatedBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error) {
	redirect, err := s.GetRedirect(id)
	if err != nil {
		return nil, err
	}

	redirect.FromPath = fromPath
	redirect.StartsOn = startsOn
	redirect.StopsOn = stopsOn
	redirect.ToUrl = toUrl
	redirect.UpdatedBy = updatedBy

	if result := s.db.Save(&redirect); result.Error != nil {
		return nil, result.Error
	}

	return redirect, nil
}
