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
	"encoding/xml"
	"net/http"
	"time"

	"github.com/OutClimb/OutClimb/internal/http/responses"
	"github.com/gin-gonic/gin"
)

func (h *httpLayer) getEventsForMonth(c *gin.Context) {
	month, err := time.Parse("2006-01", c.Param("month"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid month format, expected YYYY-MM"})
		return
	}

	feed, err := h.app.GetEventsForMonth(month.Year(), month.Month())
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch events"})
		return
	}

	var resp responses.EventFeedPublic
	resp.Publicize(feed)

	output, err := xml.MarshalIndent(resp, "", "  ")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate response"})
		return
	}

	c.Data(http.StatusOK, "application/rss+xml; charset=utf-8", append([]byte(xml.Header), output...))
}
