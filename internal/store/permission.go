//
// Permission DB Object
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

type PermissionLevel int

const (
	LevelNoAccess PermissionLevel = iota
	LevelRead
	LevelWrite
)

type Permission struct {
	ID     uint            `gorm:"primarykey"`
	RoleId uint            `gorm:"not null"`
	Level  PermissionLevel `gorm:"not null"`
	Entity string          `gorm:"not null"`
}

func (s *storeLayer) CreatePermission(roleId uint, level PermissionLevel, entity string) (*Permission, error) {
	permission := Permission{
		RoleId: roleId,
		Level:  level,
		Entity: entity,
	}

	if result := s.db.Create(&permission); result.Error != nil {
		return &Permission{}, result.Error
	}

	return &permission, nil
}

func (s *storeLayer) DeletePermission(id uint) error {
	if result := s.db.Delete(&Permission{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllPermissions() (*[]Permission, error) {
	permissions := []Permission{}

	if result := s.db.Find(&permissions); result.Error != nil {
		return &[]Permission{}, result.Error
	}

	return &permissions, nil
}

func (s *storeLayer) GetPermission(id uint) (*Permission, error) {
	permission := Permission{}

	if result := s.db.Where("id = ?", id).First(&permission); result.Error != nil {
		return &Permission{}, result.Error
	}

	return &permission, nil
}

func (s *storeLayer) GetPermissionsWithRole(roleId uint) (*[]Permission, error) {
	permission := []Permission{}

	if result := s.db.Where("role_id = ?", roleId).Find(&permission); result.Error != nil {
		return &[]Permission{}, result.Error
	}

	return &permission, nil
}

func (s *storeLayer) GetPermissionWithRoleAndAccess(roleId, accessId uint) (*Permission, error) {
	permission := Permission{}

	if result := s.db.Where("role_id = ? AND access_id = ?", roleId, accessId).First(&permission); result.Error != nil {
		return &Permission{}, result.Error
	}

	return &permission, nil
}

func (s *storeLayer) UpdatePermission(id uint, level PermissionLevel) (*Permission, error) {
	permission, err := s.GetPermission(id)
	if err != nil {
		return nil, err
	}

	permission.Level = level

	if result := s.db.Save(&permission); result.Error != nil {
		return nil, result.Error
	}

	return permission, nil
}
