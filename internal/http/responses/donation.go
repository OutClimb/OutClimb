//
// Donation Responses
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

package responses

import "github.com/OutClimb/OutClimb/internal/app/models"

type DonationCheckoutRequest struct {
	AmountCents int64  `json:"amountCents"`
	Altcha      string `json:"altcha"`
	Honeypot    string `json:"honeypot"`
}

type DonationCheckoutResponse struct {
	Url string `json:"url"`
}

type DonationPublic struct {
	Id          uint   `json:"id"`
	AmountCents int64  `json:"amountCents"`
	Currency    string `json:"currency"`
	DonorName   string `json:"donorName"`
	DonorEmail  string `json:"donorEmail"`
	Status      string `json:"status"`
	CompletedAt *int64 `json:"completedAt,omitempty"`
	CreatedAt   int64  `json:"createdAt"`
}

func (d *DonationPublic) Publicize(donation *models.DonationInternal) {
	d.Id = donation.ID
	d.AmountCents = donation.AmountCents
	d.Currency = donation.Currency
	d.DonorName = donation.DonorName
	d.DonorEmail = donation.DonorEmail
	d.Status = donation.Status
	d.CreatedAt = donation.CreatedAt.UnixMilli()

	if donation.CompletedAt != nil {
		completedAt := donation.CompletedAt.UnixMilli()
		d.CompletedAt = &completedAt
	}
}
