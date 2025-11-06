//
// Redirect Routes
// Copyright 2025 OutClimb
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

	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) createRedirect(c *gin.Context) {
	userId := c.GetUint("user_id")
	user, err := h.app.GetUser(userId)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the body data
	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	// Parse the body data
	body := responses.RedirectPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if redirect, err := h.app.CreateRedirect(user, body.FromPath, body.ToUrl, body.StartsOn, body.StopsOn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create redirect"})
	} else {
		redirectPublic := responses.RedirectPublic{}
		redirectPublic.Publicize(redirect)

		c.JSON(http.StatusOK, redirectPublic)
	}
}

func (h *httpLayer) deleteRedirect(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.app.DeleteRedirect(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Redirect not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) redirect(c *gin.Context) {
	path := c.Param("path")

	if redirect, err := h.app.FindRedirect(path); err != nil {
		c.Redirect(http.StatusTemporaryRedirect, h.config.DefaultRedirectURL)
	} else {
		c.Redirect(http.StatusTemporaryRedirect, redirect.ToUrl)
	}
}

func (h *httpLayer) getRedirect(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	internalRedirect, error := h.app.GetRedirect(id)
	if error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Redirect not found"})
		return
	}

	redirect := responses.RedirectPublic{}
	redirect.Publicize(internalRedirect)

	c.JSON(http.StatusOK, redirect)
}

func (h *httpLayer) getRedirects(c *gin.Context) {
	if internalRedirects, err := h.app.GetAllRedirects(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve redirects"})
	} else {
		redirects := make([]responses.RedirectPublic, len(*internalRedirects))
		for i, redirect := range *internalRedirects {
			redirects[i].Publicize(&redirect)
		}

		c.JSON(http.StatusOK, redirects)
	}
}

func (h *httpLayer) updateRedirect(c *gin.Context) {
	userId := c.GetUint("user_id")
	user, err := h.app.GetUser(userId)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the id from the URL
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Get the body data
	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	// Parse the body data
	body := responses.RedirectPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if redirect, err := h.app.UpdateRedirect(user, id, body.FromPath, body.ToUrl, body.StartsOn, body.StopsOn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update redirect"})
	} else {
		redirectPublic := responses.RedirectPublic{}
		redirectPublic.Publicize(redirect)

		c.JSON(http.StatusOK, redirectPublic)
	}
}
