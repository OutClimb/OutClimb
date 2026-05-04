//
// Email DB Object
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

type Email struct {
	StandardAudit
	Name     string `gorm:"not null"`
	Slug     string `gorm:"uniqueIndex;not null;size:255"`
	Subject  string `gorm:"not null"`
	HtmlBody string `gorm:"not null"`
	TextBody string `gorm:"not null"`
}

func (s *storeLayer) CreateEmail(createdBy, name, slug, subject, htmlBody, textBody string) (*Email, error) {
	email := Email{
		Name:     name,
		Slug:     slug,
		Subject:  subject,
		HtmlBody: htmlBody,
		TextBody: textBody,
	}

	email.CreatedBy = createdBy
	email.UpdatedBy = createdBy

	if result := s.db.Create(&email); result.Error != nil {
		return nil, result.Error
	}

	return &email, nil
}

func (s *storeLayer) DeleteEmail(id uint) error {
	if result := s.db.Delete(&Email{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllEmails() (*[]Email, error) {
	emails := []Email{}

	if result := s.db.Find(&emails); result.Error != nil {
		return &[]Email{}, result.Error
	}

	return &emails, nil
}

func (s *storeLayer) GetEmail(id uint) (*Email, error) {
	email := Email{}

	if result := s.db.First(&email, id); result.Error != nil {
		return &Email{}, result.Error
	}

	return &email, nil
}

func (s *storeLayer) GetEmailWithSlug(slug string) (*Email, error) {
	email := Email{}

	if result := s.db.Where("slug = ?", slug).First(&email); result.Error != nil {
		return &Email{}, result.Error
	}

	return &email, nil
}

func (s *storeLayer) UpdateEmail(id uint, updatedBy, name, slug, subject, htmlBody, textBody string) (*Email, error) {
	email, err := s.GetEmail(id)
	if err != nil {
		return nil, err
	}

	email.UpdatedBy = updatedBy
	email.Name = name
	email.Slug = slug
	email.Subject = subject
	email.HtmlBody = htmlBody
	email.TextBody = textBody

	if result := s.db.Save(&email); result.Error != nil {
		return nil, result.Error
	}

	return email, nil
}
