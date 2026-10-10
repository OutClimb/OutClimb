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
	"crypto/cipher"
	"log/slog"
	"os"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/store"
	"github.com/OutClimb/OutClimb/internal/utils"
	altcha "github.com/altcha-org/altcha-lib-go/v2"
	"golang.org/x/crypto/bcrypt"
)

type AppLayer interface {
	AuthenticateUser(username, password, totpCode string) (*models.UserInternal, error)
	BeginTotpSetup(user *models.UserInternal) (*models.TotpSetupInternal, error)
	CanViewForm(user *models.UserInternal, form *models.FormInternal) bool
	ConfirmTotpSetup(user *models.UserInternal, code string) error
	CreateCaptchaChallenge() (*altcha.Challenge, error)
	CreateAsset(user *models.UserInternal, fileName, contentType, data string) (*models.AssetInternal, error)
	CreateEmail(user *models.UserInternal, name, slug, subject, htmlBody, textBody string) (*models.EmailInternal, error)
	CreateForm(user *models.UserInternal, name, slug string, opensOn, closesOn *int64, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage, confirmationEmailFieldSlug, confirmationEmailSlug, notificationEmailTo, notificationEmailSlug *string, viewableBy []uint, fields []FormFieldInput) (*models.FormInternal, error)
	CreateLocation(user *models.UserInternal, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*models.LocationInternal, error)
	CreateRedirect(user *models.UserInternal, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error)
	CreateRole(user *models.UserInternal, name string, order uint, requireTwoFactor bool, permissions map[string]uint) (*models.RoleInternal, error)
	CreateSubmission(slug string, values map[string]string) (*models.SubmissionInternal, error)
	CreateUser(user *models.UserInternal, disabled bool, email, name, password string, requirePasswordReset bool, username, roleName string) (*models.UserInternal, error)
	DeleteAsset(id uint) error
	DeleteEmail(id uint) error
	DeleteForm(user *models.UserInternal, id uint) error
	DeleteLocation(id uint) error
	DeleteRedirect(id uint) error
	DeleteRole(user *models.UserInternal, id uint) error
	DeleteSubmission(user *models.UserInternal, submissionId uint) error
	DeleteUser(user *models.UserInternal, id uint) error
	FindAsset(fileName string) (string, error)
	FindRedirect(path string) (*models.RedirectInternal, error)
	GetAllAssets() (*[]models.AssetInternal, error)
	GetEventsForMonth(year int, month time.Month) (*models.EventFeedInternal, error)
	GetAllEmails() (*[]models.EmailInternal, error)
	GetAllForms(user *models.UserInternal) (*[]models.FormInternal, error)
	GetAllLocations() (*[]models.LocationInternal, error)
	GetAllRedirects() (*[]models.RedirectInternal, error)
	GetAllRoles() (*[]models.RoleInternal, error)
	GetAllUsers() (*[]models.UserInternal, error)
	GetAsset(id uint) (*models.AssetInternal, error)
	GetEmail(id uint) (*models.EmailInternal, error)
	GetForm(user *models.UserInternal, id uint) (*models.FormInternal, error)
	GetFormViewerCandidates(user *models.UserInternal) (*[]models.UserInternal, error)
	GetFormBySlug(slug string) (*models.FormInternal, error)
	GetLocation(id uint) (*models.LocationInternal, error)
	GetRedirect(id uint) (*models.RedirectInternal, error)
	GetRole(id uint) (*models.RoleInternal, error)
	GetSubmissionsForForm(user *models.UserInternal, formId uint) (*[]models.SubmissionInternal, error)
	GetUser(userId uint) (*models.UserInternal, error)
	UpdateAsset(user *models.UserInternal, id uint, fileName, contentType, data string) (*models.AssetInternal, error)
	UpdateEmail(user *models.UserInternal, id uint, name, slug, subject, htmlBody, textBody string) (*models.EmailInternal, error)
	UpdateForm(user *models.UserInternal, id uint, name, slug string, opensOn, closesOn *int64, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage, confirmationEmailFieldSlug, confirmationEmailSlug, notificationEmailTo, notificationEmailSlug *string, viewableBy []uint, fields []FormFieldInput) (*models.FormInternal, error)
	UpdateFormViewableBy(user *models.UserInternal, id uint, viewableBy []uint) (*models.FormInternal, error)
	UpdateLocation(user *models.UserInternal, id uint, name, mainImageName, individualImageName, backgroundImagePath, color, address, startTime, endTime, description string) (*models.LocationInternal, error)
	UpdatePassword(user *models.UserInternal, password string) error
	UpdateRedirect(user *models.UserInternal, id uint, fromPath, toUrl string, startsOn, stopsOn int64) (*models.RedirectInternal, error)
	UpdateRole(user *models.UserInternal, id uint, name string, order uint, requireTwoFactor bool, permissions map[string]uint) (*models.RoleInternal, error)
	UpdateUser(user *models.UserInternal, id uint, disabled bool, email, name, password string, requirePasswordReset, resetTwoFactor bool, username, roleName string) (*models.UserInternal, error)
	ValidatePassword(username, oldPasswordHash, password string) error
	VerifyCaptcha(encodedPayload string) error
}

type appLayer struct {
	config       *utils.AppConfig
	store        store.StoreLayer
	dummyHash    []byte
	usedCaptchas *usedCaptchas
	totpCipher   cipher.AEAD
}

func New(storeLayer store.StoreLayer, config *utils.AppConfig) *appLayer {
	dummyHash, _ := bcrypt.GenerateFromPassword([]byte("dummy_password"), config.PasswordCost)

	totpCipher, err := newTotpCipher(config.TotpEncryptionKey)
	if err != nil {
		slog.Error(
			"Unable to create totp cipher",
			"layer", "app",
			"entity", "app",
			"error", err,
		)
		os.Exit(1)
		return nil
	}

	return &appLayer{
		config:       config,
		store:        storeLayer,
		dummyHash:    dummyHash,
		usedCaptchas: newUsedCaptchas(),
		totpCipher:   totpCipher,
	}
}
