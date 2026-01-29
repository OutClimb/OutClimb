//
// Internal User Object
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

package models

import "github.com/OutClimb/OutClimb/internal/store"

type UserInternal struct {
	Deleted              bool
	Disabled             bool
	Email                string
	ID                   uint
	Name                 string
	Password             string
	RequirePasswordReset bool
	Username             string
	Role                 string
	Permissions          map[string]uint
}

func (u *UserInternal) Internalize(user *store.User, role *store.Role, permissions *[]store.Permission) {
	u.Deleted = user.DeletedAt.Valid
	u.Disabled = user.Disabled
	u.Email = user.Email
	u.ID = user.ID
	u.Name = user.Name
	u.Password = user.Password
	u.RequirePasswordReset = user.RequirePasswordReset
	u.Username = user.Username
	u.Role = role.Name

	// Build permission map
	permissionMap := map[string]uint{}
	for _, permission := range *permissions {
		permissionMap[permission.Entity] = uint(permission.Level)
	}
	u.Permissions = permissionMap
}
