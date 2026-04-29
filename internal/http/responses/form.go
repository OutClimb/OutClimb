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
	Id                 uint              `json:"id"`
	Name               string            `json:"name"`
	Slug               string            `json:"slug"`
	Template           string            `json:"template"`
	OpensOn            int64             `json:"opensOn"`
	ClosesOn           int64             `json:"closesOn"`
	MaxSubmissions     *uint             `json:"maxSubmissions"`
	NotOpenMessage     *string           `json:"notOpenMessage"`
	ClosedMessage      *string           `json:"closedMessage"`
	SuccessMessage     *string           `json:"successMessage"`
	EmailFormFieldSlug *string           `json:"emailFormFieldSlug"`
	EmailTo            *string           `json:"emailTo"`
	EmailSubject       *string           `json:"emailSubject"`
	EmailTemplate      *string           `json:"emailTemplate"`
	ViewableBy         []uint            `json:"viewableBy"`
	Fields             []FormFieldPublic `json:"fields"`
}

func (f *FormPublic) Publicize(form *models.FormInternal) {
	f.Id = form.ID
	f.Name = form.Name
	f.Slug = form.Slug
	f.Template = form.Template
	f.MaxSubmissions = form.MaxSubmissions
	f.NotOpenMessage = form.NotOpenMessage
	f.ClosedMessage = form.ClosedMessage
	f.SuccessMessage = form.SuccessMessage
	f.EmailFormFieldSlug = form.EmailFormFieldSlug
	f.EmailTo = form.EmailTo
	f.EmailSubject = form.EmailSubject
	f.EmailTemplate = form.EmailTemplate
	f.ViewableBy = form.ViewableBy

	f.OpensOn = 0
	if form.OpensOn != nil {
		f.OpensOn = form.OpensOn.UnixMilli()
	}

	f.ClosesOn = 0
	if form.ClosesOn != nil {
		f.ClosesOn = form.ClosesOn.UnixMilli()
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
	Template       string             `json:"template"`
	OpensOn        int64              `json:"opensOn"`
	ClosesOn       int64              `json:"closesOn"`
	NotOpenMessage *string            `json:"notOpenMessage"`
	ClosedMessage  *string            `json:"closedMessage"`
	SuccessMessage *string            `json:"successMessage"`
	Fields         []FormFieldDisplay `json:"fields"`
}

func (f *FormDisplay) Publicize(form *models.FormInternal) {
	f.Id = form.ID
	f.Name = form.Name
	f.Slug = form.Slug
	f.Template = form.Template
	f.NotOpenMessage = form.NotOpenMessage
	f.ClosedMessage = form.ClosedMessage
	f.SuccessMessage = form.SuccessMessage

	f.OpensOn = 0
	if form.OpensOn != nil {
		f.OpensOn = form.OpensOn.UnixMilli()
	}

	f.ClosesOn = 0
	if form.ClosesOn != nil {
		f.ClosesOn = form.ClosesOn.UnixMilli()
	}

	f.Fields = make([]FormFieldDisplay, len(form.Fields))
	for i := range form.Fields {
		f.Fields[i].Publicize(&form.Fields[i])
	}
}
