//
// Internal Location Object
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
	"github.com/OutClimb/OutClimb/internal/store"
)

type LocationInternal struct {
	ID                  uint
	Name                string
	MainImageName       string
	IndividualImageName string
	BackgroundImagePath string
	Color               string
	Address             string
	StartTime           string
	EndTime             string
	Description         string
}

func (l *LocationInternal) Internalize(location *store.Location) {
	l.ID = location.ID
	l.Name = location.Name
	l.MainImageName = location.MainImageName
	l.IndividualImageName = location.IndividualImageName
	l.BackgroundImagePath = location.BackgroundImagePath
	l.Color = location.Color
	l.Address = location.Address
	l.StartTime = location.StartTime
	l.EndTime = location.EndTime
	l.Description = location.Description
}
