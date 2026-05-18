//
// Form Routes
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
	"net/http"
	"strconv"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) createForm(c *gin.Context) {
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

	body := responses.FormPublic{}
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	fields := make([]app.FormFieldInput, len(body.Fields))
	for i, f := range body.Fields {
		fields[i] = app.FormFieldInput{
			Name:       f.Name,
			Slug:       f.Slug,
			Type:       f.Type,
			Metadata:   f.Metadata,
			Validation: f.Validation,
			Required:   f.Required,
			Order:      f.Order,
		}
	}

	form, err := h.app.CreateForm(user, body.Name, body.Slug, body.OpensOn, body.ClosesOn, body.MaxSubmissions, body.NotOpenMessage, body.ClosedMessage, body.FilledMessage, body.SuccessMessage, body.ConfirmationEmailFieldSlug, body.ConfirmationEmailSlug, body.NotificationEmailTo, body.NotificationEmailSlug, body.ViewableBy, fields)
	if err != nil {
		if errors.Is(err, app.ErrInvalidNotificationEmail) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification email address"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create form"})
		}
		return
	}

	resp := responses.FormPublic{}
	resp.Publicize(form)
	c.JSON(http.StatusOK, resp)
}

func (h *httpLayer) createSubmission(c *gin.Context) {
	slug := c.Param("slug")

	bodyBytes, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	var values responses.SubmissionCreateRequest
	if err := json.Unmarshal(bodyBytes, &values); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if _, err := h.app.CreateSubmission(slug, values); err != nil {
		if errors.Is(err, app.ErrFormNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
		} else if errors.Is(err, app.ErrMissingField) || errors.Is(err, app.ErrInvalidField) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create submission"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) deleteForm(c *gin.Context) {
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

	if err := h.app.DeleteForm(user, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete form"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) deleteSubmission(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Submission ID"})
		return
	}

	if err := h.app.DeleteSubmission(user, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete submission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getForm(c *gin.Context) {
	slug := c.Param("slug")

	form, err := h.app.GetFormBySlug(slug)
	if err != nil {
		if errors.Is(err, app.ErrFormNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Form not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve form"})
		}
		return
	}

	if _, authenticated := c.Get("user"); authenticated {
		resp := responses.FormPublic{}
		resp.Publicize(form)
		c.JSON(http.StatusOK, resp)
	} else {
		resp := responses.FormDisplay{}
		resp.Publicize(form)
		c.JSON(http.StatusOK, resp)
	}
}

func (h *httpLayer) getForms(c *gin.Context) {
	forms, err := h.app.GetAllForms()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve forms"})
		return
	}

	result := make([]responses.FormPublic, len(*forms))
	for i := range *forms {
		result[i].Publicize(&(*forms)[i])
	}

	c.JSON(http.StatusOK, result)
}

func (h *httpLayer) getSubmissions(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	formId, err := strconv.ParseUint(c.Query("formId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Form ID"})
		return
	}

	submissions, err := h.app.GetSubmissionsForForm(user, uint(formId))
	if err != nil {
		if errors.Is(err, app.ErrForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve submissions"})
		}
		return
	}

	result := make([]responses.SubmissionPublic, len(*submissions))
	for i := range *submissions {
		result[i].Publicize(&(*submissions)[i])
	}

	c.JSON(http.StatusOK, result)
}

func (h *httpLayer) updateForm(c *gin.Context) {
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

	body := responses.FormPublic{}
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	fields := make([]app.FormFieldInput, len(body.Fields))
	for i, f := range body.Fields {
		fields[i] = app.FormFieldInput{
			Name:       f.Name,
			Slug:       f.Slug,
			Type:       f.Type,
			Metadata:   f.Metadata,
			Validation: f.Validation,
			Required:   f.Required,
			Order:      f.Order,
		}
	}

	form, err := h.app.UpdateForm(user, uint(id), body.Name, body.Slug, body.OpensOn, body.ClosesOn, body.MaxSubmissions, body.NotOpenMessage, body.ClosedMessage, body.FilledMessage, body.SuccessMessage, body.ConfirmationEmailFieldSlug, body.ConfirmationEmailSlug, body.NotificationEmailTo, body.NotificationEmailSlug, body.ViewableBy, fields)
	if err != nil {
		if errors.Is(err, app.ErrInvalidNotificationEmail) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification email address"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update form"})
		}
		return
	}

	resp := responses.FormPublic{}
	resp.Publicize(form)
	c.JSON(http.StatusOK, resp)
}
