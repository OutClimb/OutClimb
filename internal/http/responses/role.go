//
// Role Response
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

type RolePublic struct {
	Id    uint   `json:"id"`
	Name  string `json:"name"`
	Order uint   `json:"order"`
}

func (r *RolePublic) Publicize(role *models.RoleInternal) {
	r.Id = role.ID
	r.Name = role.Name
	r.Order = role.Order
}
