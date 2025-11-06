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
	"log"
	"net/http"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/gin-gonic/gin"
)

type httpLayer struct {
	app    app.AppLayer
	config *utils.HttpConfig
	engine *gin.Engine
}

func New(appLayer app.AppLayer, config *utils.HttpConfig, env *string) *httpLayer {
	if *env == "prod" {
		gin.SetMode("release")
	} else {
		gin.SetMode("debug")
	}

	h := &httpLayer{
		app:    appLayer,
		config: config,
		engine: gin.New(),
	}

	if len(config.TrustedProxies) > 0 {
		err := h.engine.SetTrustedProxies(config.TrustedProxies)
		if err != nil {
			log.Print("Error while setting trusted proxies: " + err.Error())
		}
	}

	h.setupFrontendRoutes()
	h.setupV1ApiRoutes()

	h.engine.NoRoute(func(c *gin.Context) {
		c.Redirect(http.StatusTemporaryRedirect, config.DefaultRedirectURL)
	})

	return h
}

func (h *httpLayer) setupFrontendRoutes() {
	h.engine.StaticFile("/favicon.ico", "./web/favicon.ico")
	h.engine.StaticFile("/robots.txt", "./web/robots.txt")
	h.engine.Static("/manage", "./assets/manage")

	redirect := h.engine.Group("/b")
	{
		redirect.Use(middleware.Domain(h.config.RedirectDomain))
		redirect.GET("/*path", h.redirect)
		redirect.HEAD("/*path", h.redirect)
	}

	form := h.engine.Group("/form")
	{
		form.Use(middleware.Domain(h.config.RegisterDomain))
		form.Static("/", "./assets/form")
	}
}

func (h *httpLayer) setupV1ApiRoutes() {
	api := h.engine.Group("/api/v1")
	{
		api.GET("/ping", h.getPing)

		api.POST("/token", h.createToken)

		userReset := api.Group("/").Use(middleware.Auth(h.config, "user", true))
		{
			userReset.PUT("/password", h.updatePassword)
		}

		adminApi := api.Group("/").Use(middleware.Auth(h.config, "admin", false))
		{
			adminApi.GET("/redirect", h.getRedirects)
			adminApi.GET("/redirect/:id", h.getRedirect)
			adminApi.POST("/redirect", h.createRedirect)
			adminApi.PUT("/redirect/:id", h.updateRedirect)
			adminApi.DELETE("/redirect/:id", h.deleteRedirect)
		}
	}
}

func (h *httpLayer) Run() {
	err := h.engine.Run(h.config.ListeningAddress)
	if err != nil {
		log.Fatal("Error while calling run on gin framework: " + err.Error())
	}
}
