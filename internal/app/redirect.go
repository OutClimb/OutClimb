//
// Redirect Logic
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
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
)

func (a *appLayer) CreateRedirect(user *models.UserInternal, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error) {
	startsOnTime := time.UnixMilli(startsOn)
	stopsOnTime := time.UnixMilli(stopsOn)

	if redirect, err := a.store.CreateRedirect(user.Username, fromPath, toUrl, &startsOnTime, &stopsOnTime); err != nil {
		return &models.RedirectInternal{}, err
	} else {
		redirectInternal := models.RedirectInternal{}
		redirectInternal.Internalize(redirect)

		return &redirectInternal, nil
	}
}

func (a *appLayer) DeleteRedirect(id uint) error {
	if err := a.store.DeleteRedirect(id); err != nil {
		return err
	}

	return nil
}

func (a *appLayer) FindRedirect(path string) (*models.RedirectInternal, error) {
	if redirect, err := a.store.FindActiveRedirectByPath(path); err != nil {
		return &models.RedirectInternal{}, err
	} else {
		redirectInternal := models.RedirectInternal{}
		redirectInternal.Internalize(redirect)

		return &redirectInternal, nil
	}
}

func (a *appLayer) GetRedirect(id uint) (*models.RedirectInternal, error) {
	if redirect, err := a.store.GetRedirect(id); err != nil {
		return &models.RedirectInternal{}, err
	} else {
		redirectInternal := models.RedirectInternal{}
		redirectInternal.Internalize(redirect)

		return &redirectInternal, nil
	}
}

func (a *appLayer) GetAllRedirects() (*[]models.RedirectInternal, error) {
	if redirects, err := a.store.GetAllRedirects(); err != nil {
		return &[]models.RedirectInternal{}, err
	} else {
		redirectsInternal := make([]models.RedirectInternal, len(*redirects))
		for i, redirect := range *redirects {
			redirectsInternal[i].Internalize(&redirect)
		}

		return &redirectsInternal, nil
	}
}

func (a *appLayer) UpdateRedirect(user *models.UserInternal, id uint, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error) {
	startsOnTime := time.UnixMilli(startsOn)
	stopsOnTime := time.UnixMilli(stopsOn)

	if redirect, err := a.store.UpdateRedirect(id, user.Username, fromPath, toUrl, &startsOnTime, &stopsOnTime); err != nil {
		return &models.RedirectInternal{}, err
	} else {
		redirectInternal := models.RedirectInternal{}
		redirectInternal.Internalize(redirect)

		return &redirectInternal, nil
	}
}
