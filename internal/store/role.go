//
// Role DB Object
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

type Role struct {
	StandardAudit
	Name string `gorm:"uniqueIndex;not null;size:255"`
}

func (s *storeLayer) CreateRole(createdBy, name string) (*Role, error) {
	role := Role{
		Name: name,
	}
	role.CreatedBy = createdBy
	role.UpdatedBy = createdBy

	if result := s.db.Create(&role); result.Error != nil {
		return &Role{}, result.Error
	}

	return &role, nil
}

func (s *storeLayer) DeleteRole(id uint) error {
	if result := s.db.Delete(&Role{}, id); result.Error != nil {
		return result.Error
	}

	return nil
}

func (s *storeLayer) GetAllRoles() (*[]Role, error) {
	roles := []Role{}

	if result := s.db.Find(&roles); result.Error != nil {
		return &[]Role{}, result.Error
	}

	return &roles, nil
}

func (s *storeLayer) GetRole(id uint) (*Role, error) {
	role := Role{}

	if result := s.db.Where("id = ?", id).First(&role); result.Error != nil {
		return &Role{}, result.Error
	}

	return &role, nil
}

func (s *storeLayer) GetRoleWithName(name string) (*Role, error) {
	role := Role{}

	if result := s.db.Where("name = ?", name).First(&role); result.Error != nil {
		return &Role{}, result.Error
	}

	return &role, nil
}

func (s *storeLayer) UpdateRole(id uint, updatedBy, name string) (*Role, error) {
	role, err := s.GetRole(id)
	if err != nil {
		return nil, err
	}

	role.UpdatedBy = updatedBy
	role.Name = name

	if result := s.db.Save(&role); result.Error != nil {
		return nil, result.Error
	}

	return role, nil
}
