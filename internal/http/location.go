//
// Location Routes
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

	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) createLocation(c *gin.Context) {
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
	body := responses.LocationPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if location, err := h.app.CreateLocation(user, body.Name, body.MainImageName, body.IndividualImageName, body.BackgroundImagePath, body.Color, body.Address, body.StartTime, body.EndTime, body.Description); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create location"})
	} else {
		locationPublic := responses.LocationPublic{}
		locationPublic.Publicize(location)

		c.JSON(http.StatusOK, locationPublic)
	}
}

func (h *httpLayer) deleteLocation(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.app.DeleteLocation(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getLocation(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	internalLocation, error := h.app.GetLocation(id)
	if error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}

	location := responses.LocationPublic{}
	location.Publicize(internalLocation)

	c.JSON(http.StatusOK, location)
}

func (h *httpLayer) getLocations(c *gin.Context) {
	if internalLocations, err := h.app.GetAllLocations(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve locations"})
	} else {
		locations := make([]responses.LocationPublic, len(*internalLocations))
		for i, location := range *internalLocations {
			locations[i].Publicize(&location)
		}

		c.JSON(http.StatusOK, locations)
	}
}

func (h *httpLayer) updateLocation(c *gin.Context) {
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
	body := responses.LocationPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if location, err := h.app.UpdateLocation(user, id, body.Name, body.MainImageName, body.IndividualImageName, body.BackgroundImagePath, body.Color, body.Address, body.StartTime, body.EndTime, body.Description); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update location"})
	} else {
		locationPublic := responses.LocationPublic{}
		locationPublic.Publicize(location)

		c.JSON(http.StatusOK, locationPublic)
	}
}
