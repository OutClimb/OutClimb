//
// App Layer
// Copyright 2025 OutClimb
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
)

type AppLayer interface {
	AuthenticateUser(username string, password string) (*models.UserInternal, error)
	CreateRedirect(user *models.UserInternal, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error)
	DeleteRedirect(id uint) error
	FindRedirect(path string) (*models.RedirectInternal, error)
	GetAllRedirects() (*[]models.RedirectInternal, error)
	GetRedirect(id uint) (*models.RedirectInternal, error)
	GetUser(userId uint) (*models.UserInternal, error)
	UpdatePassword(user *models.UserInternal, password string) error
	UpdateRedirect(user *models.UserInternal, id uint, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error)
	ValidatePassword(user *models.UserInternal, password string) error
}

type appLayer struct {
	store store.StoreLayer
}

func New(storeLayer store.StoreLayer) *appLayer {
	return &appLayer{
		store: storeLayer,
	}
}
