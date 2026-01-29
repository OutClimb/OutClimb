//
// Auth Middleware
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

package middleware

import (
	"net/http"
	"strings"

	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const JwtVersion = "2"

type JwtUserClaim struct {
	ID                   uint            `json:"id"`
	Username             string          `json:"un"`
	Name                 string          `json:"n"`
	Email                string          `json:"e"`
	RequirePasswordReset bool            `json:"pr"`
	Role                 string          `json:"r"`
	Permissions          map[string]uint `json:"p"`
}

type JwtClaims struct {
	jwt.RegisteredClaims
	Audience string       `json:"aud"`
	User     JwtUserClaim `json:"usr"`
}

func Auth(config *utils.HttpConfig, resetAllowed bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		authorization := c.GetHeader("Authorization")
		if authorization == "" {
			c.JSON(http.StatusBadRequest, responses.Error("Authorization header required"))
			c.Abort()
			return
		}

		if !strings.HasPrefix(authorization, "Bearer ") {
			c.JSON(http.StatusBadRequest, responses.Error("Bearer scheme required"))
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(authorization[7:], &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.Jwt.Secret), nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, responses.Error("Invalid token"))
			c.Abort()
		} else if claims, ok := token.Claims.(*JwtClaims); !ok {
			c.JSON(http.StatusUnauthorized, responses.Error("Invalid token"))
			c.Abort()
		} else if claims.Audience != c.ClientIP() {
			c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
			c.Abort()
		} else if claims.Issuer != config.Jwt.Issuer+"-"+JwtVersion {
			c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
			c.Abort()
		} else if claims.User.RequirePasswordReset && !resetAllowed {
			c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
			c.Abort()
		} else {
			c.Set("user", claims.User)
			c.Next()
		}
	}
}
