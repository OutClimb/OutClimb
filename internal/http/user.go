//
// User Routes
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
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func (h *httpLayer) createToken(c *gin.Context) {
	// Get the authentication data
	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, responses.Error("Unable to retrieve request body"))
		return
	}

	// Parse the authentication data
	jsonMap := make(map[string]string)
	err = json.Unmarshal(bodyAsByteArray, &jsonMap)
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.Error("Unable to parse request body"))
		return
	}

	// Validate the authentication data
	if len(jsonMap["username"]) == 0 || len(jsonMap["password"]) == 0 || len(jsonMap["password"]) > 72 {
		c.JSON(http.StatusBadRequest, responses.Error("Invalid username or password. Username and Password must be greater than 0 characters in length and password must be less than 72 characters in length"))
		return
	}

	// Authenticate the user
	user, err := h.app.AuthenticateUser(jsonMap["username"], jsonMap["password"])
	if err != nil {
		c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
		return
	}

	userPublic := responses.UserPublic{}
	userPublic.Publicize(user)

	if token := CreateToken(user.ID, &userPublic, h.config.Jwt.Lifespan, c.ClientIP(), h.config.Jwt.Issuer, h.config.Jwt.Secret); token == "" {
		c.JSON(http.StatusInternalServerError, responses.Error("Unable to create token"))
		return
	} else {
		c.String(http.StatusOK, token)
	}
}

func CreateToken(userId uint, user *responses.UserPublic, lifespan int, clientIp, issuer, secret string) string {
	// Create the Claims
	claims := middleware.JwtClaims{}
	claims.Issuer = issuer + "-" + middleware.JwtVersion
	claims.Subject = strconv.FormatUint(uint64(userId), 10)
	claims.Audience = clientIp
	claims.ExpiresAt = jwt.NewNumericDate(time.Now().Add(time.Second * time.Duration(lifespan)))
	claims.NotBefore = jwt.NewNumericDate(time.Now())
	claims.IssuedAt = jwt.NewNumericDate(time.Now())
	claims.User = middleware.JwtUserClaim{
		ID:                   userId,
		Username:             user.Username,
		Name:                 user.Name,
		Email:                user.Email,
		RequirePasswordReset: user.RequirePasswordReset,
		Role:                 user.Role,
		Permissions:          user.Permissions,
	}

	// Create the token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	if signedToken, err := token.SignedString([]byte(secret)); err != nil {
		slog.Error("Failed to sign token", "username", user.Username, "error", err)
		return ""
	} else {
		return signedToken
	}
}

func (h *httpLayer) createUser(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
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
	body := responses.UserRequestPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if user, err := h.app.CreateUser(user, body.Disabled, body.Email, body.Name, body.Password, body.RequirePasswordReset, body.Username, body.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create location"})
	} else {
		userPublic := responses.UserPublic{}
		userPublic.Publicize(user)

		c.JSON(http.StatusOK, userPublic)
	}
}

func (h *httpLayer) deleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	err = h.app.DeleteUser(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	internalUser, error := h.app.GetUser(uint(id))
	if error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user := responses.UserPublic{}
	user.Publicize(internalUser)

	c.JSON(http.StatusOK, user)
}

func (h *httpLayer) getUsers(c *gin.Context) {
	if internalUsers, err := h.app.GetAllUsers(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve users"})
	} else {
		users := make([]responses.UserPublic, len(*internalUsers))
		for i, user := range *internalUsers {
			users[i].Publicize(&user)
		}

		c.JSON(http.StatusOK, users)
	}
}

func (h *httpLayer) updatePassword(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	user, err := h.app.GetUser(userClaim.ID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !user.RequirePasswordReset {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	// Get the authentication data
	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		slog.Error("Retrieving request body", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	// Parse the authentication data
	jsonMap := make(map[string]string)
	err = json.Unmarshal(bodyAsByteArray, &jsonMap)
	if err != nil {
		slog.Error("Parsing request body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Internal Server Error"})
		return
	}

	// Validate password
	if err := h.app.ValidatePassword(user.Username, user.Password, jsonMap["password"]); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the password
	if err := h.app.UpdatePassword(user, jsonMap["password"]); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}

func (h *httpLayer) updateUser(c *gin.Context) {
	userClaim, _ := c.MustGet("user").(middleware.JwtUserClaim)
	userId := c.GetUint(userClaim.ID)
	user, err := h.app.GetUser(userId)
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
	bodyAsByteArray, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve request body"})
		return
	}

	// Parse the body data
	body := responses.UserRequestPublic{}
	err = json.Unmarshal(bodyAsByteArray, &body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unable to parse request body"})
		return
	}

	if user, err := h.app.UpdateUser(user, uint(id), body.Disabled, body.Email, body.Name, body.Password, body.RequirePasswordReset, body.Username, body.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update user"})
	} else {
		userPublic := responses.UserPublic{}
		userPublic.Publicize(user)

		c.JSON(http.StatusOK, userPublic)
	}
}
