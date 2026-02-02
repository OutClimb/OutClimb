//
// Location DB Object
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

type Location struct {
	StandardAudit
	Name                string
	MainImageName       string
	IndividualImageName string
	BackgroundImagePath string
	Color               string
	Address             string
	StartTime           string
	EndTime             string
	Description         string
}

func (s *storeLayer) CreateLocation(createdBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error) {
	location := Location{
		Name:                name,
		MainImageName:       mainImageName,
		IndividualImageName: individualImageName,
		BackgroundImagePath: backgroundImagePath,
		Color:               color,
		Address:             address,
		StartTime:           startTime,
		EndTime:             endTime,
		Description:         description,
	}

	location.CreatedBy = createdBy
	location.UpdatedBy = createdBy

	if result := s.db.Create(&location); result.Error != nil {
		return nil, result.Error
	}

	return &location, nil
}

func (s *storeLayer) DeleteLocation(id uint) error {
	if result := s.db.Delete(&Location{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllLocations() (*[]Location, error) {
	locations := []Location{}

	if result := s.db.Find(&locations); result.Error != nil {
		return &[]Location{}, result.Error
	}

	return &locations, nil
}

func (s *storeLayer) GetLocation(id uint) (*Location, error) {
	location := Location{}

	if result := s.db.Where("id = ?", id).First(&location); result.Error != nil {
		return &Location{}, result.Error
	}

	return &location, nil
}

func (s *storeLayer) UpdateLocation(id uint, updatedBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error) {
	location, err := s.GetLocation(id)
	if err != nil {
		return nil, err
	}

	location.UpdatedBy = updatedBy
	location.Name = name
	location.MainImageName = mainImageName
	location.IndividualImageName = individualImageName
	location.BackgroundImagePath = backgroundImagePath
	location.Color = color
	location.Address = address
	location.StartTime = startTime
	location.EndTime = endTime
	location.Description = description

	if result := s.db.Save(&location); result.Error != nil {
		return nil, result.Error
	}

	return location, nil
}
