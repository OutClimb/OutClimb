//
// Email Routes
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
	"net/http"
	"strconv"

	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) createEmail(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	body := responses.EmailPublic{}
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	email, err := h.app.CreateEmail(user, body.Name, body.Slug, body.Subject, body.HtmlBody, body.TextBody)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create email"})
		return
	}

	resp := responses.EmailPublic{}
	resp.Publicize(email)
	c.JSON(http.StatusOK, resp)
}

func (h *httpLayer) deleteEmail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.app.DeleteEmail(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getEmail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	email, err := h.app.GetEmail(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve email"})
		return
	}

	resp := responses.EmailPublic{}
	resp.Publicize(email)
	c.JSON(http.StatusOK, resp)
}

func (h *httpLayer) getEmails(c *gin.Context) {
	emails, err := h.app.GetAllEmails()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve emails"})
		return
	}

	result := make([]responses.EmailPublic, len(*emails))
	for i := range *emails {
		result[i].Publicize(&(*emails)[i])
	}

	c.JSON(http.StatusOK, result)
}

func (h *httpLayer) updateEmail(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	body := responses.EmailPublic{}
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	email, err := h.app.UpdateEmail(user, uint(id), body.Name, body.Slug, body.Subject, body.HtmlBody, body.TextBody)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update email"})
		return
	}

	resp := responses.EmailPublic{}
	resp.Publicize(email)
	c.JSON(http.StatusOK, resp)
}
