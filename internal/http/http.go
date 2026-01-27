//
// HTTP Layer
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
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/utils"
	ginSlog "github.com/gin-contrib/slog"
	"github.com/gin-gonic/gin"
)

type httpLayer struct {
	app    app.AppLayer
	config *utils.HttpConfig
	engine *gin.Engine
}

func New(appLayer app.AppLayer, config *utils.HttpConfig, env string) *httpLayer {
	if env == "prod" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	h := &httpLayer{
		app:    appLayer,
		config: config,
		engine: gin.New(),
	}

	h.engine.Use(ginSlog.SetLogger())

	if len(config.TrustedProxies) > 0 {
		err := h.engine.SetTrustedProxies(config.TrustedProxies)
		if err != nil {
			slog.Error(
				"Unable to set trusted proxy",
				"trustedProxy", config.TrustedProxies,
				"error", err,
			)
		}
	}

	h.setupFrontendRoutes()
	h.setupV1ApiRoutes()

	h.engine.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/manage/") {
			indexData, err := os.ReadFile("./web/manager/index.html")
			if err != nil {
				panic(err)
			}

			c.Data(http.StatusOK, "text/html", indexData)
			return
		}

		c.Redirect(http.StatusTemporaryRedirect, config.DefaultRedirectURL)
	})

	return h
}

func (h *httpLayer) setupFrontendRoutes() {
	h.engine.StaticFile("/favicon.ico", "./web/favicon.ico")
	h.engine.StaticFile("/robots.txt", "./web/robots.txt")
	h.engine.Static("/manage", "./web/manager")

	assets := h.engine.Group("/q/")
	{
		assets.Use(middleware.Domain(h.config.AssetsDomain))
		assets.GET("/*filename", h.asset)
	}

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

		userReset := api.Group("/").Use(middleware.Auth(h.config, true))
		{
			userReset.PUT("/password", h.updatePassword)
		}

		adminApi := api.Group("/").Use(middleware.Auth(h.config, false))
		{
			adminApi.GET("/asset", h.getAssets)
			adminApi.GET("/asset/:id", h.getAsset)
			adminApi.POST("/asset", h.createAsset)
			adminApi.PUT("/asset/:id", h.updateAsset)
			adminApi.DELETE("/asset/:id", h.deleteAsset)

			adminApi.GET("/redirect", h.getRedirects)
			adminApi.GET("/redirect/:id", h.getRedirect)
			adminApi.POST("/redirect", h.createRedirect)
			adminApi.PUT("/redirect/:id", h.updateRedirect)
			adminApi.DELETE("/redirect/:id", h.deleteRedirect)

			adminApi.GET("/location", h.getLocations)
			adminApi.GET("/location/:id", h.getLocation)
			adminApi.POST("/location", h.createLocation)
			adminApi.PUT("/location/:id", h.updateLocation)
			adminApi.DELETE("/location/:id", h.deleteLocation)
		}
	}
}

func (h *httpLayer) Run() {
	err := h.engine.Run(h.config.ListeningAddress)
	if err != nil {
		slog.Error(
			"Issue while running Gin",
			"listeningAddress", h.config.ListeningAddress,
			"error", err,
		)
	}
}
