//
// Role Routes
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

func (h *httpLayer) createRole(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	body := responses.RolePublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if role, err := h.app.CreateRole(user, body.Name, body.Order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create role"})
	} else {
		rolePublic := responses.RolePublic{}
		rolePublic.Publicize(role)

		c.JSON(http.StatusOK, rolePublic)
	}
}

func (h *httpLayer) deleteRole(c *gin.Context) {
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

	if err := h.app.DeleteRole(user, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	internalRole, err := h.app.GetRole(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	role := responses.RolePublic{}
	role.Publicize(internalRole)

	c.JSON(http.StatusOK, role)
}

func (h *httpLayer) getRoles(c *gin.Context) {
	if internalRoles, err := h.app.GetAllRoles(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve roles"})
	} else {
		roles := make([]responses.RolePublic, len(*internalRoles))
		for i, role := range *internalRoles {
			roles[i].Publicize(&role)
		}

		c.JSON(http.StatusOK, roles)
	}
}

func (h *httpLayer) updateRole(c *gin.Context) {
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

	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	body := responses.RolePublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if role, err := h.app.UpdateRole(user, uint(id), body.Name, body.Order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update role"})
	} else {
		rolePublic := responses.RolePublic{}
		rolePublic.Publicize(role)

		c.JSON(http.StatusOK, rolePublic)
	}
}
