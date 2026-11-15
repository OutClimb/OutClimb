// Donation Logic
// Copyright 2026 OutClimb
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package app

import (
	"context"
	"errors"
	"time"

	"github.com/stripe/stripe-go/v87"
)

const (
	minimumDonationCents int64 = 100
	maximumDonationCents int64 = 50000

	donationCurrency      = "usd"
	donationProductName   = "Donation to OutClimb"
	donationQuantity      = 1
	donationThankYouPath  = "/thank-you"
	donationCancelledPath = "/cancelled"
	stripeRequestTimeout  = 15 * time.Second
)

var ErrInvalidDonationAmount = errors.New("invalid donation amount")

type checkoutSessionCreator interface {
	CreateCheckoutSession(ctx context.Context, params *stripe.CheckoutSessionCreateParams) (*stripe.CheckoutSession, error)
}

type stripeCheckoutClient struct {
	client *stripe.Client
}

func newStripeCheckoutClient(secretKey string) *stripeCheckoutClient {
	return &stripeCheckoutClient{client: stripe.NewClient(secretKey)}
}

func (s *stripeCheckoutClient) CreateCheckoutSession(ctx context.Context, params *stripe.CheckoutSessionCreateParams) (*stripe.CheckoutSession, error) {
	return s.client.V1CheckoutSessions.Create(ctx, params)
}

func (a *appLayer) CreateDonationCheckout(amountCents int64) (string, error) {
	if amountCents < minimumDonationCents || amountCents > maximumDonationCents {
		return "", ErrInvalidDonationAmount
	}

	ctx, cancel := context.WithTimeout(context.Background(), stripeRequestTimeout)
	defer cancel()

	session, err := a.checkout.CreateCheckoutSession(ctx, a.buildDonationCheckoutParams(amountCents))
	if err != nil {
		return "", err
	}

	return session.URL, nil
}

func (a *appLayer) buildDonationCheckoutParams(amountCents int64) *stripe.CheckoutSessionCreateParams {
	donateOrigin := "https://" + a.config.DonateDomain

	return &stripe.CheckoutSessionCreateParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SubmitType: stripe.String(string(stripe.CheckoutSessionSubmitTypeDonate)),
		SuccessURL: stripe.String(donateOrigin + donationThankYouPath),
		CancelURL:  stripe.String(donateOrigin + donationCancelledPath),
		NameCollection: &stripe.CheckoutSessionCreateNameCollectionParams{
			Individual: &stripe.CheckoutSessionCreateNameCollectionIndividualParams{
				Enabled: stripe.Bool(true),
			},
		},
		LineItems: []*stripe.CheckoutSessionCreateLineItemParams{
			{
				Quantity: stripe.Int64(donationQuantity),
				PriceData: &stripe.CheckoutSessionCreateLineItemPriceDataParams{
					Currency:   stripe.String(donationCurrency),
					UnitAmount: stripe.Int64(amountCents),
					ProductData: &stripe.CheckoutSessionCreateLineItemPriceDataProductDataParams{
						Name: stripe.String(donationProductName),
					},
				},
			},
		},
	}
}
