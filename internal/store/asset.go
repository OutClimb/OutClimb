//
// Asset DB Object
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
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"log/slog"
	"net/url"
	"path"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type Asset struct {
	StandardAudit
	FileName string `gorm:"uniqueIndex;not null;size:255"`
	Key      string `gorm:"uniqueIndex;not null;size:64"`
}

func (s *storeLayer) CreateAsset(createdBy, filename, contentType, key, data string) (*Asset, error) {
	// Upload data to bucket
	byteData, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		slog.Error(
			"Bad data input",
			"filename", filename,
			"key", key,
		)
		return nil, errors.New("bad request")
	}

	input := &s3.PutObjectInput{
		Bucket:      aws.String(s.storageConfig.Bucket),
		Key:         aws.String(strings.TrimRight(s.storageConfig.Prefix, "/") + "/" + key),
		Body:        bytes.NewReader(byteData),
		ContentType: aws.String(contentType),
		ACL:         types.ObjectCannedACLPublicRead,
	}

	_, err = s.s3.PutObject(context.TODO(), input)
	if err != nil {
		slog.Error(
			"Unable to upload asset",
			"bucket", s.storageConfig.Bucket,
			"key", strings.TrimRight(s.storageConfig.Prefix, "/")+"/"+key,
			"error", err,
		)
		return nil, err
	}

	// Add to database
	asset := Asset{
		FileName: filename,
		Key:      key,
	}

	asset.CreatedBy = createdBy
	asset.UpdatedBy = createdBy

	if result := s.db.Create(&asset); result.Error != nil {
		return nil, result.Error
	}

	return &asset, nil
}

func (s *storeLayer) DeleteAsset(id uint) error {
	if result := s.db.Delete(&Asset{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) FindAsset(fileName string) (string, error) {
	asset := Asset{}

	if result := s.db.Model(&Asset{}).Where("file_name = ?", fileName).First(&asset); result.Error != nil {
		return "", result.Error
	}

	assetUrl, err := url.Parse(s.storageConfig.Endpoint)
	if err != nil {
		panic(err)
	}
	assetUrl.Host = s.storageConfig.Bucket + "." + assetUrl.Host
	assetUrl.Path = path.Join(assetUrl.Path, s.storageConfig.Prefix, asset.Key)

	return assetUrl.String(), nil
}

func (s *storeLayer) GetAllAssets() (*[]Asset, error) {
	assets := []Asset{}

	if result := s.db.Find(&assets); result.Error != nil {
		return &[]Asset{}, result.Error
	}

	return &assets, nil
}

func (s *storeLayer) GetAsset(id uint) (*Asset, error) {
	asset := Asset{}

	if result := s.db.Where("id = ?", id).First(&asset); result.Error != nil {
		return &Asset{}, result.Error
	}

	return &asset, nil
}

func (s *storeLayer) UpdateAsset(id uint, updatedBy, filename, contentType, data string) (*Asset, error) {
	asset, err := s.GetAsset(id)
	if err != nil {
		return nil, err
	}

	asset.FileName = filename

	if len(data) != 0 {
		byteData, err := base64.StdEncoding.DecodeString(data)
		if err != nil {
			slog.Error(
				"Bad data input",
				"filename", filename,
				"key", asset.Key,
			)
			return nil, errors.New("bad request")
		}

		input := &s3.PutObjectInput{
			Bucket:      aws.String(s.storageConfig.Bucket),
			Key:         aws.String(strings.TrimRight(s.storageConfig.Prefix, "/") + "/" + asset.Key),
			Body:        bytes.NewReader(byteData),
			ContentType: aws.String(contentType),
			ACL:         types.ObjectCannedACLPublicRead,
		}

		_, err = s.s3.PutObject(context.TODO(), input)
		if err != nil {
			slog.Error(
				"Unable to upload asset",
				"bucket", s.storageConfig.Bucket,
				"key", strings.TrimRight(s.storageConfig.Prefix, "/")+"/"+asset.Key,
				"error", err,
			)
			return nil, err
		}
	}

	if result := s.db.Save(&asset); result.Error != nil {
		return nil, result.Error
	}

	return asset, nil
}
