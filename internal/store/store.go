//
// Store Layer
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
	"context"
	"errors"
	"log/slog"
	"os"
	"time"

	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type StoreLayer interface {
	CreateAsset(createdBy, filename, key, contentType, data string) (*Asset, error)
	CreateLocation(createdBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error)
	CreatePermission(roleId uint, level PermissionLevel, entity string) (*Permission, error)
	CreateRedirect(createdBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
	CreateRole(createdBy, name string) (*Role, error)
	CreateUser(createdBy string, disabled bool, email, name, password string, requirePasswordReset bool, username string, roleId uint) (*User, error)
	DeleteAsset(id uint) error
	DeleteLocation(id uint) error
	DeletePermission(id uint) error
	DeleteRedirect(id uint) error
	DeleteRole(id uint) error
	DeleteUser(id uint) error
	FindActiveRedirectByPath(path string) (*Redirect, error)
	FindAsset(fileName string) (string, error)
	GetAllAssets() (*[]Asset, error)
	GetAllLocations() (*[]Location, error)
	GetAllPermissions() (*[]Permission, error)
	GetAllRedirects() (*[]Redirect, error)
	GetAllRoles() (*[]Role, error)
	GetAllUsers() (*[]User, error)
	GetAsset(id uint) (*Asset, error)
	GetLocation(id uint) (*Location, error)
	GetPermission(id uint) (*Permission, error)
	GetPermissionsWithRole(roleId uint) (*[]Permission, error)
	GetPermissionWithRoleAndAccess(roleId, accessId uint) (*Permission, error)
	GetRedirect(id uint) (*Redirect, error)
	GetRole(id uint) (*Role, error)
	GetRoleWithName(name string) (*Role, error)
	GetUser(id uint) (*User, error)
	GetUsersWithRole(roleId uint) (*[]User, error)
	GetUserWithUsername(username string) (*User, error)
	UpdateAsset(id uint, updatedBy, filename, contentType, data string) (*Asset, error)
	UpdateLocation(id uint, updatedBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error)
	UpdatePermission(id uint, level PermissionLevel) (*Permission, error)
	UpdatePassword(id uint, password, updatedBy string) error
	UpdateRedirect(id uint, updatedBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
	UpdateRole(id uint, updatedBy, name string) (*Role, error)
	UpdateUser(id uint, updatedBy string, disabled bool, email, name, password string, requirePasswordReset bool, username string, roleId uint) (*User, error)
}

type storeLayer struct {
	db            *gorm.DB
	s3            *s3.Client
	storageConfig *utils.StorageConfig
}

func New(databaseConfig *utils.DatabaseConfig, storageConfig *utils.StorageConfig) *storeLayer {
	// Postgres
	dsn := "host=" + databaseConfig.Host
	dsn = dsn + " user=" + databaseConfig.Username
	if len(databaseConfig.Password) > 0 {
		dsn = dsn + " password=" + databaseConfig.Password
	}
	dsn = dsn + " dbname=" + databaseConfig.Name
	if len(databaseConfig.Port) > 0 {
		dsn = dsn + " port=" + databaseConfig.Port
	}
	if len(databaseConfig.Params) > 0 {
		dsn = dsn + " " + databaseConfig.Params
	}

	db, err := gorm.Open(postgres.Open(dsn))
	if err != nil {
		slog.Error(
			"Unable to connect to database",
			"databaseHost", databaseConfig.Host,
			"databaseName", databaseConfig.Name,
			"databasePort", databaseConfig.Port,
			"databaseUser", databaseConfig.Username,
			"error", err,
		)
		os.Exit(1)
		return nil
	}

	// S3
	creds := credentials.NewStaticCredentialsProvider(storageConfig.AccessKey, storageConfig.SecretKey, "")

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(storageConfig.Region),
		config.WithCredentialsProvider(creds))
	if err != nil {
		slog.Error(
			"Unable to connect to storage",
			"storageEndpoint", storageConfig.Endpoint,
			"storageRegion", storageConfig.Region,
			"storageAccessKey", storageConfig.AccessKey,
		)
		os.Exit(1)
		return nil
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(storageConfig.Endpoint)
	})

	return &storeLayer{
		db:            db,
		s3:            client,
		storageConfig: storageConfig,
	}
}

func (s *storeLayer) Migrate() {
	err := s.db.AutoMigrate(&Asset{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "asset",
			"error", err,
		)
		os.Exit(1)
	}

	err = s.db.AutoMigrate(&Location{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "location",
			"error", err,
		)
		os.Exit(1)
	}

	err = s.db.AutoMigrate(&Permission{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "permission",
			"error", err,
		)
		os.Exit(1)
	}

	err = s.db.AutoMigrate(&Redirect{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "redirect",
			"error", err,
		)
		os.Exit(1)
	}

	err = s.db.AutoMigrate(&Role{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "role",
			"error", err,
		)
		os.Exit(1)
	}

	err = s.db.AutoMigrate(&User{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "user",
			"error", err,
		)
		os.Exit(1)
	}

	// Create owner role
	if result := s.db.Where("name = 'Owner'").First(&Role{}); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			_, err := s.CreateRole("system", "Owner")
			if err != nil {
				slog.Error(
					"Unable to create owner role",
					"error", err,
				)
				os.Exit(1)
			}
		} else {
			slog.Error(
				"Unable to query on role table",
				"error", result.Error,
			)
			os.Exit(1)
		}
	}

	// Create admin role
	adminRole := Role{}
	if result := s.db.Where("name = 'Admin'").First(&adminRole); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			role, err := s.CreateRole("system", "Admin")
			if err != nil {
				slog.Error(
					"Unable to create admin role",
					"error", err,
				)
				os.Exit(1)
			}

			entities := []string{"asset", "form", "redirect", "location", "social", "user"}
			for _, entity := range entities {
				_, err = s.CreatePermission(role.ID, LevelWrite, entity)
				if err != nil {
					slog.Error(
						"Unable to create permission",
						"roleID", role.ID,
						"entity", entity,
					)
					os.Exit(1)
				}
			}
		} else {
			slog.Error(
				"Unable to query on role table",
				"error", result.Error,
			)
			os.Exit(1)
		}
	}

	// Create the user permission on the admin role if the admin role already existed
	if result := s.db.Where("role_id = ? AND entity = 'user'", adminRole.ID).First(&Permission{}); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			_, err = s.CreatePermission(adminRole.ID, LevelWrite, "user")
			if err != nil {
				slog.Error(
					"Unable to create permission",
					"roleID", adminRole.ID,
					"entity", "user",
				)
				os.Exit(1)
			}
		} else {
			slog.Error(
				"Unable to query on permission table",
				"error", result.Error,
			)
			os.Exit(1)
		}
	}

	// Apply admin roles to users who don't have roles
	if result := s.db.Where("role_id = 0").Find(&[]User{}); result.Error == nil {
		role, err := s.GetRoleWithName("Admin")
		if err != nil {
			slog.Error(
				"Unable to find admin role",
				"error", err,
			)
			os.Exit(1)
		}

		s.db.Model(&User{}).Where("role_id = 0").UpdateColumn("role_id", gorm.Expr("?", role.ID))
	}
}
