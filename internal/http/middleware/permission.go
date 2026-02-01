//
// Permission Middleware
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

	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func Permission(entity string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userClaim, _ := c.MustGet("user").(JwtUserClaim)

		// Owner always have full permissions
		if userClaim.Role == "Owner" {
			c.Next()
			return
		}

		permission, ok := userClaim.Permissions[entity]
		if c.Request.Method == "GET" && ok && permission == 0 {
			c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
			c.Abort()
		} else if c.Request.Method != "GET" && ok && permission <= 1 {
			c.JSON(http.StatusUnauthorized, responses.Error("Unauthorized"))
			c.Abort()
		}

		c.Next()
	}
}
