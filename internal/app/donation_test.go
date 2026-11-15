// Donation Logic Tests
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
	"testing"

	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/stripe/stripe-go/v87"
)

type fakeCheckoutClient struct {
	receivedParams *stripe.CheckoutSessionCreateParams
	session        *stripe.CheckoutSession
	err            error
}

func (f *fakeCheckoutClient) CreateCheckoutSession(_ context.Context, params *stripe.CheckoutSessionCreateParams) (*stripe.CheckoutSession, error) {
	f.receivedParams = params
	return f.session, f.err
}

func newDonationTestApp(fake *fakeCheckoutClient) *appLayer {
	return &appLayer{
		checkout: fake,
		config:   &utils.AppConfig{DonateDomain: "donate.example.test"},
	}
}

func TestCreateDonationCheckoutRejectsAmountsOutOfBounds(t *testing.T) {
	tests := []struct {
		name        string
		amountCents int64
	}{
		{"zero", 0},
		{"negative", -500},
		{"below minimum", minimumDonationCents - 1},
		{"above maximum", maximumDonationCents + 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fake := &fakeCheckoutClient{}
			app := newDonationTestApp(fake)

			_, err := app.CreateDonationCheckout(tt.amountCents)

			if !errors.Is(err, ErrInvalidDonationAmount) {
				t.Fatalf("got error %v, want ErrInvalidDonationAmount", err)
			}
			if fake.receivedParams != nil {
				t.Fatal("Stripe was called for an invalid amount")
			}
		})
	}
}

func TestCreateDonationCheckoutAcceptsBoundaryAmounts(t *testing.T) {
	for _, amountCents := range []int64{minimumDonationCents, maximumDonationCents} {
		fake := &fakeCheckoutClient{session: &stripe.CheckoutSession{URL: "https://checkout.stripe.test/s"}}
		app := newDonationTestApp(fake)

		if _, err := app.CreateDonationCheckout(amountCents); err != nil {
			t.Fatalf("amount %d: unexpected error %v", amountCents, err)
		}
	}
}

func TestCreateDonationCheckoutReturnsSessionURL(t *testing.T) {
	fake := &fakeCheckoutClient{session: &stripe.CheckoutSession{URL: "https://checkout.stripe.test/s"}}
	app := newDonationTestApp(fake)

	url, err := app.CreateDonationCheckout(2500)

	if err != nil {
		t.Fatalf("unexpected error %v", err)
	}
	if url != "https://checkout.stripe.test/s" {
		t.Fatalf("got url %q", url)
	}
}

func TestCreateDonationCheckoutPropagatesStripeError(t *testing.T) {
	stripeErr := errors.New("stripe down")
	app := newDonationTestApp(&fakeCheckoutClient{err: stripeErr})

	if _, err := app.CreateDonationCheckout(2500); !errors.Is(err, stripeErr) {
		t.Fatalf("got error %v, want %v", err, stripeErr)
	}
}

func TestCreateDonationCheckoutSendsExpectedSessionParams(t *testing.T) {
	fake := &fakeCheckoutClient{session: &stripe.CheckoutSession{URL: "u"}}
	app := newDonationTestApp(fake)

	if _, err := app.CreateDonationCheckout(2500); err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	params := fake.receivedParams
	if got := *params.Mode; got != "payment" {
		t.Errorf("mode = %q, want payment", got)
	}
	if got := *params.SuccessURL; got != "https://donate.example.test/thank-you" {
		t.Errorf("success url = %q", got)
	}
	if got := *params.CancelURL; got != "https://donate.example.test/cancelled" {
		t.Errorf("cancel url = %q", got)
	}
	if params.NameCollection == nil || !*params.NameCollection.Individual.Enabled {
		t.Error("name collection not enabled")
	}
	if len(params.LineItems) != 1 {
		t.Fatalf("got %d line items, want 1", len(params.LineItems))
	}

	item := params.LineItems[0]
	if *item.Quantity != 1 {
		t.Errorf("quantity = %d, want 1", *item.Quantity)
	}
	if got := *item.PriceData.Currency; got != "usd" {
		t.Errorf("currency = %q, want usd", got)
	}
	if got := *item.PriceData.UnitAmount; got != 2500 {
		t.Errorf("unit amount = %d, want 2500", got)
	}
	if got := *item.PriceData.ProductData.Name; got != "Donation to OutClimb" {
		t.Errorf("product name = %q", got)
	}
}
