//
// User Logic
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
	"errors"
	"log/slog"
	"regexp"
	"strings"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"golang.org/x/crypto/bcrypt"
)

func (a *appLayer) AuthenticateUser(username string, password string) (*models.UserInternal, error) {
	if user, err := a.store.GetUserWithUsername(username); err != nil {
		return &models.UserInternal{}, err
	} else if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return &models.UserInternal{}, errors.New("invalid password")
	} else {
		userInternal := models.UserInternal{}
		userInternal.Internalize(user)

		return &userInternal, nil
	}
}

func (a *appLayer) GetUser(userId uint) (*models.UserInternal, error) {
	if user, err := a.store.GetUser(userId); err != nil {
		return &models.UserInternal{}, err
	} else {
		userInternal := models.UserInternal{}
		userInternal.Internalize(user)

		return &userInternal, nil
	}
}

func (a *appLayer) UpdatePassword(user *models.UserInternal, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), a.config.PasswordCost)
	if err != nil {
		slog.Error("Failed to hash password", "username", user.Username, "error", err)
		return errors.New("failed to hash password")
	}

	if err := a.store.UpdatePassword(user.ID, string(hashedPassword), user.Username); err != nil {
		return errors.New("failed to update password")
	}

	return nil
}

func (a *appLayer) ValidatePassword(user *models.UserInternal, password string) error {
	if len(password) < 16 {
		return errors.New("password must be at least 16 characters")
	} else if len(password) > 72 {
		return errors.New("password must be at most 72 characters")
	} else if symbolMatched, _ := regexp.MatchString("[^a-zA-Z0-9]", password); !symbolMatched {
		return errors.New("password must contain a symbol")
	} else if numberMatched, _ := regexp.MatchString("[0-9]", password); !numberMatched {
		return errors.New("password must contain a number")
	} else if upperMatched, _ := regexp.MatchString("[A-Z]", password); !upperMatched {
		return errors.New("password must contain an uppercase letter")
	} else if lowerMatched, _ := regexp.MatchString("[a-z]", password); !lowerMatched {
		return errors.New("password must contain a lowercase letter")
	} else if strings.Contains(password, user.Username) {
		return errors.New("password must not contain the username")
	} else if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err == nil {
		return errors.New("password must be different from the current password")
	}

	return nil
}
