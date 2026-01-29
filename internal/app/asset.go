//
// Asset Logic
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
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/google/uuid"
)

func (a *appLayer) CreateAsset(user *models.UserInternal, fileName, contentType, data string) (*models.AssetInternal, error) {
	if len(fileName) == 0 || len(data) == 0 {
		return &models.AssetInternal{}, errors.New("bad request")
	}

	hash := sha256.New()
	hash.Write([]byte(user.Username + "-" + time.Now().String() + "-" + uuid.New().String()))
	key := hex.EncodeToString(hash.Sum(nil))

	if asset, err := a.store.CreateAsset(user.Username, fileName, contentType, key, data); err != nil {
		return &models.AssetInternal{}, err
	} else {
		assetInternal := models.AssetInternal{}
		assetInternal.Internalize(asset)

		return &assetInternal, nil
	}
}

func (a *appLayer) DeleteAsset(id uint) error {
	if err := a.store.DeleteAsset(id); err != nil {
		return err
	}

	return nil
}

func (a *appLayer) GetAsset(id uint) (*models.AssetInternal, error) {
	if asset, err := a.store.GetAsset(id); err != nil {
		return &models.AssetInternal{}, err
	} else {
		assetInternal := models.AssetInternal{}
		assetInternal.Internalize(asset)

		return &assetInternal, nil
	}
}

func (a *appLayer) FindAsset(fileName string) (string, error) {
	if assetUrl, err := a.store.FindAsset(fileName); err != nil {
		return "", err
	} else {
		return assetUrl, nil
	}
}

func (a *appLayer) GetAllAssets() (*[]models.AssetInternal, error) {
	if assets, err := a.store.GetAllAssets(); err != nil {
		return &[]models.AssetInternal{}, err
	} else {
		assetsInternal := make([]models.AssetInternal, len(*assets))
		for i, asset := range *assets {
			assetsInternal[i].Internalize(&asset)
		}

		return &assetsInternal, nil
	}
}

func (a *appLayer) UpdateAsset(user *models.UserInternal, id uint, fileName, contentType, data string) (*models.AssetInternal, error) {
	if len(fileName) == 0 {
		return &models.AssetInternal{}, errors.New("bad request")
	}

	if asset, err := a.store.UpdateAsset(id, user.Username, fileName, contentType, data); err != nil {
		return &models.AssetInternal{}, err
	} else {
		assetInternal := models.AssetInternal{}
		assetInternal.Internalize(asset)

		return &assetInternal, nil
	}
}
