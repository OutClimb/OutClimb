//
// Store Layer
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

package store

import (
	"log"
	"time"

	"github.com/OutClimb/OutClimb/internal/utils"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type StoreLayer interface {
	CreateRedirect(createdBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
	CreateUser(createdBy, email, name, password, role, username string) (*User, error)
	DeleteRedirect(id uint) error
	FindActiveRedirectByPath(path string) (*Redirect, error)
	GetAllRedirects() (*[]Redirect, error)
	GetRedirect(id uint) (*Redirect, error)
	GetUser(id uint) (*User, error)
	GetUserWithUsername(username string) (*User, error)
	UpdatePassword(id uint, password, updatedBy string) error
	UpdateRedirect(id uint, updatedBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
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
	if len(databaseConfig.TimeZone) > 0 {
		dsn = dsn + " TimeZone=" + databaseConfig.TimeZone
	}
	if databaseConfig.SslDisabled {
		dsn = dsn + " sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn))
	if err != nil {
		log.Fatal("Error: Unable to connect to database", err)
		return nil
	}

	return &storeLayer{
		db: db,
	}
}

func (s *storeLayer) Migrate() {
	err := s.db.AutoMigrate(&User{})
	if err != nil {
		log.Fatal("Error: There was an error while migrating the User table", err)
	}
}
