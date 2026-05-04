//
// Internal Form Object
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

import (
	"time"

	"github.com/OutClimb/OutClimb/internal/store"
)

type FormInternal struct {
	ID                         uint
	Name                       string
	Slug                       string
	OpensOn                    *time.Time
	ClosesOn                   *time.Time
	MaxSubmissions             *uint
	NotOpenMessage             *string
	ClosedMessage              *string
	FilledMessage              *string
	SuccessMessage             *string
	ConfirmationEmailFieldSlug *string
	ConfirmationEmailSlug      *string
	NotificationEmailTo        *string
	NotificationEmailSlug      *string
	Status                     string
	ViewableBy                 []uint
	Fields                     []FormFieldInternal
}

func (f *FormInternal) Internalize(form *store.Form, fields *[]store.FormField) {
	f.ID = form.ID
	f.Name = form.Name
	f.Slug = form.Slug
	f.OpensOn = form.OpensOn
	f.ClosesOn = form.ClosesOn
	f.MaxSubmissions = form.MaxSubmissions
	f.NotOpenMessage = form.NotOpenMessage
	f.ClosedMessage = form.ClosedMessage
	f.FilledMessage = form.FilledMessage
	f.SuccessMessage = form.SuccessMessage
	f.ConfirmationEmailFieldSlug = form.ConfirmationEmailFieldSlug
	f.ConfirmationEmailSlug = form.ConfirmationEmailSlug
	f.NotificationEmailTo = form.NotificationEmailTo
	f.NotificationEmailSlug = form.NotificationEmailSlug

	viewableBy := make([]uint, len(form.ViewableBy))
	for i, u := range form.ViewableBy {
		viewableBy[i] = u.ID
	}
	f.ViewableBy = viewableBy

	fieldList := make([]FormFieldInternal, len(*fields))
	for i, field := range *fields {
		fieldList[i].Internalize(&field)
	}
	f.Fields = fieldList
}
