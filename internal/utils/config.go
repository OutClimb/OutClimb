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

type AppConfig struct{}

type DatabaseConfig struct {
	Host     string
	Name     string
	Password string
	Port     string
	TimeZone string
	Username string
}

type HttpConfig struct {
	Jwt              JwtConfig
	ListeningAddress string
	TrustedProxies   []string
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

	lifespan, err := strconv.Atoi(os.Getenv("JWT_LIFESPAN"))
	if err != nil {
		lifespan = 0
	}

	return &Config{
		App: AppConfig{},
		Database: DatabaseConfig{
			Host:     os.Getenv("DATABASE_HOST"),
			Name:     os.Getenv("DATABASE_NAME"),
			Password: os.Getenv("DATABASE_PASSWORD"),
			Port:     os.Getenv("DATABASE_PORT"),
			TimeZone: os.Getenv("DATABASE_TIMEZONE"),
			Username: os.Getenv("DATABASE_USERNAME"),
		},
		Http: HttpConfig{
			Jwt: JwtConfig{
				Issuer:   os.Getenv("JWT_ISSUER"),
				Lifespan: lifespan,
				Secret:   os.Getenv("JWT_SECRET"),
			},
			ListeningAddress: os.Getenv("HTTP_LISTENING_ADDRESS"),
			TrustedProxies:   strings.Split(os.Getenv("HTTP_TRUSTED_PROXIES"), ","),
		},
	}
}

func (c *Config) Validate() error {
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

	if len(c.Http.Jwt.Secret) == 0 {
		return errors.New("no jwt secret provided")
	}

	if len(c.Http.ListeningAddress) == 0 {
		return errors.New("no listening address provided")
	}

	return nil
}
