//
// Config Utility
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

package utils

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type AppConfig struct {
	PasswordCost       int
	RecaptchaSecretKey string
}

type DatabaseConfig struct {
	Host        string
	Name        string
	Password    string
	Port        string
	SslDisabled bool
	TimeZone    string
	Username    string
}

type HttpConfig struct {
	DefaultRedirectURL string
	Jwt                JwtConfig
	ListeningAddress   string
	RedirectDomain     string
	RegisterDomain     string
	TrustedProxies     []string
}

type JwtConfig struct {
	Issuer   string
	Lifespan int
	Secret   string
}

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	Http     HttpConfig
}

func LoadConfig(env *string) *Config {
	err := godotenv.Load("configs/" + *env + ".env")
	if err != nil {
		log.Fatal("Unable to load config for environment: " + *env)
		return nil
	}

	passwordCost, err := strconv.Atoi(os.Getenv("PASSWORD_COST"))
	if err != nil {
		passwordCost = 0
	}

	lifespan, err := strconv.Atoi(os.Getenv("JWT_LIFESPAN"))
	if err != nil {
		lifespan = 0
	}

	sslDisabled, err := strconv.Atoi(os.Getenv("DATABASE_SSL_MODE_DISABLED"))
	if err != nil {
		sslDisabled = 0
	}

	trustProxies := []string{}
	trustedProxiesString := os.Getenv("HTTP_TRUSTED_PROXIES")
	if len(trustedProxiesString) != 0 {
		trustProxies = strings.Split(trustedProxiesString, ",")
	}

	return &Config{
		App: AppConfig{
			PasswordCost:       passwordCost,
			RecaptchaSecretKey: LoadEnvOrFileContent("RECAPTCHA_SECRET_KEY", "RECAPTCHA_SECRET_KEY_FILE"),
		},
		Database: DatabaseConfig{
			Host:        os.Getenv("DATABASE_HOST"),
			Name:        os.Getenv("DATABASE_NAME"),
			Password:    LoadEnvOrFileContent("DATABASE_PASSWORD", "DATABASE_PASSWORD_FILE"),
			Port:        os.Getenv("DATABASE_PORT"),
			SslDisabled: sslDisabled > 0,
			TimeZone:    os.Getenv("DATABASE_TIMEZONE"),
			Username:    os.Getenv("DATABASE_USERNAME"),
		},
		Http: HttpConfig{
			DefaultRedirectURL: os.Getenv("HTTP_DEFAULT_REDIRECT_URL"),
			Jwt: JwtConfig{
				Issuer:   os.Getenv("JWT_ISSUER"),
				Lifespan: lifespan,
				Secret:   LoadEnvOrFileContent("JWT_SECRET", "JWT_SECRET_FILE"),
			},
			ListeningAddress: os.Getenv("HTTP_LISTENING_ADDRESS"),
			RedirectDomain:   os.Getenv("HTTP_REDIRECT_DOMAIN"),
			RegisterDomain:   os.Getenv("HTTP_REGISTER_DOMAIN"),
			TrustedProxies:   trustProxies,
		},
	}
}

func LoadEnvOrFileContent(envKey string, envFileKey string) string {
	fileValue := os.Getenv(envFileKey)
	if len(fileValue) != 0 {
		content, err := ReadFile(&fileValue)
		if len(content) > 0 && err == nil {
			return content
		}
	}

	return os.Getenv(envKey)
}

func (c *Config) Validate() error {
	if c.Http.Jwt.Lifespan == 0 {
		return errors.New("password cost must be greater than zero")
	}

	if len(c.Database.Host) == 0 {
		return errors.New("no database host provided")
	}

	if len(c.Database.Name) == 0 {
		return errors.New("no database name provided")
	}

	if len(c.Database.Username) == 0 {
		return errors.New("no database username provided")
	}

	if len(c.Http.Jwt.Issuer) == 0 {
		return errors.New("no jwt issuer provided")
	}

	if c.Http.Jwt.Lifespan == 0 {
		return errors.New("jwt lifespan must be greater than zero")
	}

	if len(c.Http.DefaultRedirectURL) == 0 {
		return errors.New("no domain for default redirect URL provided")
	}

	if len(c.Http.Jwt.Secret) == 0 {
		return errors.New("no jwt secret provided")
	}

	if len(c.Http.ListeningAddress) == 0 {
		return errors.New("no listening address provided")
	}

	if len(c.Http.RedirectDomain) == 0 {
		return errors.New("no domain for redirect provided")
	}

	if len(c.Http.RegisterDomain) == 0 {
		return errors.New("no domain for register provided")
	}

	return nil
}
