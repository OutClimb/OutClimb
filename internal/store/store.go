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
	"log/slog"
	"os"
	"time"

	"github.com/OutClimb/OutClimb/internal/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type StoreLayer interface {
	CreateLocation(createdBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error)
	CreateRedirect(createdBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
	CreateUser(createdBy, email, name, password, username string) (*User, error)
	DeleteLocation(id uint64) error
	DeleteRedirect(id uint64) error
	FindActiveRedirectByPath(path string) (*Redirect, error)
	GetAllLocations() (*[]Location, error)
	GetAllRedirects() (*[]Redirect, error)
	GetLocation(id uint64) (*Location, error)
	GetRedirect(id uint64) (*Redirect, error)
	GetUser(id uint) (*User, error)
	GetUserWithUsername(username string) (*User, error)
	UpdatePassword(id uint, password, updatedBy string) error
	UpdateLocation(id uint64, updatedBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error)
	UpdateRedirect(id uint64, updatedBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
}

type storeLayer struct {
	db *gorm.DB
}

func New(databaseConfig *utils.DatabaseConfig) *storeLayer {
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

	return &storeLayer{
		db: db,
	}
}

func (s *storeLayer) Migrate() {
	err := s.db.AutoMigrate(&User{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "user",
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

	err = s.db.AutoMigrate(&Location{})
	if err != nil {
		slog.Error(
			"Unable to migrate table",
			"databaseTable", "redirect",
			"error", err,
		)
		os.Exit(1)
	}
}
