//
// User Logic
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
	"errors"
	"log/slog"
	"regexp"
	"strings"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/store"
	"golang.org/x/crypto/bcrypt"
)

func (a *appLayer) assertActorOutranks(actor *models.UserInternal, targetRole *store.Role) error {
	actorRole, err := a.store.GetRoleWithName(actor.Role)
	if err != nil {
		return errors.New("internal server error")
	}

	// Skip for role with highest privilege
	if actorRole.Order != 0 && actorRole.Order > targetRole.Order {
		return errors.New("forbidden")
	}

	return nil
}

func (a *appLayer) AuthenticateUser(username string, password string) (*models.UserInternal, error) {
	if user, err := a.store.GetUserWithUsername(username); err != nil {
		return &models.UserInternal{}, err
	} else if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return &models.UserInternal{}, errors.New("invalid password")
	} else if role, err := a.store.GetRole(user.RoleId); err != nil {
		return &models.UserInternal{}, err
	} else if permissions, err := a.store.GetPermissionsWithRole(user.RoleId); err != nil {
		return &models.UserInternal{}, err
	} else {
		userInternal := models.UserInternal{}
		userInternal.Internalize(user, role, permissions)

		return &userInternal, nil
	}
}

func (a *appLayer) CreateUser(user *models.UserInternal, disabled bool, email, name, password string, requirePasswordReset bool, username, roleName string) (*models.UserInternal, error) {
	if len(email) == 0 || len(name) == 0 || len(username) == 0 || len(roleName) == 0 {
		return &models.UserInternal{}, errors.New("bad request")
	}

	role, err := a.store.GetRoleWithName(roleName)
	if err != nil {
		return &models.UserInternal{}, errors.New("bad request")
	}

	if err := a.assertActorOutranks(user, role); err != nil {
		return &models.UserInternal{}, err
	}

	permissions, err := a.store.GetPermissionsWithRole(role.ID)
	if err != nil {
		slog.Error(
			"Could not get permissions for role",
			"layer", "app",
			"entity", "user",
			"id", role.ID,
			"error", err,
		)
		return &models.UserInternal{}, errors.New("internal server error")
	}

	if err := a.ValidatePassword(username, "", password); err != nil {
		return &models.UserInternal{}, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), a.config.PasswordCost)
	if err != nil {
		slog.Error(
			"Failed to hash password",
			"layer", "app",
			"entity", "user",
			"username", user.Username,
			"error", err,
		)
		return &models.UserInternal{}, errors.New("failed to hash password")
	}

	if newUser, err := a.store.CreateUser(user.Username, disabled, email, name, string(hashedPassword), requirePasswordReset, username, role.ID); err != nil {
		return &models.UserInternal{}, err
	} else {
		userInternal := models.UserInternal{}
		userInternal.Internalize(newUser, role, permissions)

		return &userInternal, nil
	}
}

func (a *appLayer) DeleteUser(user *models.UserInternal, id uint) error {
	if userBeingDeleted, err := a.GetUser(id); err != nil {
		slog.Error(
			"Could not get user being deleted",
			"layer", "app",
			"entity", "user",
			"id", id,
			"error", err,
		)
		return err
	} else if userBeingDeleted.Role == "Owner" {
		slog.Error(
			"User attempted to delete owner user",
			"layer", "app",
			"entity", "user",
			"id", id,
			"error", err,
		)
		return errors.New("can not delete owners")
	} else if targetRole, err := a.store.GetRoleWithName(userBeingDeleted.Role); err != nil {
		slog.Error(
			"Could not get role for user being deleted",
			"layer", "app",
			"entity", "user",
			"id", id,
			"error", err,
		)
		return errors.New("internal server error")
	} else if err := a.assertActorOutranks(user, targetRole); err != nil {
		return err
	} else if err = a.store.DeleteUser(id); err != nil {
		slog.Error(
			"Unable to delete user",
			"layer", "app",
			"entity", "user",
			"id", id,
			"error", err,
		)
		return err
	}

	return nil
}

func (a *appLayer) GetUser(id uint) (*models.UserInternal, error) {
	if user, err := a.store.GetUser(id); err != nil {
		slog.Error(
			"Unable to get user",
			"layer", "app",
			"entity", "user",
			"id", id,
			"error", err,
		)
		return &models.UserInternal{}, err
	} else if role, err := a.store.GetRole(user.RoleId); err != nil {
		slog.Error(
			"Unable to get role while getting user",
			"layer", "app",
			"entity", "user",
			"id", id,
			"roleId", user.RoleId,
			"error", err,
		)
		return &models.UserInternal{}, err
	} else if permissions, err := a.store.GetPermissionsWithRole(user.RoleId); err != nil {
		slog.Error(
			"Unable to get permissions while getting user",
			"layer", "app",
			"entity", "user",
			"id", id,
			"roleId", user.RoleId,
			"error", err,
		)
		return &models.UserInternal{}, err
	} else {
		userInternal := models.UserInternal{}
		userInternal.Internalize(user, role, permissions)

		return &userInternal, nil
	}
}

func (a *appLayer) GetAllUsers() (*[]models.UserInternal, error) {
	users, err := a.store.GetAllUsers()
	if err != nil {
		return &[]models.UserInternal{}, err
	}

	internalUsers := make([]models.UserInternal, len(*users))
	for index, user := range *users {
		if role, err := a.store.GetRole(user.RoleId); err != nil {
			slog.Error(
				"Unable to get role for user while getting all users",
				"layer", "app",
				"entity", "user",
				"roleId", user.RoleId,
				"error", err,
			)
			return &[]models.UserInternal{}, err
		} else if permissions, err := a.store.GetPermissionsWithRole(user.RoleId); err != nil {
			slog.Error(
				"Unable to get permissions for user while getting all users",
				"layer", "app",
				"entity", "user",
				"roleId", user.RoleId,
				"error", err,
			)
			return &[]models.UserInternal{}, err
		} else {
			internalUsers[index].Internalize(&user, role, permissions)
		}
	}

	return &internalUsers, nil
}

func (a *appLayer) UpdatePassword(user *models.UserInternal, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), a.config.PasswordCost)
	if err != nil {
		slog.Error(
			"Failed to hash password",
			"layer", "app",
			"entity", "user",
			"username", user.Username,
			"error", err,
		)
		return errors.New("failed to hash password")
	}

	if err := a.store.UpdatePassword(user.ID, string(hashedPassword), user.Username); err != nil {
		slog.Error(
			"Unable to update password",
			"layer", "app",
			"entity", "user",
			"username", user.Username,
			"error", err,
		)
		return errors.New("failed to update password")
	}

	return nil
}

func (a *appLayer) UpdateUser(user *models.UserInternal, id uint, disabled bool, email, name, password string, requirePasswordReset bool, username, roleName string) (*models.UserInternal, error) {
	if len(email) == 0 || len(name) == 0 || len(username) == 0 || len(roleName) == 0 {
		return &models.UserInternal{}, errors.New("bad request")
	}

	role, err := a.store.GetRoleWithName(roleName)
	if err != nil {
		return &models.UserInternal{}, errors.New("bad request")
	}

	if err := a.assertActorOutranks(user, role); err != nil {
		return &models.UserInternal{}, err
	}

	permissions, err := a.store.GetPermissionsWithRole(role.ID)
	if err != nil {
		slog.Error(
			"Could not get permissions for role",
			"layer", "app",
			"entity", "user",
			"id", role.ID,
			"error", err,
		)
		return &models.UserInternal{}, errors.New("internal server error")
	}

	currentUser, err := a.store.GetUser(id)
	if err != nil {
		slog.Error(
			"Could not get user",
			"layer", "app",
			"entity", "user",
			"id", id,
			"error", err,
		)
		return &models.UserInternal{}, errors.New("internal server error")
	}

	currentRole, err := a.store.GetRole(currentUser.RoleId)
	if err != nil {
		slog.Error(
			"Could not get current role for user being updated",
			"layer", "app",
			"entity", "user",
			"id", id,
			"roleId", currentUser.RoleId,
			"error", err,
		)
		return &models.UserInternal{}, errors.New("internal server error")
	}

	if err := a.assertActorOutranks(user, currentRole); err != nil {
		return &models.UserInternal{}, err
	}

	hashedPassword := ""
	if len(password) != 0 {
		if err := a.ValidatePassword(username, currentUser.Password, password); err != nil {
			return &models.UserInternal{}, err
		}

		newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), a.config.PasswordCost)
		if err != nil {
			slog.Error(
				"Failed to hash password",
				"layer", "app",
				"entity", "user",
				"username", user.Username,
				"error", err,
			)
			return &models.UserInternal{}, errors.New("failed to hash password")
		}
		hashedPassword = string(newHashedPassword)
	}

	if newUser, err := a.store.UpdateUser(id, user.Username, disabled, email, name, hashedPassword, requirePasswordReset, username, role.ID); err != nil {
		return &models.UserInternal{}, err
	} else {
		userInternal := models.UserInternal{}
		userInternal.Internalize(newUser, role, permissions)

		return &userInternal, nil
	}
}

func (a *appLayer) ValidatePassword(username, oldPasswordHash, password string) error {
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
	} else if strings.Contains(password, username) {
		return errors.New("password must not contain the username")
	}

	if len(oldPasswordHash) == 0 {
		return nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(oldPasswordHash), []byte(password)); err == nil {
		return errors.New("password must be different from the current password")
	}

	return nil
}
