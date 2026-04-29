//
// Submission DB Object
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

type Submission struct {
	ID          uint `gorm:"primaryKey"`
	FormID      uint
	SubmittedOn time.Time
}

func (s *storeLayer) CountSubmissionsForForm(formId uint) (int64, error) {
	var count int64

	if result := s.db.Model(&Submission{}).Where("form_id = ?", formId).Count(&count); result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

func (s *storeLayer) CreateSubmission(formId uint) (*Submission, error) {
	submission := Submission{
		FormID:      formId,
		SubmittedOn: time.Now(),
	}

	if result := s.db.Create(&submission); result.Error != nil {
		return &Submission{}, result.Error
	}

	return &submission, nil
}

func (s *storeLayer) DeleteSubmission(id uint) error {
	if result := s.db.Delete(&Submission{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) DeleteSubmissionsForForm(formId uint) error {
	if result := s.db.Where("form_id = ?", formId).Delete(&Submission{}); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllSubmissions() (*[]Submission, error) {
	submissions := []Submission{}

	if result := s.db.Find(&submissions); result.Error != nil {
		return &[]Submission{}, result.Error
	}

	return &submissions, nil
}

func (s *storeLayer) GetSubmission(id uint) (*Submission, error) {
	submission := Submission{}

	if result := s.db.First(&submission, id); result.Error != nil {
		return &Submission{}, result.Error
	}

	return &submission, nil
}

func (s *storeLayer) GetSubmissionsForForm(formId uint) (*[]Submission, error) {
	submissions := []Submission{}

	if result := s.db.Where("form_id = ?", formId).Find(&submissions); result.Error != nil {
		return &[]Submission{}, result.Error
	}

	return &submissions, nil
}
