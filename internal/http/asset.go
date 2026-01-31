//
// Asset Routes
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
	"strings"

	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) asset(c *gin.Context) {
	fileName := strings.TrimLeft(c.Param("filename"), "/")

	if assetUrl, err := h.app.FindAsset(fileName); err != nil {
		c.String(404, "Asset not found")
		return
	} else {
		c.Redirect(http.StatusTemporaryRedirect, assetUrl)
		return
	}
}

func (h *httpLayer) createAsset(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the body data
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.config.MaxUploadSize)
	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	// Parse the body data
	body := responses.AssetRequestPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if asset, err := h.app.CreateAsset(user, body.FileName, body.ContentType, body.Data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create asset"})
	} else {
		assetPublic := responses.AssetResponsePublic{}
		assetPublic.Publicize(asset)

		c.JSON(http.StatusOK, assetPublic)
	}
}

func (h *httpLayer) deleteAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.app.DeleteAsset(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	internalAsset, error := h.app.GetAsset(uint(id))
	if error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
		return
	}

	asset := responses.AssetResponsePublic{}
	asset.Publicize(internalAsset)

	c.JSON(http.StatusOK, asset)
}

func (h *httpLayer) getAssets(c *gin.Context) {
	if internalAssets, err := h.app.GetAllAssets(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve assets"})
	} else {
		assets := make([]responses.AssetResponsePublic, len(*internalAssets))
		for i, asset := range *internalAssets {
			assets[i].Publicize(&asset)
		}

		c.JSON(http.StatusOK, assets)
	}
}

func (h *httpLayer) updateAsset(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the id from the URL
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Get the body data
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.config.MaxUploadSize)
	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	// Parse the body data
	body := responses.AssetRequestPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if asset, err := h.app.UpdateAsset(user, uint(id), body.FileName, body.ContentType, body.Data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update asset"})
	} else {
		assetPublic := responses.AssetResponsePublic{}
		assetPublic.Publicize(asset)

		c.JSON(http.StatusOK, assetPublic)
	}
}
