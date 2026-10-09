//
// User DB Object
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

import "errors"

type User struct {
	StandardAudit
	Disabled             bool   `gorm:"not null;default:0"`
	Email                string `gorm:"not null;size:254"`
	Name                 string `gorm:"not null"`
	Password             string `gorm:"not null;size:64"`
	RequirePasswordReset bool   `gorm:"not null;default:0"`
	Username             string `gorm:"uniqueIndex;not null;size:255"`
	RoleId               uint   `gorm:"not null;default:0"`
	TotpSecret           *string
	TotpEnabled          bool  `gorm:"not null;default:false"`
	TotpLastStep         int64 `gorm:"not null;default:0"`
}

func (s *storeLayer) CreateUser(createdBy string, disabled bool, email, name, password string, requirePasswordReset bool, username string, roleId uint) (*User, error) {
	user := User{
		Disabled:             disabled,
		Email:                email,
		Name:                 name,
		Password:             password,
		RequirePasswordReset: requirePasswordReset,
		Username:             username,
		RoleId:               roleId,
	}
	user.CreatedBy = createdBy
	user.UpdatedBy = createdBy

	if result := s.db.Create(&user); result.Error != nil {
		return &User{}, result.Error
	}

	return &user, nil
}

func (s *storeLayer) DeleteUser(id uint) error {
	if result := s.db.Delete(&User{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) EnableTotp(id uint, step int64, updatedBy string) error {
	result := s.db.Model(&User{}).Where("id = ? AND totp_secret IS NOT NULL", id).Updates(map[string]interface{}{
		"totp_enabled":   true,
		"totp_last_step": step,
		"updated_by":     updatedBy,
	})
	if result.Error != nil {
		return result.Error
	} else if result.RowsAffected == 0 {
		return errors.New("no pending totp secret")
	}

	return nil
}

func (s *storeLayer) GetAllUsers() (*[]User, error) {
	users := []User{}

	if result := s.db.Find(&users); result.Error != nil {
		return &[]User{}, result.Error
	}

	return &users, nil
}

func (s *storeLayer) GetUser(id uint) (*User, error) {
	user := User{}

	if result := s.db.First(&user, id); result.Error != nil {
		return &User{}, result.Error
	}

	return &user, nil
}

func (s *storeLayer) GetUsersWithRole(roleId uint) (*[]User, error) {
	users := []User{}

	if result := s.db.Find(&users, "role_id = ?", roleId); result.Error != nil {
		return &[]User{}, result.Error
	}

	return &users, nil
}

func (s *storeLayer) GetUserWithUsername(username string) (*User, error) {
	user := User{}

	if result := s.db.First(&user, "username = ?", username); result.Error != nil {
		return &User{}, result.Error
	}

	return &user, nil
}

func (s *storeLayer) SetTotpSecret(id uint, secret, updatedBy string) error {
	result := s.db.Model(&User{}).Where("id = ? AND totp_enabled = ?", id, false).Updates(map[string]interface{}{
		"totp_secret":    secret,
		"totp_last_step": 0,
		"updated_by":     updatedBy,
	})
	if result.Error != nil {
		return result.Error
	} else if result.RowsAffected == 0 {
		return errors.New("totp already enabled")
	}

	return nil
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

func (s *storeLayer) UpdateUser(id uint, updatedBy string, disabled bool, email, name, password string, requirePasswordReset, resetTwoFactor bool, username string, roleId uint) (*User, error) {
	user, err := s.GetUser(id)
	if err != nil {
		return nil, err
	}

	user.UpdatedBy = updatedBy
	user.Disabled = disabled
	user.Email = email
	user.Name = name
	user.RequirePasswordReset = requirePasswordReset
	user.Username = username
	user.RoleId = roleId

	if len(password) != 0 {
		user.Password = password
	}

	if resetTwoFactor {
		user.TotpSecret = nil
		user.TotpEnabled = false
		user.TotpLastStep = 0
	}

	if result := s.db.Save(&user); result.Error != nil {
		return &User{}, result.Error
	}

	return user, nil
}

// UpdateTotpLastStep records the time step of a successfully used code. It only
// succeeds when the step is newer than the last one used, which prevents a code
// from being replayed.
func (s *storeLayer) UpdateTotpLastStep(id uint, step int64) (bool, error) {
	result := s.db.Model(&User{}).Where("id = ? AND totp_last_step < ?", id, step).Update("totp_last_step", step)
	if result.Error != nil {
		return false, result.Error
	}

	return result.RowsAffected == 1, nil
}
