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
	"embed"
	"log/slog"
	"os"
	"time"

	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/pressly/goose/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var Entities = [...]string{"asset", "email", "form", "redirect", "location", "social", "user", "role"}

//go:embed migrations/*.sql
var migrations embed.FS

type StoreLayer interface {
	CountSubmissionsForForm(formId uint) (int64, error)
	CreateAsset(createdBy, filename, key, contentType, data string) (*Asset, error)
	CreateEmail(createdBy, name, slug, subject, htmlBody, textBody string) (*Email, error)
	CreateForm(createdBy, name, slug string, opensOn, closesOn *time.Time, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage, confirmationEmailFieldSlug, confirmationEmailSlug, notificationEmailTo, notificationEmailSlug *string) (*Form, error)
	CreateFormField(createdBy string, formId uint, name, slug, fieldType string, metadata, validation *string, required bool, order uint) (*FormField, error)
	CreateLocation(createdBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error)
	CreatePermission(roleId uint, level PermissionLevel, entity string) (*Permission, error)
	CreateRedirect(createdBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
	CreateRole(createdBy, name string, order uint) (*Role, error)
	CreateSubmission(formId uint) (*Submission, error)
	CreateSubmissionValue(submissionId, formFieldId uint, value string) (*SubmissionValue, error)
	CreateUser(createdBy string, disabled bool, email, name, password string, requirePasswordReset bool, username string, roleId uint) (*User, error)
	DeleteAsset(id uint) error
	DeleteEmail(id uint) error
	DeleteForm(id uint) error
	DeleteFormField(id uint) error
	DeleteFormFieldForForm(formId uint) error
	DeleteLocation(id uint) error
	DeletePermission(id uint) error
	DeleteRedirect(id uint) error
	DeleteRole(id uint) error
	DeleteSubmission(id uint) error
	DeleteSubmissionsForForm(formId uint) error
	DeleteSubmissionValue(id uint) error
	DeleteSubmissionValuesForForm(formId uint) error
	DeleteSubmissionValuesForSubmission(submissionId uint) error
	DeleteUser(id uint) error
	FindActiveRedirectByPath(path string) (*Redirect, error)
	GetAllEvents() (*EventFeed, error)
	FindAsset(fileName string) (string, error)
	GetAllAssets() (*[]Asset, error)
	GetAllEmails() (*[]Email, error)
	GetAllForms() (*[]Form, error)
	GetAllFormFields() (*[]FormField, error)
	GetAllFormFieldsForForm(formId uint) (*[]FormField, error)
	GetAllLocations() (*[]Location, error)
	GetAllPermissions() (*[]Permission, error)
	GetAllRedirects() (*[]Redirect, error)
	GetAllRoles() (*[]Role, error)
	GetAllSubmissions() (*[]Submission, error)
	GetAllSubmissionValue() (*[]SubmissionValue, error)
	GetAllSubmissionValueForSubmission(submissionId uint) (*[]SubmissionValue, error)
	GetAllUsers() (*[]User, error)
	GetAsset(id uint) (*Asset, error)
	GetEmail(id uint) (*Email, error)
	GetEmailWithSlug(slug string) (*Email, error)
	GetForm(id uint) (*Form, error)
	GetFormField(id uint) (*FormField, error)
	GetFormWithSlug(slug string) (*Form, error)
	GetLocation(id uint) (*Location, error)
	GetPermission(id uint) (*Permission, error)
	GetPermissionsWithRole(roleId uint) (*[]Permission, error)
	GetPermissionWithRoleAndAccess(roleId, accessId uint) (*Permission, error)
	GetRedirect(id uint) (*Redirect, error)
	GetRole(id uint) (*Role, error)
	GetRoleWithName(name string) (*Role, error)
	GetSubmission(id uint) (*Submission, error)
	GetSubmissionsForForm(formId uint) (*[]Submission, error)
	GetSubmissionValue(id uint) (*SubmissionValue, error)
	GetUser(id uint) (*User, error)
	GetUsersWithRole(roleId uint) (*[]User, error)
	GetUserWithUsername(username string) (*User, error)
	SetFormViewableBy(formId uint, userIds []uint) error
	UpdateAsset(id uint, updatedBy, filename, contentType, data string) (*Asset, error)
	UpdateEmail(id uint, updatedBy, name, slug, subject, htmlBody, textBody string) (*Email, error)
	UpdateForm(id uint, updatedBy, name, slug string, opensOn, closesOn *time.Time, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage, confirmationEmailFieldSlug, confirmationEmailSlug, notificationEmailTo, notificationEmailSlug *string) (*Form, error)
	UpdateFormField(id uint, updatedBy, name, slug, fieldType string, metadata, validation *string, required bool, order uint) (*FormField, error)
	UpdateLocation(id uint, updatedBy, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*Location, error)
	UpdatePermission(id uint, level PermissionLevel) (*Permission, error)
	UpdatePassword(id uint, password, updatedBy string) error
	UpdateRedirect(id uint, updatedBy, fromPath, toUrl string, startsOn, stopsOn *time.Time) (*Redirect, error)
	UpdateRole(id uint, updatedBy, name string, order uint) (*Role, error)
	UpdateSubmissionValue(id uint, value string) (*SubmissionValue, error)
	UpdateUser(id uint, updatedBy string, disabled bool, email, name, password string, requirePasswordReset bool, username string, roleId uint) (*User, error)
	WithTransaction(fn func(StoreLayer) error) error
}

type storeLayer struct {
	db            *gorm.DB
	s3            *s3.Client
	storageConfig *utils.StorageConfig
	storeConfig   *utils.StoreConfig
}

func New(databaseConfig *utils.DatabaseConfig, storeConfig *utils.StoreConfig, storageConfig *utils.StorageConfig) *storeLayer {
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
			"layer", "store",
			"entity", "store",
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

	cfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(storageConfig.Region),
		awsconfig.WithCredentialsProvider(creds))
	if err != nil {
		slog.Error(
			"Unable to connect to storage",
			"layer", "store",
			"entity", "store",
			"storageEndpoint", storageConfig.Endpoint,
			"storageRegion", storageConfig.Region,
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
		storeConfig:   storeConfig,
	}
}

func (s *storeLayer) Migrate() {
	sqlDB, err := s.db.DB()
	if err != nil {
		slog.Error(
			"Unable to get database connection for migrations",
			"layer", "store",
			"entity", "store",
			"error", err,
		)
		os.Exit(1)
	}

	goose.SetBaseFS(migrations)
	if err := goose.SetDialect("postgres"); err != nil {
		slog.Error(
			"Unable to run database migrations",
			"layer", "store",
			"entity", "store",
			"error", err,
		)
		os.Exit(1)
	}

	if err := goose.Up(sqlDB, "migrations"); err != nil {
		slog.Error(
			"Unable to run database migrations",
			"layer", "store",
			"entity", "store",
			"error", err,
		)
		os.Exit(1)
	}
}

func (s *storeLayer) WithTransaction(fn func(StoreLayer) error) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		return fn(&storeLayer{db: tx, s3: s.s3, storageConfig: s.storageConfig, storeConfig: s.storeConfig})
	})
}
