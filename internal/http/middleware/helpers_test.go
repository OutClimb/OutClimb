//
// Middleware Test Helpers
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
	"net/http/httptest"

	"github.com/gin-gonic/gin"
)

const testRemoteAddr = "192.0.2.10:4321"

func init() {
	gin.SetMode(gin.TestMode)
}

func newTestRouter(handlers ...gin.HandlerFunc) *gin.Engine {
	router := gin.New()
	router.Any("/", append(handlers, func(c *gin.Context) { c.Status(http.StatusOK) })...)
	return router
}

func performRequest(router *gin.Engine, method string, configure func(*http.Request)) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, "/", nil)
	request.RemoteAddr = testRemoteAddr
	if configure != nil {
		configure(request)
	}

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}
