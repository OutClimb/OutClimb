// Donation Endpoints
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

package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

const stripeSignatureHeader = "Stripe-Signature"

func (h *httpLayer) createDonationCheckout(c *gin.Context) {
	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	var body responses.DonationCheckoutRequest
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	// Only bots fill in the hidden honeypot field. Pretend it worked so they don't adapt.
	if body.Honeypot != "" {
		slog.Info("Discarding donation checkout with honeypot filled",
			"layer", "http",
			"entity", "donation",
		)
		c.JSON(http.StatusOK, gin.H{})
		return
	}

	if err := h.app.VerifyCaptcha(body.Altcha); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Captcha verification failed"})
		return
	}

	checkoutUrl, err := h.app.CreateDonationCheckout(body.AmountCents)
	if err != nil {
		if errors.Is(err, app.ErrInvalidDonationAmount) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid donation amount"})
		} else {
			slog.Error("Unable to create donation checkout",
				"layer", "http",
				"entity", "donation",
				"error", err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create donation checkout"})
		}
		return
	}

	c.JSON(http.StatusOK, responses.DonationCheckoutResponse{Url: checkoutUrl})
}

func (h *httpLayer) handleStripeWebhook(c *gin.Context) {
	payload, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	if err := h.app.HandleStripeWebhook(payload, c.GetHeader(stripeSignatureHeader)); err != nil {
		if errors.Is(err, app.ErrInvalidWebhookSignature) {
			slog.Warn("Rejected stripe webhook with invalid signature",
				"layer", "http",
				"entity", "donation",
				"clientIp", c.ClientIP(),
			)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		} else {
			slog.Error("Unable to handle stripe webhook",
				"layer", "http",
				"entity", "donation",
				"error", err,
			)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to handle webhook"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getDonations(c *gin.Context) {
	donations, err := h.app.GetAllDonations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve donations"})
		return
	}

	result := make([]responses.DonationPublic, len(*donations))
	for i := range *donations {
		result[i].Publicize(&(*donations)[i])
	}

	c.JSON(http.StatusOK, result)
}
