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
	"time"

	"github.com/OutClimb/OutClimb/internal/store"
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

type fakeWebhookClient struct {
	notification *webhookNotification
	parseErr     error
	session      *stripe.CheckoutSession
	fetchErr     error
	fetchedIds   []string
}

func (f *fakeWebhookClient) ParseWebhookNotification(_ []byte, _, _ string) (*webhookNotification, error) {
	return f.notification, f.parseErr
}

func (f *fakeWebhookClient) GetCheckoutSession(_ context.Context, id string) (*stripe.CheckoutSession, error) {
	f.fetchedIds = append(f.fetchedIds, id)
	return f.session, f.fetchErr
}

type fakeDonationStore struct {
	store.StoreLayer
	donationsBySessionId map[string]store.Donation
	upsertCount          int
}

func (f *fakeDonationStore) UpsertDonationBySessionId(sessionId, paymentIntentId string, amountCents int64, currency, donorName, donorEmail, status string, completedAt *time.Time) (*store.Donation, error) {
	f.upsertCount++
	donation := store.Donation{
		StripeCheckoutSessionId: sessionId,
		StripePaymentIntentId:   paymentIntentId,
		AmountCents:             amountCents,
		Currency:                currency,
		DonorName:               donorName,
		DonorEmail:              donorEmail,
		Status:                  status,
		CompletedAt:             completedAt,
	}
	f.donationsBySessionId[sessionId] = donation
	return &donation, nil
}

func newWebhookTestApp(webhook *fakeWebhookClient) (*appLayer, *fakeDonationStore) {
	donationStore := &fakeDonationStore{donationsBySessionId: map[string]store.Donation{}}
	return &appLayer{
		webhook: webhook,
		store:   donationStore,
		config:  &utils.AppConfig{StripeWebhookSecret: "whsec_test"},
	}, donationStore
}

func newPaidSession() *stripe.CheckoutSession {
	return &stripe.CheckoutSession{
		ID:            "cs_test_1",
		PaymentStatus: stripe.CheckoutSessionPaymentStatusPaid,
		AmountTotal:   2500,
		Currency:      stripe.CurrencyUSD,
		PaymentIntent: &stripe.PaymentIntent{ID: "pi_test_1"},
		CustomerDetails: &stripe.CheckoutSessionCustomerDetails{
			IndividualName: "Sam Climber",
			Email:          "sam@example.test",
		},
	}
}

func TestHandleStripeWebhookRejectsBadSignature(t *testing.T) {
	signatureErrors := []error{
		stripe.ErrWebhookNoValidSignature,
		stripe.ErrWebhookNotSigned,
		stripe.ErrWebhookInvalidHeader,
		stripe.ErrWebhookTooOld,
	}

	for _, signatureErr := range signatureErrors {
		webhook := &fakeWebhookClient{parseErr: signatureErr}
		app, donationStore := newWebhookTestApp(webhook)

		err := app.HandleStripeWebhook([]byte("{}"), "bad")

		if !errors.Is(err, ErrInvalidWebhookSignature) {
			t.Fatalf("got error %v, want ErrInvalidWebhookSignature", err)
		}
		if donationStore.upsertCount != 0 || len(webhook.fetchedIds) != 0 {
			t.Fatal("event was processed despite bad signature")
		}
	}
}

func TestHandleStripeWebhookRecordsPaidSessionFetchedFromStripe(t *testing.T) {
	for _, eventType := range []string{eventCheckoutSessionCompleted, eventCheckoutSessionAsyncPaymentSucceeded} {
		webhook := &fakeWebhookClient{
			notification: &webhookNotification{EventType: eventType, CheckoutSessionId: "cs_test_1"},
			session:      newPaidSession(),
		}
		app, donationStore := newWebhookTestApp(webhook)

		if err := app.HandleStripeWebhook([]byte("{}"), "sig"); err != nil {
			t.Fatalf("%s: unexpected error %v", eventType, err)
		}

		if len(webhook.fetchedIds) != 1 || webhook.fetchedIds[0] != "cs_test_1" {
			t.Fatalf("%s: fetched sessions %v, want [cs_test_1]", eventType, webhook.fetchedIds)
		}
		donation := donationStore.donationsBySessionId["cs_test_1"]
		if donation.Status != "paid" || donation.CompletedAt == nil {
			t.Errorf("%s: status %q completedAt %v, want paid with completion time", eventType, donation.Status, donation.CompletedAt)
		}
		if donation.AmountCents != 2500 || donation.Currency != "usd" || donation.StripePaymentIntentId != "pi_test_1" {
			t.Errorf("%s: unexpected donation %+v", eventType, donation)
		}
		if donation.DonorName != "Sam Climber" || donation.DonorEmail != "sam@example.test" {
			t.Errorf("%s: unexpected donor %q %q", eventType, donation.DonorName, donation.DonorEmail)
		}
	}
}

func TestHandleStripeWebhookResendKeepsOriginalCompletionTime(t *testing.T) {
	eventCreatedAt := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	webhook := &fakeWebhookClient{
		notification: &webhookNotification{EventType: eventCheckoutSessionCompleted, CheckoutSessionId: "cs_test_1", CreatedAt: eventCreatedAt},
		session:      newPaidSession(),
	}
	app, donationStore := newWebhookTestApp(webhook)

	for range 2 {
		if err := app.HandleStripeWebhook([]byte("{}"), "sig"); err != nil {
			t.Fatalf("unexpected error %v", err)
		}
		completedAt := donationStore.donationsBySessionId["cs_test_1"].CompletedAt
		if completedAt == nil || !completedAt.Equal(eventCreatedAt) {
			t.Fatalf("completedAt = %v, want %v", completedAt, eventCreatedAt)
		}
	}
}

func TestHandleStripeWebhookDoesNotRecordUnpaidSessionAsPaid(t *testing.T) {
	session := newPaidSession()
	session.PaymentStatus = stripe.CheckoutSessionPaymentStatusUnpaid
	webhook := &fakeWebhookClient{
		notification: &webhookNotification{EventType: eventCheckoutSessionCompleted, CheckoutSessionId: "cs_test_1"},
		session:      session,
	}
	app, donationStore := newWebhookTestApp(webhook)

	if err := app.HandleStripeWebhook([]byte("{}"), "sig"); err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	if donationStore.upsertCount != 0 {
		t.Fatal("unpaid session was recorded")
	}
}

func TestHandleStripeWebhookRecordsAsyncFailure(t *testing.T) {
	session := newPaidSession()
	session.PaymentStatus = stripe.CheckoutSessionPaymentStatusUnpaid
	webhook := &fakeWebhookClient{
		notification: &webhookNotification{EventType: eventCheckoutSessionAsyncPaymentFailed, CheckoutSessionId: "cs_test_1"},
		session:      session,
	}
	app, donationStore := newWebhookTestApp(webhook)

	if err := app.HandleStripeWebhook([]byte("{}"), "sig"); err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	donation := donationStore.donationsBySessionId["cs_test_1"]
	if donation.Status != "failed" || donation.CompletedAt != nil {
		t.Errorf("status %q completedAt %v, want failed without completion time", donation.Status, donation.CompletedAt)
	}
}

func TestHandleStripeWebhookIgnoresOtherEventTypes(t *testing.T) {
	webhook := &fakeWebhookClient{notification: &webhookNotification{EventType: "v1.charge.refunded"}}
	app, donationStore := newWebhookTestApp(webhook)

	if err := app.HandleStripeWebhook([]byte("{}"), "sig"); err != nil {
		t.Fatalf("unexpected error %v", err)
	}

	if donationStore.upsertCount != 0 || len(webhook.fetchedIds) != 0 {
		t.Fatal("ignored event type touched Stripe or the store")
	}
}

func TestHandleStripeWebhookPropagatesFetchError(t *testing.T) {
	fetchErr := errors.New("stripe down")
	webhook := &fakeWebhookClient{
		notification: &webhookNotification{EventType: eventCheckoutSessionCompleted, CheckoutSessionId: "cs_test_1"},
		fetchErr:     fetchErr,
	}
	app, _ := newWebhookTestApp(webhook)

	if err := app.HandleStripeWebhook([]byte("{}"), "sig"); !errors.Is(err, fetchErr) {
		t.Fatalf("got error %v, want %v", err, fetchErr)
	}
}
