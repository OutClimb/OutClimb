//
// Email Response
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

type EmailPublic struct {
	Id       uint   `json:"id"`
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	Subject  string `json:"subject"`
	HtmlBody string `json:"htmlBody"`
	TextBody string `json:"textBody"`
}

func (e *EmailPublic) Publicize(email *models.EmailInternal) {
	e.Id = email.ID
	e.Name = email.Name
	e.Slug = email.Slug
	e.Subject = email.Subject
	e.HtmlBody = email.HtmlBody
	e.TextBody = email.TextBody
}
