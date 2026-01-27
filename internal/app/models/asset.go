//
// Internal Asset Object
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

type AssetInternal struct {
	ID       uint
	FileName string
	Key      string
}

func (a *AssetInternal) Internalize(asset *store.Asset) {
	a.ID = asset.ID
	a.FileName = asset.FileName
	a.Key = asset.Key
}
