//
// Internal User Object
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
	Role                 string
	Username             string
}

func (u *UserInternal) Internalize(user *store.User) {
	u.Deleted = user.DeletedAt.Valid
	u.Disabled = user.Disabled
	u.Email = user.Email
	u.ID = user.ID
	u.Name = user.Name
	u.Password = user.Password
	u.RequirePasswordReset = user.RequirePasswordReset
	u.Role = user.Role
	u.Username = user.Username
}
