//
// Role Logic
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

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/store"
)

func (a *appLayer) CreateRole(user *models.UserInternal, name string, order uint) (*models.RoleInternal, error) {
	if len(name) == 0 {
		return &models.RoleInternal{}, errors.New("bad request")
	}

	if err := a.assertActorOutranks(user, &store.Role{Order: order}); err != nil {
		return &models.RoleInternal{}, err
	}

	role, err := a.store.CreateRole(user.Username, name, order)
	if err != nil {
		slog.Error(
			"Unable to create role",
			"layer", "app",
			"entity", "role",
			"name", name,
			"error", err,
		)
		return &models.RoleInternal{}, err
	}

	roleInternal := models.RoleInternal{}
	roleInternal.Internalize(role)

	return &roleInternal, nil
}

func (a *appLayer) DeleteRole(user *models.UserInternal, id uint) error {
	role, err := a.store.GetRole(id)
	if err != nil {
		slog.Error(
			"Could not get role being deleted",
			"layer", "app",
			"entity", "role",
			"id", id,
			"error", err,
		)
		return err
	}

	if role.Name == "Owner" {
		return errors.New("can not delete owner role")
	}

	if err := a.assertActorOutranks(user, role); err != nil {
		return err
	}

	users, err := a.store.GetUsersWithRole(id)
	if err != nil {
		slog.Error(
			"Could not get users for role",
			"layer", "app",
			"entity", "role",
			"id", id,
			"error", err,
		)
		return errors.New("internal server error")
	}

	if len(*users) > 0 {
		return errors.New("can not delete role with users")
	}

	if err := a.store.DeleteRole(id); err != nil {
		slog.Error(
			"Unable to delete role",
			"layer", "app",
			"entity", "role",
			"id", id,
			"error", err,
		)
		return err
	}

	return nil
}

func (a *appLayer) GetRole(id uint) (*models.RoleInternal, error) {
	role, err := a.store.GetRole(id)
	if err != nil {
		slog.Error(
			"Unable to get role",
			"layer", "app",
			"entity", "role",
			"id", id,
			"error", err,
		)
		return &models.RoleInternal{}, err
	}

	roleInternal := models.RoleInternal{}
	roleInternal.Internalize(role)

	return &roleInternal, nil
}

func (a *appLayer) GetAllRoles() (*[]models.RoleInternal, error) {
	roles, err := a.store.GetAllRoles()
	if err != nil {
		return &[]models.RoleInternal{}, err
	}

	rolesInternal := make([]models.RoleInternal, len(*roles))
	for i, role := range *roles {
		rolesInternal[i].Internalize(&role)
	}

	return &rolesInternal, nil
}

func (a *appLayer) UpdateRole(user *models.UserInternal, id uint, name string, order uint) (*models.RoleInternal, error) {
	if len(name) == 0 {
		return &models.RoleInternal{}, errors.New("bad request")
	}

	currentRole, err := a.store.GetRole(id)
	if err != nil {
		slog.Error(
			"Could not get role being updated",
			"layer", "app",
			"entity", "role",
			"id", id,
			"error", err,
		)
		return &models.RoleInternal{}, err
	}

	if currentRole.Name == "Owner" {
		return &models.RoleInternal{}, errors.New("can not update owner role")
	}

	if err := a.assertActorOutranks(user, currentRole); err != nil {
		return &models.RoleInternal{}, err
	}

	if err := a.assertActorOutranks(user, &store.Role{Order: order}); err != nil {
		return &models.RoleInternal{}, err
	}

	role, err := a.store.UpdateRole(id, user.Username, name, order)
	if err != nil {
		slog.Error(
			"Unable to update role",
			"layer", "app",
			"entity", "role",
			"id", id,
			"error", err,
		)
		return &models.RoleInternal{}, err
	}

	roleInternal := models.RoleInternal{}
	roleInternal.Internalize(role)

	return &roleInternal, nil
}
