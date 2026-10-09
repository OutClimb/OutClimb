//
// Captcha Routes
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
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *httpLayer) getCaptcha(c *gin.Context) {
	challenge, err := h.app.CreateCaptchaChallenge()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create captcha challenge"})
		return
	}

	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusOK, challenge)
}
