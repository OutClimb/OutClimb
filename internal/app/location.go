//
// Location Logic
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

	"github.com/OutClimb/OutClimb/internal/app/models"
)

func (a *appLayer) CreateLocation(user *models.UserInternal, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*models.LocationInternal, error) {
	if len(name) == 0 || len(mainImageName) == 0 || len(individualImageName) == 0 || len(backgroundImagePath) == 0 || len(color) == 0 || len(address) == 0 || len(startTime) == 0 || len(endTime) == 0 || len(description) == 0 {
		return &models.LocationInternal{}, errors.New("bad request")
	}

	if location, err := a.store.CreateLocation(user.Username, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description); err != nil {
		return &models.LocationInternal{}, err
	} else {
		locationInternal := models.LocationInternal{}
		locationInternal.Internalize(location)

		return &locationInternal, nil
	}
}

func (a *appLayer) DeleteLocation(id uint64) error {
	if err := a.store.DeleteLocation(id); err != nil {
		return err
	}

	return nil
}

func (a *appLayer) GetLocation(id uint64) (*models.LocationInternal, error) {
	if location, err := a.store.GetLocation(id); err != nil {
		return &models.LocationInternal{}, err
	} else {
		locationInternal := models.LocationInternal{}
		locationInternal.Internalize(location)

		return &locationInternal, nil
	}
}

func (a *appLayer) GetAllLocations() (*[]models.LocationInternal, error) {
	if locations, err := a.store.GetAllLocations(); err != nil {
		return &[]models.LocationInternal{}, err
	} else {
		locationsInternal := make([]models.LocationInternal, len(*locations))
		for i, location := range *locations {
			locationsInternal[i].Internalize(&location)
		}

		return &locationsInternal, nil
	}
}

func (a *appLayer) UpdateLocation(user *models.UserInternal, id uint64, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*models.LocationInternal, error) {
	if len(name) == 0 || len(mainImageName) == 0 || len(individualImageName) == 0 || len(backgroundImagePath) == 0 || len(color) == 0 || len(address) == 0 || len(startTime) == 0 || len(endTime) == 0 || len(description) == 0 {
		return &models.LocationInternal{}, errors.New("bad request")
	}

	if location, err := a.store.UpdateLocation(id, user.Username, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description); err != nil {
		return &models.LocationInternal{}, err
	} else {
		locationInternal := models.LocationInternal{}
		locationInternal.Internalize(location)

		return &locationInternal, nil
	}
}
