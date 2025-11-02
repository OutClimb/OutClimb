//
// Redirect Response
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

package responses

import "github.com/OutClimb/OutClimb/internal/app/models"

type RedirectPublic struct {
	Id       uint   `json:"id"`
	FromPath string `json:"fromPath"`
	ToUrl    string `json:"toUrl"`
	StartsOn int64  `json:"startsOn"`
	StopsOn  int64  `json:"stopsOn"`
}

func (r *RedirectPublic) Publicize(redirect *models.RedirectInternal) {
	r.Id = redirect.ID
	r.FromPath = redirect.FromPath
	r.ToUrl = redirect.ToUrl

	r.StartsOn = 0
	if redirect.StartsOn != nil {
		r.StartsOn = redirect.StartsOn.UnixMilli()
	}

	r.StopsOn = 0
	if redirect.StopsOn != nil {
		r.StopsOn = redirect.StopsOn.UnixMilli()
	}
}
