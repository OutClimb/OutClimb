//
// Location Response
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

type LocationPublic struct {
	Id                  uint   `json:"id"`
	Name                string `json:"name"`
	MainImageName       string `json:"mainImageName"`
	IndividualImageName string `json:"individualImageName"`
	BackgroundImagePath string `json:"backgroundImagePath"`
	Color               string `json:"color"`
	Address             string `json:"address"`
	StartTime           string `json:"startTime"`
	EndTime             string `json:"endTime"`
	Description         string `json:"description"`
}

func (l *LocationPublic) Publicize(location *models.LocationInternal) {
	l.Id = location.ID
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
