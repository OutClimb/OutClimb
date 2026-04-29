//
// Form Field DB Object
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

type FormField struct {
	StandardAudit
	FormID     uint
	Name       string `gorm:"not null"`
	Slug       string `gorm:"not null;size:255"`
	Type       string `gorm:"not null;size:32"`
	Metadata   *string
	Validation *string
	Required   bool
	Order      uint `gorm:"not null;default:0"`
}

func (s *storeLayer) CreateFormField(createdBy string, formId uint, name, slug, fieldType string, metadata, validation *string, required bool, order uint) (*FormField, error) {
	formField := FormField{
		FormID:     formId,
		Name:       name,
		Slug:       slug,
		Type:       fieldType,
		Metadata:   metadata,
		Validation: validation,
		Required:   required,
		Order:      order,
	}

	formField.CreatedBy = createdBy
	formField.UpdatedBy = createdBy

	if result := s.db.Create(&formField); result.Error != nil {
		return nil, result.Error
	}

	return &formField, nil
}

func (s *storeLayer) DeleteFormField(id uint) error {
	if result := s.db.Delete(&FormField{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) DeleteFormFieldForForm(formId uint) error {
	if result := s.db.Where("form_id = ?", formId).Delete(&FormField{}); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllFormFields() (*[]FormField, error) {
	formFields := []FormField{}

	if result := s.db.Find(&formFields); result.Error != nil {
		return &[]FormField{}, result.Error
	}

	return &formFields, nil
}

func (s *storeLayer) GetAllFormFieldsForForm(formId uint) (*[]FormField, error) {
	formFields := []FormField{}

	if result := s.db.Where("form_id = ?", formId).Find(&formFields); result.Error != nil {
		return &[]FormField{}, result.Error
	}

	return &formFields, nil
}

func (s *storeLayer) GetFormField(id uint) (*FormField, error) {
	formField := FormField{}

	if result := s.db.First(&formField, id); result.Error != nil {
		return &FormField{}, result.Error
	}

	return &formField, nil
}

func (s *storeLayer) UpdateFormField(id uint, updatedBy, name, slug, fieldType string, metadata, validation *string, required bool, order uint) (*FormField, error) {
	formField, err := s.GetFormField(id)
	if err != nil {
		return nil, err
	}

	formField.UpdatedBy = updatedBy
	formField.Name = name
	formField.Slug = slug
	formField.Type = fieldType
	formField.Metadata = metadata
	formField.Validation = validation
	formField.Required = required
	formField.Order = order

	if result := s.db.Save(&formField); result.Error != nil {
		return nil, result.Error
	}

	return formField, nil
}
