//
// HTTP Layer
// Copyright 2025 OutClimb
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
	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/gin-gonic/gin"
)

type httpLayer struct {
	app    app.AppLayer
	config *utils.HttpConfig
	engine *gin.Engine
}

func New(appLayer app.AppLayer, config *utils.HttpConfig) *httpLayer {
	h := &httpLayer{
		app:    appLayer,
		config: config,
		engine: gin.New(),
	}

	if len(config.TrustedProxies) > 0 {
		h.engine.SetTrustedProxies(config.TrustedProxies)
	}

	return h
}

func (h *httpLayer) Run() {
	h.engine.Run(h.config.ListeningAddress)
}
