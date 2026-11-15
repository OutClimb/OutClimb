//
// Donation Models
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

package models

import (
	"time"

	"github.com/OutClimb/OutClimb/internal/store"
)

type DonationInternal struct {
	ID          uint
	AmountCents int64
	Currency    string
	DonorName   string
	DonorEmail  string
	Status      string
	CompletedAt *time.Time
	CreatedAt   time.Time
}

func (d *DonationInternal) Internalize(donation *store.Donation) {
	d.ID = donation.ID
	d.AmountCents = donation.AmountCents
	d.Currency = donation.Currency
	d.DonorName = donation.DonorName
	d.DonorEmail = donation.DonorEmail
	d.Status = donation.Status
	d.CompletedAt = donation.CompletedAt
	d.CreatedAt = donation.CreatedAt
}
