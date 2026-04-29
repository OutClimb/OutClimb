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
	Name               string `gorm:"not null"`
	Slug               string `gorm:"uniqueIndex;not null;size:255"`
	Template           string `gorm:"not null"`
	OpensOn            *time.Time
	ClosesOn           *time.Time
	MaxSubmissions     *uint
	ViewableBy         []User `gorm:"many2many:form_viewable_users;"`
	NotOpenMessage     *string
	ClosedMessage      *string
	SuccessMessage     *string
	EmailFormFieldSlug *string
	EmailTo            *string
	EmailSubject       *string
	EmailTemplate      *string
}

func (s *storeLayer) CreateForm(createdBy, name, slug, template string, opensOn, closesOn *time.Time, maxSubmissions *uint, notOpenMessage, closedMessage, successMessage, emailFormFieldSlug, emailTo, emailSubject, emailTemplate *string) (*Form, error) {
	form := Form{
		Name:               name,
		Slug:               slug,
		Template:           template,
		OpensOn:            opensOn,
		ClosesOn:           closesOn,
		MaxSubmissions:     maxSubmissions,
		NotOpenMessage:     notOpenMessage,
		ClosedMessage:      closedMessage,
		SuccessMessage:     successMessage,
		EmailFormFieldSlug: emailFormFieldSlug,
		EmailTo:            emailTo,
		EmailSubject:       emailSubject,
		EmailTemplate:      emailTemplate,
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

func (s *storeLayer) UpdateForm(id uint, updatedBy, name, slug, template string, opensOn, closesOn *time.Time, maxSubmissions *uint, notOpenMessage, closedMessage, successMessage, emailFormFieldSlug, emailTo, emailSubject, emailTemplate *string) (*Form, error) {
	form, err := s.GetForm(id)
	if err != nil {
		return nil, err
	}

	form.UpdatedBy = updatedBy
	form.Name = name
	form.Slug = slug
	form.Template = template
	form.OpensOn = opensOn
	form.ClosesOn = closesOn
	form.MaxSubmissions = maxSubmissions
	form.NotOpenMessage = notOpenMessage
	form.ClosedMessage = closedMessage
	form.SuccessMessage = successMessage
	form.EmailFormFieldSlug = emailFormFieldSlug
	form.EmailTo = emailTo
	form.EmailSubject = emailSubject
	form.EmailTemplate = emailTemplate

	if result := s.db.Save(&form); result.Error != nil {
		return nil, result.Error
	}

	return form, nil
}
