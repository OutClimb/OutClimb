//
// Submission Value DB Object
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

type SubmissionValue struct {
	ID           uint `gorm:"primaryKey"`
	SubmissionID uint
	FormFieldID  uint
	Value        string
}

func (s *storeLayer) CreateSubmissionValue(submissionId, formFieldId uint, value string) (*SubmissionValue, error) {
	submissionValue := SubmissionValue{
		SubmissionID: submissionId,
		FormFieldID:  formFieldId,
		Value:        value,
	}

	if result := s.db.Create(&submissionValue); result.Error != nil {
		return &SubmissionValue{}, result.Error
	}

	return &submissionValue, nil
}

func (s *storeLayer) DeleteSubmissionValue(id uint) error {
	if result := s.db.Delete(&SubmissionValue{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllSubmissionValue() (*[]SubmissionValue, error) {
	submissionValues := []SubmissionValue{}

	if result := s.db.Find(&submissionValues); result.Error != nil {
		return &[]SubmissionValue{}, result.Error
	}

	return &submissionValues, nil
}

func (s *storeLayer) GetAllSubmissionValueForSubmission(submissionId uint) (*[]SubmissionValue, error) {
	submissionValues := []SubmissionValue{}

	if result := s.db.Where("submission_id = ?", submissionId).Find(&submissionValues); result.Error != nil {
		return &[]SubmissionValue{}, result.Error
	}

	return &submissionValues, nil
}

func (s *storeLayer) GetSubmissionValue(id uint) (*SubmissionValue, error) {
	submissionValue := SubmissionValue{}

	if result := s.db.First(&submissionValue, id); result.Error != nil {
		return &SubmissionValue{}, result.Error
	}

	return &submissionValue, nil
}

func (s *storeLayer) UpdateSubmissionValue(id uint, value string) (*SubmissionValue, error) {
	submissionValue, err := s.GetSubmissionValue(id)
	if err != nil {
		return nil, err
	}

	submissionValue.Value = value

	if result := s.db.Save(&submissionValue); result.Error != nil {
		return nil, result.Error
	}

	return submissionValue, nil
}
