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
	"log/slog"
	"os"

	"github.com/spf13/viper"
)

var EnvironmentVariables = []string{
	"OC_PASSWORD_COST",
	"OC_RECAPTCHA_SECRET_KEY",
	"OC_RECAPTCHA_SECRET_KEY_FILE",
	"OC_DATABASE_HOST",
	"OC_DATABASE_NAME",
	"OC_DATABASE_PASSWORD",
	"OC_DATABASE_PASSWORD_FILE",
	"OC_DATABASE_PORT",
	"OC_DATABASE_PARAMS",
	"OC_DATABASE_USERNAME",
	"OC_DEFAULT_REDIRECT_URL",
	"OC_LISTENING_ADDRESS",
	"OC_REDIRECT_DOMAIN",
	"OC_REGISTER_DOMAIN",
	"OC_TRUSTED_PROXIES",
	"OC_JWT_ISSUER",
	"OC_JWT_LIFESPAN",
	"OC_JWT_SECRET",
	"OC_JWT_SECRET_FILE",
}

type AppConfig struct {
	PasswordCost           int    `mapstructure:"OC_PASSWORD_COST"`
	RecaptchaSecretKey     string `mapstructure:"OC_RECAPTCHA_SECRET_KEY"`
	RecaptchaSecretKeyFile string `mapstructure:"OC_RECAPTCHA_SECRET_KEY_FILE"`
}

type DatabaseConfig struct {
	Host         string `mapstructure:"OC_DATABASE_HOST"`
	Name         string `mapstructure:"OC_DATABASE_NAME"`
	Password     string `mapstructure:"OC_DATABASE_PASSWORD"`
	PasswordFile string `mapstructure:"OC_DATABASE_PASSWORD_FILE"`
	Port         string `mapstructure:"OC_DATABASE_PORT"`
	Params       string `mapstructure:"OC_DATABASE_PARAMS"`
	Username     string `mapstructure:"OC_DATABASE_USERNAME"`
}

type HttpConfig struct {
	DefaultRedirectURL string `mapstructure:"OC_DEFAULT_REDIRECT_URL"`
	Jwt                JwtConfig
	ListeningAddress   string   `mapstructure:"OC_LISTENING_ADDRESS"`
	RedirectDomain     string   `mapstructure:"OC_REDIRECT_DOMAIN"`
	RegisterDomain     string   `mapstructure:"OC_REGISTER_DOMAIN"`
	TrustedProxies     []string `mapstructure:"OC_TRUSTED_PROXIES"`
}

type JwtConfig struct {
	Issuer     string `mapstructure:"OC_JWT_ISSUER"`
	Lifespan   int    `mapstructure:"OC_JWT_LIFESPAN"`
	Secret     string `mapstructure:"OC_JWT_SECRET"`
	SecretFile string `mapstructure:"OC_JWT_SECRET_FILE"`
}

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	Http     HttpConfig
}

func LoadConfig(env string) (config Config) {
	slog.Info("Loading config")

	// Read config
	viper.AddConfigPath("./configs/")
	viper.SetConfigName(env)
	viper.SetConfigType("env")

	for _, env := range EnvironmentVariables {
		if err := viper.BindEnv(env); err != nil {
			slog.Error(
				"Issue when binding environment variable",
				"env", env,
				"error", err,
			)
		}
	}

	viper.AutomaticEnv()

	err := viper.ReadInConfig()
	if err != nil {
		slog.Error("Unable to load config", "error", err)
		os.Exit(1)
	}

	err = viper.Unmarshal(&config.App)
	if err != nil {
		slog.Error("Unable to parse app config", "error", err)
		os.Exit(1)
	}

	err = viper.Unmarshal(&config.Database)
	if err != nil {
		slog.Error("Unable to parse database config", "error", err)
		os.Exit(1)
	}

	err = viper.Unmarshal(&config.Http)
	if err != nil {
		slog.Error("Unable to parse http config", "error", err)
		os.Exit(1)
	}

	err = viper.Unmarshal(&config.Http.Jwt)
	if err != nil {
		slog.Error("Unable to parse http jwt config", "error", err)
		os.Exit(1)
	}

	// Load secret files, if provided
	if len(config.App.RecaptchaSecretKey) == 0 && len(config.App.RecaptchaSecretKeyFile) != 0 {
		content, err := ReadFile(&config.App.RecaptchaSecretKeyFile)
		if len(content) > 0 && err == nil {
			slog.Info("Loaded secret file for Recpatcha Secret Key")
			config.App.RecaptchaSecretKey = content
		}
	} else if env == "prod" {
		slog.Warn("Loading the Recpatcha Secret Key through environment variables is not recommended in production")
	}

	if len(config.Database.Password) == 0 && len(config.Database.PasswordFile) != 0 {
		content, err := ReadFile(&config.Database.PasswordFile)
		if len(content) > 0 && err == nil {
			slog.Info("Loaded secret file for Database Password")
			config.Database.Password = content
		}
	} else if env == "prod" {
		slog.Warn("Loading the Database Password through environment variables is not recommended in production")
	}

	if len(config.Http.Jwt.Secret) == 0 && len(config.Http.Jwt.SecretFile) != 0 {
		content, err := ReadFile(&config.Http.Jwt.SecretFile)
		if len(content) > 0 && err == nil {
			slog.Info("Loaded secret file for JWT Secret")
			config.Http.Jwt.Secret = content
		}
	} else if env == "prod" {
		slog.Warn("Loading the JWT Secret through environment variables is not recommended in production")
	}

	return
}

func (c *Config) Validate() error {
	if c.App.PasswordCost == 0 {
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
