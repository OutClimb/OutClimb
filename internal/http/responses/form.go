//
// Form Response
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

type FormPublic struct {
	Id                         uint              `json:"id"`
	Name                       string            `json:"name"`
	Slug                       string            `json:"slug"`
	OpensOn                    *int64            `json:"opensOn,omitempty"`
	ClosesOn                   *int64            `json:"closesOn,omitempty"`
	MaxSubmissions             *uint             `json:"maxSubmissions,omitempty"`
	NotOpenMessage             *string           `json:"notOpenMessage,omitempty"`
	ClosedMessage              *string           `json:"closedMessage,omitempty"`
	FilledMessage              *string           `json:"filledMessage,omitempty"`
	SuccessMessage             *string           `json:"successMessage,omitempty"`
	ConfirmationEmailFieldSlug *string           `json:"confirmationEmailFieldSlug,omitempty"`
	ConfirmationEmailSlug      *string           `json:"confirmationEmailSlug,omitempty"`
	NotificationEmailTo        *string           `json:"notificationEmailTo,omitempty"`
	NotificationEmailSlug      *string           `json:"notificationEmailSlug,omitempty"`
	ViewableBy                 []uint            `json:"viewableBy"`
	Fields                     []FormFieldPublic `json:"fields"`
}

func (f *FormPublic) Publicize(form *models.FormInternal) {
	f.Id = form.ID
	f.Name = form.Name
	f.Slug = form.Slug
	f.MaxSubmissions = form.MaxSubmissions
	f.NotOpenMessage = form.NotOpenMessage
	f.ClosedMessage = form.ClosedMessage
	f.FilledMessage = form.FilledMessage
	f.SuccessMessage = form.SuccessMessage
	f.ConfirmationEmailFieldSlug = form.ConfirmationEmailFieldSlug
	f.ConfirmationEmailSlug = form.ConfirmationEmailSlug
	f.NotificationEmailTo = form.NotificationEmailTo
	f.NotificationEmailSlug = form.NotificationEmailSlug
	f.ViewableBy = form.ViewableBy

	if form.OpensOn != nil {
		opensOn := form.OpensOn.UnixMilli()
		f.OpensOn = &opensOn
	}

	if form.ClosesOn != nil {
		closesOn := form.ClosesOn.UnixMilli()
		f.ClosesOn = &closesOn
	}

	f.Fields = make([]FormFieldPublic, len(form.Fields))
	for i := range form.Fields {
		f.Fields[i].Publicize(&form.Fields[i])
	}
}

type FormDisplay struct {
	Id             uint               `json:"id"`
	Name           string             `json:"name"`
	Slug           string             `json:"slug"`
	Status         string             `json:"status"`
	OpensOn        *int64             `json:"opensOn,omitempty"`
	ClosesOn       *int64             `json:"closesOn,omitempty"`
	NotOpenMessage *string            `json:"notOpenMessage,omitempty"`
	ClosedMessage  *string            `json:"closedMessage,omitempty"`
	FilledMessage  *string            `json:"filledMessage,omitempty"`
	SuccessMessage *string            `json:"successMessage,omitempty"`
	Fields         []FormFieldDisplay `json:"fields"`
}

func (f *FormDisplay) Publicize(form *models.FormInternal) {
	f.Id = form.ID
	f.Name = form.Name
	f.Slug = form.Slug
	f.Status = form.Status
	f.NotOpenMessage = form.NotOpenMessage
	f.ClosedMessage = form.ClosedMessage
	f.FilledMessage = form.FilledMessage
	f.SuccessMessage = form.SuccessMessage

	if form.OpensOn != nil {
		opensOn := form.OpensOn.UnixMilli()
		f.OpensOn = &opensOn
	}

	if form.ClosesOn != nil {
		closesOn := form.ClosesOn.UnixMilli()
		f.ClosesOn = &closesOn
	}

	f.Fields = make([]FormFieldDisplay, len(form.Fields))
	for i := range form.Fields {
		f.Fields[i].Publicize(&form.Fields[i])
	}
}
