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
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *httpLayer) createForm(c *gin.Context) {

}

func (h *httpLayer) createSubmission(c *gin.Context) {
	// formSlug := c.Param("slug")

}

func (h *httpLayer) deleteForm(c *gin.Context) {
	_, err := strconv.ParseUint(c.Param("formId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Form ID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) deleteSubmission(c *gin.Context) {
	_, err := strconv.ParseUint(c.Param("formId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Form ID"})
		return
	}

	_, err = strconv.ParseUint(c.Param("submissionId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Submission ID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func (h *httpLayer) getForm(c *gin.Context) {
	// formSlug := c.Param("slug")
}

func (h *httpLayer) getForms(c *gin.Context) {

}

func (h *httpLayer) getSubmissions(c *gin.Context) {
	_, err := strconv.ParseUint(c.Param("formId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Form ID"})
		return
	}

}

func (h *httpLayer) updateForm(c *gin.Context) {
	_, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

}
