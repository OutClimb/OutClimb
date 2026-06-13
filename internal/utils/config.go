//
// Config Utility
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

package utils

import (
	"errors"
	"fmt"
	"log/slog"
	"reflect"
	"strings"

	"github.com/spf13/viper"
)

type AppConfig struct {
	EmailFromAddress       string `mapstructure:"OC_EMAIL_FROM_ADDRESS"`
	PasswordCost           int    `mapstructure:"OC_PASSWORD_COST"`
	RecaptchaSecretKey     string `mapstructure:"OC_RECAPTCHA_SECRET_KEY"`
	RecaptchaSecretKeyFile string `mapstructure:"OC_RECAPTCHA_SECRET_KEY_FILE"`
	ResendApiKey           string `mapstructure:"OC_RESEND_API_KEY"`
	ResendApiKeyFile       string `mapstructure:"OC_RESEND_API_KEY_FILE"`
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
	AssetsDomain              string    `mapstructure:"OC_ASSETS_DOMAIN"`
	BehindTLS                 bool      `mapstructure:"OC_BEHIND_TLS"`
	DefaultRedirectURL        string    `mapstructure:"OC_DEFAULT_REDIRECT_URL"`
	FormRateLimit             int       `mapstructure:"OC_FORM_RATE_LIMIT"`
	FormRateLimitWindow       string    `mapstructure:"OC_FORM_RATE_LIMIT_WINDOW"`
	Jwt                       JwtConfig `mapstructure:",squash"`
	ListeningAddress          string    `mapstructure:"OC_LISTENING_ADDRESS"`
	LoginRateLimit            int       `mapstructure:"OC_LOGIN_RATE_LIMIT"`
	LoginRateLimitWindow      string    `mapstructure:"OC_LOGIN_RATE_LIMIT_WINDOW"`
	MaxJsonBodySize           int64     `mapstructure:"OC_MAX_JSON_BODY_SIZE"`
	MaxUploadSize             int64     `mapstructure:"OC_MAX_UPLOAD_SIZE"`
	RedirectDomain            string    `mapstructure:"OC_REDIRECT_DOMAIN"`
	RegisterDomain            string    `mapstructure:"OC_REGISTER_DOMAIN"`
	SubmissionRateLimit       int       `mapstructure:"OC_SUBMISSION_RATE_LIMIT"`
	SubmissionRateLimitWindow string    `mapstructure:"OC_SUBMISSION_RATE_LIMIT_WINDOW"`
	TrustedProxies            []string  `mapstructure:"OC_TRUSTED_PROXIES"`
}

type JwtConfig struct {
	Issuer     string `mapstructure:"OC_JWT_ISSUER"`
	Lifespan   int    `mapstructure:"OC_JWT_LIFESPAN"`
	Secret     string `mapstructure:"OC_JWT_SECRET"`
	SecretFile string `mapstructure:"OC_JWT_SECRET_FILE"`
}

type StoreConfig struct {
	EventsRSSURL string `mapstructure:"OC_EVENTS_RSS_URL"`
}

type StorageConfig struct {
	AccessKey     string `mapstructure:"OC_STORAGE_ACCESS_KEY"`
	Bucket        string `mapstructure:"OC_STORAGE_BUCKET"`
	Endpoint      string `mapstructure:"OC_STORAGE_ENDPOINT"`
	Prefix        string `mapstructure:"OC_STORAGE_PREFIX"`
	Region        string `mapstructure:"OC_STORAGE_REGION"`
	SecretKey     string `mapstructure:"OC_STORAGE_SECRET_KEY"`
	SecretKeyFile string `mapstructure:"OC_STORAGE_SECRET_KEY_FILE"`
}

type Config struct {
	App      AppConfig      `mapstructure:",squash"`
	Database DatabaseConfig `mapstructure:",squash"`
	Http     HttpConfig     `mapstructure:",squash"`
	Store    StoreConfig    `mapstructure:",squash"`
	Storage  StorageConfig  `mapstructure:",squash"`
}

func LoadConfig(env string) (Config, error) {
	slog.Info("Loading config")

	v := viper.New()
	v.AddConfigPath("./configs/")
	v.SetConfigName(env)
	v.SetConfigType("env")

	var config Config
	if err := bindEnvVars(v, reflect.TypeOf(config)); err != nil {
		return config, fmt.Errorf("bind env vars: %w", err)
	}

	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		return config, fmt.Errorf("read config: %w", err)
	}

	if err := v.Unmarshal(&config); err != nil {
		return config, fmt.Errorf("unmarshal config: %w", err)
	}

	loadSecretFromFile(&config.App.RecaptchaSecretKey, config.App.RecaptchaSecretKeyFile, "Recaptcha Secret Key", env)
	loadSecretFromFile(&config.Database.Password, config.Database.PasswordFile, "Database Password", env)
	loadSecretFromFile(&config.Http.Jwt.Secret, config.Http.Jwt.SecretFile, "JWT Secret", env)
	loadSecretFromFile(&config.Storage.SecretKey, config.Storage.SecretKeyFile, "Storage Secret Key", env)
	loadSecretFromFile(&config.App.ResendApiKey, config.App.ResendApiKeyFile, "Resend API Key", env)

	return config, nil
}

func bindEnvVars(v *viper.Viper, t reflect.Type) error {
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		if f.Type.Kind() == reflect.Struct {
			if err := bindEnvVars(v, f.Type); err != nil {
				return err
			}
			continue
		}
		tag := f.Tag.Get("mapstructure")
		if tag == "" || tag == "-" {
			continue
		}
		name := strings.Split(tag, ",")[0]
		if name == "" {
			continue
		}
		if err := v.BindEnv(name); err != nil {
			return err
		}
	}
	return nil
}

func loadSecretFromFile(value *string, file, name, env string) {
	if len(file) != 0 && len(*value) == 0 {
		content, err := ReadFile(&file)
		if err != nil {
			slog.Error(
				"Unable to load "+name+" from file",
				"layer", "utils",
				"entity", "config",
				"error", err,
			)
			return
		}
		if len(content) > 0 {
			slog.Info("Loaded secret file for " + name)
			*value = strings.TrimSpace(content)
		}
		return
	}
	if env == "prod" && len(*value) != 0 {
		slog.Warn("Loading the " + name + " through environment variables is not recommended in production")
	}
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

	if len(c.Http.AssetsDomain) == 0 {
		return errors.New("no domain for assets provided")
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

	if len(c.Storage.AccessKey) == 0 {
		return errors.New("no storage access key provided")
	}

	if len(c.Storage.Endpoint) == 0 {
		return errors.New("no storage endpoint provided")
	}

	if len(c.Storage.Region) == 0 {
		return errors.New("no storage region provided")
	}

	if len(c.Storage.SecretKey) == 0 {
		return errors.New("no storage secret key provided")
	}
	return nil
}
