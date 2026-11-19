//
// Redirect Www Middleware
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

	"github.com/gin-gonic/gin"
)

const wwwPrefix = "www."

func RedirectWwwToApex() gin.HandlerFunc {
	return func(c *gin.Context) {
		apexDomain, isWwwDomain := strings.CutPrefix(c.Request.Host, wwwPrefix)
		if !isWwwDomain {
			c.Next()
			return
		}

		scheme := "http"
		if c.Request.TLS != nil {
			scheme = "https"
		}

		c.Redirect(http.StatusMovedPermanently, scheme+"://"+apexDomain+c.Request.URL.RequestURI())
		c.Abort()
	}
}
