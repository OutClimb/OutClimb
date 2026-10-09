//
// TOTP Routes
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

package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) beginTotpSetup(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		slog.Error(
			"Unable to get current user",
			"layer", "http",
			"entity", "totp",
			"userId", userClaim.ID,
			"error", err,
		)
		c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
		return
	}

	setup, err := h.app.BeginTotpSetup(user)
	if err != nil {
		slog.Error(
			"Unable to begin totp setup",
			"layer", "http",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		c.JSON(http.StatusBadRequest, responses.Error("Unable to begin two-factor setup"))
		return
	}

	setupPublic := responses.TotpSetupPublic{}
	setupPublic.Publicize(setup)

	c.JSON(http.StatusOK, setupPublic)
}

func (h *httpLayer) confirmTotpSetup(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		slog.Error(
			"Unable to get current user",
			"layer", "http",
			"entity", "totp",
			"userId", userClaim.ID,
			"error", err,
		)
		c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
		return
	}

	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		slog.Error(
			"Unable to retrieve request body",
			"layer", "http",
			"entity", "totp",
			"error", err,
		)
		c.JSON(http.StatusInternalServerError, responses.Error("Unable to retrieve request body"))
		return
	}

	jsonMap := make(map[string]string)
	err = json.Unmarshal(bodyAsByteArray, &jsonMap)
	if err != nil {
		slog.Error(
			"Unable to parse request body",
			"layer", "http",
			"entity", "totp",
			"error", err,
		)
		c.JSON(http.StatusBadRequest, responses.Error("Unable to parse request body"))
		return
	}

	if err := h.app.ConfirmTotpSetup(user, jsonMap["code"]); errors.Is(err, app.ErrTotpInvalid) {
		c.JSON(http.StatusBadRequest, responses.Error("Invalid code"))
		return
	} else if err != nil {
		slog.Error(
			"Unable to confirm totp setup",
			"layer", "http",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		c.JSON(http.StatusBadRequest, responses.Error("Unable to confirm two-factor setup"))
		return
	}

	// Issue a fresh token now that two-factor setup is no longer required
	user, err = h.app.GetUser(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, responses.Error("Unable to create token"))
		return
	}

	userPublic := responses.UserPublic{}
	userPublic.Publicize(user)

	if token := CreateToken(user.ID, &userPublic, h.config.Jwt.Lifespan, h.config.Jwt.Issuer, h.config.Jwt.Secret); token == "" {
		c.JSON(http.StatusInternalServerError, responses.Error("Unable to create token"))
	} else {
		c.String(http.StatusOK, token)
	}
}
