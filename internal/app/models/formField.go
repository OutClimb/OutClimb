//
// Internal Form Field Object
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

import "github.com/OutClimb/OutClimb/internal/store"

type FormFieldInternal struct {
	ID         uint
	FormID     uint
	Name       string
	Slug       string
	Type       string
	Metadata   *string
	Validation *string
	Required   bool
	Order      uint
}

func (f *FormFieldInternal) Internalize(field *store.FormField) {
	f.ID = field.ID
	f.FormID = field.FormID
	f.Name = field.Name
	f.Slug = field.Slug
	f.Type = field.Type
	f.Metadata = field.Metadata
	f.Validation = field.Validation
	f.Required = field.Required
	f.Order = field.Order
}
