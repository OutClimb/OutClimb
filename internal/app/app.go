//
// App Layer
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
	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/store"
	"github.com/OutClimb/OutClimb/internal/utils"
)

type AppLayer interface {
	AuthenticateUser(username string, password string) (*models.UserInternal, error)
	CreateAsset(user *models.UserInternal, fileName, contentType, data string) (*models.AssetInternal, error)
	CreateLocation(user *models.UserInternal, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*models.LocationInternal, error)
	CreateRedirect(user *models.UserInternal, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error)
	DeleteAsset(id uint64) error
	DeleteLocation(id uint64) error
	DeleteRedirect(id uint64) error
	FindAsset(fileName string) (string, error)
	FindRedirect(path string) (*models.RedirectInternal, error)
	GetAllAssets() (*[]models.AssetInternal, error)
	GetAllLocations() (*[]models.LocationInternal, error)
	GetAllRedirects() (*[]models.RedirectInternal, error)
	GetAsset(id uint64) (*models.AssetInternal, error)
	GetLocation(id uint64) (*models.LocationInternal, error)
	GetRedirect(id uint64) (*models.RedirectInternal, error)
	GetUser(userId uint) (*models.UserInternal, error)
	UpdateAsset(user *models.UserInternal, id uint64, fileName, contentType, data string) (*models.AssetInternal, error)
	UpdatePassword(user *models.UserInternal, password string) error
	UpdateLocation(user *models.UserInternal, id uint64, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*models.LocationInternal, error)
	UpdateRedirect(user *models.UserInternal, id uint64, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error)
	ValidatePassword(user *models.UserInternal, password string) error
}

type appLayer struct {
	config *utils.AppConfig
	store  store.StoreLayer
}

func New(storeLayer store.StoreLayer, config *utils.AppConfig) *appLayer {
	return &appLayer{
		config: config,
		store:  storeLayer,
	}
}
