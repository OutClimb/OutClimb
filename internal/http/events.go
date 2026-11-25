//
// Events Route
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
	"encoding/xml"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) getEventsForMonth(c *gin.Context) {
	month, err := time.Parse("2006-01", c.Param("month"))
	if err != nil {
		slog.Error("invalid month format", "param", c.Param("month"), "err", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid month format, expected YYYY-MM"})
		return
	}

	feed, err := h.app.GetEventsForMonth(month.Year(), month.Month())
	if err != nil {
		slog.Error("Unable to fetch events", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch events"})
		return
	}

	var resp responses.EventFeedPublic
	resp.Publicize(feed)

	output, err := xml.MarshalIndent(resp, "", "  ")
	if err != nil {
		slog.Error("Failed to generate response", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate response"})
		return
	}

	c.Data(http.StatusOK, "application/rss+xml; charset=utf-8", append([]byte(xml.Header), output...))
}

func (h *httpLayer) createEvent(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	body, ok := parseEventRequest(c)
	if !ok {
		return
	}

	event, err := h.app.CreateEvent(user, body.Title, body.Slug, body.StartsAt, body.EndsAt, body.LocationID, body.LocationName, body.Address, body.City, body.State, body.Zip, body.FeaturedImageAssetID, body.FeaturedImageAltText, body.Excerpt, body.Body, body.Tags)
	if err != nil {
		respondWithEventError(c, err, "Unable to create event")
		return
	}

	resp := responses.EventResponsePublic{}
	resp.Publicize(event)
	c.JSON(http.StatusOK, resp)
}

func (h *httpLayer) updateEvent(c *gin.Context) {
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

	body, ok := parseEventRequest(c)
	if !ok {
		return
	}

	event, err := h.app.UpdateEvent(user, uint(id), body.Title, body.Slug, body.StartsAt, body.EndsAt, body.LocationID, body.LocationName, body.Address, body.City, body.State, body.Zip, body.FeaturedImageAssetID, body.FeaturedImageAltText, body.Excerpt, body.Body, body.Tags)
	if err != nil {
		respondWithEventError(c, err, "Unable to update event")
		return
	}

	resp := responses.EventResponsePublic{}
	resp.Publicize(event)
	c.JSON(http.StatusOK, resp)
}

func (h *httpLayer) deleteEvent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.app.DeleteEvent(uint(id)); err != nil {
		respondWithEventError(c, err, "Unable to delete event")
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getEvent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	event, err := h.app.GetEvent(uint(id))
	if err != nil {
		respondWithEventError(c, err, "Unable to retrieve event")
		return
	}

	resp := responses.EventResponsePublic{}
	resp.Publicize(event)
	c.JSON(http.StatusOK, resp)
}

func (h *httpLayer) getEvents(c *gin.Context) {
	events, err := h.app.GetAllEvents()
	if err != nil {
		respondWithEventError(c, err, "Unable to retrieve events")
		return
	}

	result := make([]responses.EventResponsePublic, len(*events))
	for i := range *events {
		result[i].Publicize(&(*events)[i])
	}

	c.JSON(http.StatusOK, result)
}

func respondWithEventError(c *gin.Context, err error, fallbackMessage string) {
	switch {
	case errors.Is(err, app.ErrInvalidEvent):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case errors.Is(err, app.ErrEventNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
	default:
		slog.Error(fallbackMessage, "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fallbackMessage})
	}
}

func parseEventRequest(c *gin.Context) (responses.EventRequestPublic, bool) {
	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return responses.EventRequestPublic{}, false
	}

	body := responses.EventRequestPublic{}
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return responses.EventRequestPublic{}, false
	}

	return body, true
}

func (h *httpLayer) getTags(c *gin.Context) {
	tags, err := h.app.GetAllTags()
	if err != nil {
		slog.Error("Unable to retrieve tags", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve tags"})
		return
	}

	c.JSON(http.StatusOK, tags)
}
