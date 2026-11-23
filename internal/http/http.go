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
	"path"
	"strings"
	"time"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http/middleware"
	"github.com/OutClimb/OutClimb/internal/utils"
	ginSlog "github.com/gin-contrib/slog"
	"github.com/gin-gonic/gin"
)

const (
	donateFrontendDirectory = "./web/donate"
	donateIndexPath         = "/index.html"
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

	h.engine.Use(gin.Recovery())
	h.engine.Use(ginSlog.SetLogger())
	h.engine.Use(middleware.SecurityHeaders(config.BehindTLS))
	h.engine.Use(middleware.RedirectWwwToApex())

	if len(config.TrustedProxies) > 0 {
		err := h.engine.SetTrustedProxies(config.TrustedProxies)
		if err != nil {
			slog.Error(
				"Unable to set trusted proxy",
				"layer", "http",
				"entity", "http",
				"trustedProxy", config.TrustedProxies,
				"error", err,
			)
		}
	}

	if config.BehindCloudflare {
		h.engine.TrustedPlatform = gin.PlatformCloudflare
	}

	h.setupFrontendRoutes()
	h.setupV1ApiRoutes()

	h.engine.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/manage/") {
			indexData, err := os.ReadFile("./web/manager/index.html")
			if err != nil {
				slog.Error(
					"Unable to read manager index file",
					"layer", "http",
					"entity", "http",
					"error", err,
				)
				c.Status(http.StatusInternalServerError)
				return
			}

			c.Data(http.StatusOK, "text/html", indexData)
			return
		}

		if strings.HasPrefix(c.Request.URL.Path, "/form/") && c.Request.Host == config.RegisterDomain {
			indexData, err := os.ReadFile("./web/form/index.html")
			if err != nil {
				slog.Error(
					"Unable to read form index file",
					"layer", "http",
					"entity", "http",
					"error", err,
				)
				c.Status(http.StatusInternalServerError)
				return
			}

			c.Data(http.StatusOK, "text/html", indexData)
			return
		}

		if c.Request.Host == config.DonateDomain {
			h.serveDonateFrontend(c)
			return
		}

		c.Redirect(http.StatusTemporaryRedirect, config.DefaultRedirectURL)
	})

	return h
}

func (h *httpLayer) serveDonateFrontend(c *gin.Context) {
	donateFiles := http.Dir(donateFrontendDirectory)

	cleanedPath := path.Clean("/" + c.Request.URL.Path)
	file, fileInfo := openDonateFile(donateFiles, cleanedPath)
	if file == nil {
		slog.Error(
			"Unable to read donate index file",
			"layer", "http",
			"entity", "http",
		)
		c.Status(http.StatusInternalServerError)
		return
	}
	defer func() { _ = file.Close() }()

	http.ServeContent(c.Writer, c.Request, fileInfo.Name(), fileInfo.ModTime(), file)
}

func openDonateFile(fileSystem http.FileSystem, cleanedPath string) (http.File, os.FileInfo) {
	candidatePaths := []string{
		cleanedPath,
		path.Join(cleanedPath, donateIndexPath),
		donateIndexPath,
	}

	for _, candidatePath := range candidatePaths {
		file, fileInfo := openRegularFile(fileSystem, candidatePath)
		if file != nil {
			return file, fileInfo
		}
	}

	return nil, nil
}

func openRegularFile(fileSystem http.FileSystem, filePath string) (http.File, os.FileInfo) {
	file, err := fileSystem.Open(filePath)
	if err != nil {
		return nil, nil
	}

	fileInfo, err := file.Stat()
	if err != nil || fileInfo.IsDir() {
		_ = file.Close()
		return nil, nil
	}

	return file, fileInfo
}

func (h *httpLayer) setupFrontendRoutes() {
	h.engine.StaticFile("/favicon.ico", "./web/favicon.ico")
	h.engine.StaticFile("/robots.txt", "./web/robots.txt")
	h.engine.Static("/manage", "./web/manager")
	h.engine.GET("/events/:month", middleware.Domain(h.config.AssetsDomain), h.newEventRateLimit(), h.getEventsForMonth)

	assets := h.engine.Group("/q/")
	{
		assets.Use(middleware.Domain(h.config.AssetsDomain))
		assets.GET("/:filename", h.asset)
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
		form.Static("/", "./web/form")
	}
}

func (h *httpLayer) setupV1ApiRoutes() {
	api := h.engine.Group("/api/v1")
	{
		api.GET("/ping", h.getPing)

		formRateLimitWindow, err := time.ParseDuration(h.config.FormRateLimitWindow)
		if err != nil {
			slog.Error(
				"Failed to parse form rate limit window, defaulting to 1 min",
				"input", h.config.FormRateLimitWindow,
				"error", err,
			)
			formRateLimitWindow = time.Minute
		}
		api.GET("/form/:slug", middleware.OptionalAuth(h.config), middleware.UnauthenticatedRateLimit(h.config.FormRateLimit, formRateLimitWindow, h.useClientIP()), h.getForm)
		api.GET("/captcha", middleware.RateLimit(h.config.FormRateLimit, formRateLimitWindow, h.useClientIP()), h.getCaptcha)
		api.GET("/events", h.newEventRateLimit(), h.getEvents)
		api.GET("/events/:id", h.newEventRateLimit(), h.getEvent)

		submissionRateLimitWindow, err := time.ParseDuration(h.config.SubmissionRateLimitWindow)
		if err != nil {
			slog.Error(
				"Failed to parse submission rate limit window, defaulting to 1 min",
				"input", h.config.SubmissionRateLimitWindow,
				"error", err,
			)
			submissionRateLimitWindow = time.Minute
		}
		api.POST("/submission/:slug", middleware.RequestBodyLimit(h.config.MaxJsonBodySize), middleware.RateLimit(h.config.SubmissionRateLimit, submissionRateLimitWindow, h.useClientIP()), h.createSubmission)

		api.POST("/donation/checkout", middleware.Domain(h.config.DonateDomain), middleware.RequestBodyLimit(h.config.MaxJsonBodySize), middleware.RateLimit(h.config.SubmissionRateLimit, submissionRateLimitWindow, h.useClientIP()), h.createDonationCheckout)
		api.POST("/stripe/webhook", middleware.Domain(h.config.DonateDomain), middleware.RequestBodyLimit(h.config.MaxJsonBodySize), h.handleStripeWebhook)

		loginRateLimitWindow, err := time.ParseDuration(h.config.LoginRateLimitWindow)
		if err != nil {
			slog.Error(
				"Failed to parse login rate limit window, defaulting to 1 min",
				"input", h.config.LoginRateLimitWindow,
				"error", err,
			)
			loginRateLimitWindow = time.Minute
		}
		api.POST("/token", middleware.RequestBodyLimit(h.config.MaxJsonBodySize), middleware.RateLimit(h.config.LoginRateLimit, loginRateLimitWindow, h.useClientIP()), h.createToken)

		api.PUT("/password", middleware.RequestBodyLimit(h.config.MaxJsonBodySize), middleware.Auth(h.config, true, true), h.updatePassword)

		totpApi := api.Group("/totp").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, true))
		{
			totpApi.POST("", h.beginTotpSetup)
			totpApi.PUT("", h.confirmTotpSetup)
		}

		assetApi := api.Group("/asset").Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("asset"))
		{
			assetApi.GET("", h.getAssets)
			assetApi.GET("/:id", h.getAsset)
			assetApi.POST("", middleware.RequestBodyLimit(h.config.MaxUploadSize), h.createAsset)
			assetApi.PUT("/:id", middleware.RequestBodyLimit(h.config.MaxUploadSize), h.updateAsset)
			assetApi.DELETE("/:id", h.deleteAsset)
		}

		redirectApi := api.Group("/redirect").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("redirect"))
		{
			redirectApi.GET("", h.getRedirects)
			redirectApi.GET("/:id", h.getRedirect)
			redirectApi.POST("", h.createRedirect)
			redirectApi.PUT("/:id", h.updateRedirect)
			redirectApi.DELETE("/:id", h.deleteRedirect)
		}

		locationApi := api.Group("/location").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("location"))
		{
			locationApi.GET("", h.getLocations)
			locationApi.GET("/:id", h.getLocation)
			locationApi.POST("", h.createLocation)
			locationApi.PUT("/:id", h.updateLocation)
			locationApi.DELETE("/:id", h.deleteLocation)
		}

		userApi := api.Group("/user").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("user"))
		{
			userApi.GET("", h.getUsers)
			userApi.GET("/:id", h.getUser)
			userApi.POST("", h.createUser)
			userApi.PUT("/:id", h.updateUser)
			userApi.DELETE("/:id", h.deleteUser)
		}

		roleApi := api.Group("/role").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("role"))
		{
			roleApi.GET("", h.getRoles)
			roleApi.GET("/:id", h.getRole)
			roleApi.POST("", h.createRole)
			roleApi.PUT("/:id", h.updateRole)
			roleApi.DELETE("/:id", h.deleteRole)
		}

		authFormApi := api.Group("/").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("form"))
		{
			authFormApi.GET("/form", h.getForms)
			authFormApi.POST("/form", h.createForm)
			authFormApi.PUT("/form/:id", h.updateForm)
			authFormApi.DELETE("/form/:id", h.deleteForm)
			authFormApi.PUT("/form/:id/viewable-by", h.updateFormViewableBy)
			authFormApi.GET("/form-viewer", h.getFormViewers)
			authFormApi.GET("/submission", h.getSubmissions)
			authFormApi.DELETE("/submission/:id", h.deleteSubmission)
		}

		donationApi := api.Group("/donation").Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("donation"))
		{
			donationApi.GET("", h.getDonations)
		}

		emailApi := api.Group("/email").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("email"))
		{
			emailApi.GET("", h.getEmails)
			emailApi.GET("/:id", h.getEmail)
			emailApi.POST("", h.createEmail)
			emailApi.PUT("/:id", h.updateEmail)
			emailApi.DELETE("/:id", h.deleteEmail)
		}

		eventApi := api.Group("/event").Use(middleware.RequestBodyLimit(h.config.MaxJsonBodySize)).Use(middleware.Auth(h.config, false, false)).Use(middleware.Permission("event"))
		{
			eventApi.GET("", h.getEvents)
			eventApi.GET("/:id", h.getEvent)
			eventApi.POST("", h.createEvent)
			eventApi.PUT("/:id", h.updateEvent)
			eventApi.DELETE("/:id", h.deleteEvent)
		}
	}
}

func (h *httpLayer) newEventRateLimit() gin.HandlerFunc {
	eventRateLimitWindow, err := time.ParseDuration(h.config.EventRateLimitWindow)
	if err != nil {
		slog.Error(
			"Failed to parse event rate limit window, defaulting to 1 min",
			"input", h.config.EventRateLimitWindow,
			"error", err,
		)
		eventRateLimitWindow = time.Minute
	}

	return middleware.RateLimit(h.config.EventRateLimit, eventRateLimitWindow, h.useClientIP())
}

func (h *httpLayer) useClientIP() bool {
	return h.config.BehindCloudflare || len(h.config.TrustedProxies) > 0
}

func (h *httpLayer) Run() {
	server := &http.Server{
		Addr:    h.config.ListeningAddress,
		Handler: h.engine,
	}

	var err error
	if len(h.config.TlsCertFiles) == 0 {
		err = server.ListenAndServe()
	} else {
		server.TLSConfig, err = buildTlsConfig(h.config.TlsCertFiles, h.config.TlsKeyFiles, h.config.TlsClientCaFile)
		if err == nil {
			err = server.ListenAndServeTLS("", "")
		}
	}

	if err != nil {
		slog.Error(
			"Issue while running HTTP server",
			"layer", "http",
			"entity", "http",
			"listeningAddress", h.config.ListeningAddress,
			"error", err,
		)
	}
}
