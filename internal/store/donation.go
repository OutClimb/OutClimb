//
// Donation DB Object
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

import (
	"time"

	"gorm.io/gorm/clause"
)

type Donation struct {
	ID                      uint   `gorm:"primaryKey"`
	StripeCheckoutSessionId string `gorm:"uniqueIndex;not null;size:255"`
	StripePaymentIntentId   string `gorm:"not null;size:255"`
	AmountCents             int64  `gorm:"not null"`
	Currency                string `gorm:"not null;size:3"`
	DonorName               string `gorm:"not null"`
	DonorEmail              string `gorm:"not null"`
	Status                  string `gorm:"not null;size:32"`
	CompletedAt             *time.Time
	CreatedAt               time.Time
	UpdatedAt               time.Time
}

func (s *storeLayer) GetAllDonations() (*[]Donation, error) {
	donations := []Donation{}

	if result := s.db.Order("created_at DESC").Find(&donations); result.Error != nil {
		return &[]Donation{}, result.Error
	}

	return &donations, nil
}

func (s *storeLayer) UpsertDonationBySessionId(stripeCheckoutSessionId, stripePaymentIntentId string, amountCents int64, currency, donorName, donorEmail, status string, completedAt *time.Time) (*Donation, error) {
	donation := Donation{
		StripeCheckoutSessionId: stripeCheckoutSessionId,
		StripePaymentIntentId:   stripePaymentIntentId,
		AmountCents:             amountCents,
		Currency:                currency,
		DonorName:               donorName,
		DonorEmail:              donorEmail,
		Status:                  status,
		CompletedAt:             completedAt,
	}

	upsert := clause.OnConflict{
		Columns: []clause.Column{{Name: "stripe_checkout_session_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"stripe_payment_intent_id",
			"amount_cents",
			"currency",
			"donor_name",
			"donor_email",
			"status",
			"completed_at",
			"updated_at",
		}),
	}

	if result := s.db.Clauses(upsert, clause.Returning{}).Create(&donation); result.Error != nil {
		return nil, result.Error
	}

	return &donation, nil
}
