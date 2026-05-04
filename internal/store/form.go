//
// Form DB Object
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

package store

import "time"

type Form struct {
	StandardAudit
	Name                       string `gorm:"not null"`
	Slug                       string `gorm:"uniqueIndex;not null;size:255"`
	OpensOn                    *time.Time
	ClosesOn                   *time.Time
	MaxSubmissions             *uint
	ViewableBy                 []User `gorm:"many2many:form_viewable_users;"`
	NotOpenMessage             *string
	ClosedMessage              *string
	FilledMessage              *string
	SuccessMessage             *string
	ConfirmationEmailFieldSlug *string
	ConfirmationEmailSlug      *string
	NotificationEmailTo        *string
	NotificationEmailSlug      *string
}

func (s *storeLayer) CreateForm(createdBy, name, slug string, opensOn, closesOn *time.Time, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage, confirmationEmailFieldSlug, confirmationEmailSlug, notificationEmailTo, notificationEmailSlug *string) (*Form, error) {
	form := Form{
		Name:                       name,
		Slug:                       slug,
		OpensOn:                    opensOn,
		ClosesOn:                   closesOn,
		MaxSubmissions:             maxSubmissions,
		NotOpenMessage:             notOpenMessage,
		ClosedMessage:              closedMessage,
		FilledMessage:              filledMessage,
		SuccessMessage:             successMessage,
		ConfirmationEmailFieldSlug: confirmationEmailFieldSlug,
		ConfirmationEmailSlug:      confirmationEmailSlug,
		NotificationEmailTo:        notificationEmailTo,
		NotificationEmailSlug:      notificationEmailSlug,
	}

	form.CreatedBy = createdBy
	form.UpdatedBy = createdBy

	if result := s.db.Create(&form); result.Error != nil {
		return nil, result.Error
	}

	return &form, nil
}

func (s *storeLayer) DeleteForm(id uint) error {
	if result := s.db.Delete(&Form{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllForms() (*[]Form, error) {
	forms := []Form{}

	if result := s.db.Preload("ViewableBy").Find(&forms); result.Error != nil {
		return &[]Form{}, result.Error
	}

	return &forms, nil
}

func (s *storeLayer) GetForm(id uint) (*Form, error) {
	form := Form{}

	if result := s.db.Preload("ViewableBy").First(&form, id); result.Error != nil {
		return &Form{}, result.Error
	}

	return &form, nil
}

func (s *storeLayer) GetFormWithSlug(slug string) (*Form, error) {
	form := Form{}

	if result := s.db.Preload("ViewableBy").Where("slug = ?", slug).First(&form); result.Error != nil {
		return &Form{}, result.Error
	}

	return &form, nil
}

func (s *storeLayer) SetFormViewableBy(formId uint, userIds []uint) error {
	users := make([]User, len(userIds))
	for i, id := range userIds {
		users[i] = User{}
		users[i].ID = id
	}

	form := Form{}
	form.ID = formId

	return s.db.Model(&form).Association("ViewableBy").Replace(users)
}

func (s *storeLayer) UpdateForm(id uint, updatedBy, name, slug string, opensOn, closesOn *time.Time, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage, confirmationEmailFieldSlug, confirmationEmailSlug, notificationEmailTo, notificationEmailSlug *string) (*Form, error) {
	form, err := s.GetForm(id)
	if err != nil {
		return nil, err
	}

	form.UpdatedBy = updatedBy
	form.Name = name
	form.Slug = slug
	form.OpensOn = opensOn
	form.ClosesOn = closesOn
	form.MaxSubmissions = maxSubmissions
	form.NotOpenMessage = notOpenMessage
	form.ClosedMessage = closedMessage
	form.FilledMessage = filledMessage
	form.SuccessMessage = successMessage
	form.ConfirmationEmailFieldSlug = confirmationEmailFieldSlug
	form.ConfirmationEmailSlug = confirmationEmailSlug
	form.NotificationEmailTo = notificationEmailTo
	form.NotificationEmailSlug = notificationEmailSlug

	if result := s.db.Save(&form); result.Error != nil {
		return nil, result.Error
	}

	return form, nil
}
