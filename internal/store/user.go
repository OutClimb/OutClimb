//
// User DB Object
// Copyright 2025 OutClimb
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

type User struct {
	StandardAudit
	Disabled             bool   `gorm:"not null;default:0"`
	Email                string `gorm:"not null;size:254"`
	Name                 string `gorm:"not null"`
	Password             string `gorm:"not null;size:64"`
	RequirePasswordReset bool   `gorm:"not null;default:0"`
	Username             string `gorm:"uniqueIndex;not null;size:255"`
}

func (s *storeLayer) CreateUser(createdBy, email, name, password, username string) (*User, error) {
	user := User{
		Disabled:             false,
		Email:                email,
		Name:                 name,
		Password:             password,
		RequirePasswordReset: false,
		Username:             username,
	}
	user.CreatedBy = createdBy
	user.UpdatedBy = createdBy

	if result := s.db.Create(&user); result.Error != nil {
		return &User{}, result.Error
	}

	return &user, nil
}

func (s *storeLayer) GetUser(id uint) (*User, error) {
	user := User{}

	if result := s.db.Where("id = ?", id).First(&user); result.Error != nil {
		return &User{}, result.Error
	}

	return &user, nil
}

func (s *storeLayer) GetUserWithUsername(username string) (*User, error) {
	user := User{}

	if result := s.db.Where("username = ?", username).First(&user); result.Error != nil {
		return &User{}, result.Error
	}

	return &user, nil
}

func (s *storeLayer) UpdatePassword(id uint, password, updatedBy string) error {
	user, _ := s.GetUser(id)
	user.Password = password
	user.RequirePasswordReset = false
	user.UpdatedBy = updatedBy

	if result := s.db.Save(&user); result.Error != nil {
		return result.Error
	}

	return nil
}
