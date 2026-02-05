//
// User Response
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

package responses

import "github.com/OutClimb/OutClimb/internal/app/models"

type UserRequestPublic struct {
	Disabled             bool   `json:"disabled"`
	Email                string `json:"email"`
	Name                 string `json:"name"`
	Password             string `json:"password"`
	RequirePasswordReset bool   `json:"requirePasswordReset"`
	Username             string `json:"username"`
	Role                 string `json:"role"`
}

type UserPublic struct {
	Id                   uint            `json:"id"`
	Username             string          `json:"username"`
	Name                 string          `json:"name"`
	Email                string          `json:"email"`
	RequirePasswordReset bool            `json:"requirePasswordReset"`
	Role                 string          `json:"role"`
	Permissions          map[string]uint `json:"permissions"`
}

func (u *UserPublic) Publicize(user *models.UserInternal) {
	u.Id = user.ID
	u.Username = user.Username
	u.Name = user.Name
	u.Email = user.Email
	u.RequirePasswordReset = user.RequirePasswordReset
	u.Role = user.Role
	u.Permissions = user.Permissions
}
