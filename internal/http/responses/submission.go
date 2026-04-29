//
// Submission Response
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

type SubmissionValuePublic struct {
	FormFieldId uint   `json:"formFieldId"`
	FieldSlug   string `json:"fieldSlug"`
	Value       string `json:"value"`
}

type SubmissionPublic struct {
	Id          uint                    `json:"id"`
	SubmittedOn int64                   `json:"submittedOn"`
	Values      []SubmissionValuePublic `json:"values"`
}

func (s *SubmissionPublic) Publicize(submission *models.SubmissionInternal) {
	s.Id = submission.ID
	s.SubmittedOn = submission.SubmittedOn.UnixMilli()

	s.Values = make([]SubmissionValuePublic, len(submission.Values))
	for i, v := range submission.Values {
		s.Values[i] = SubmissionValuePublic{
			FormFieldId: v.FormFieldID,
			FieldSlug:   v.FieldSlug,
			Value:       v.Value,
		}
	}
}

type SubmissionCreateRequest map[string]string
