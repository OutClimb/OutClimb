//
// Service Start Command
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

package cmd

import (
	"log/slog"
	"os"

	"github.com/OutClimb/OutClimb/internal/app"
	"github.com/OutClimb/OutClimb/internal/http"
	"github.com/OutClimb/OutClimb/internal/store"
	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/spf13/cobra"
)

var serviceCmd = &cobra.Command{
	Use:   "service",
	Short: "Runs the OutClimb service",
	Run:   runService,
}

func init() {
	rootCmd.AddCommand(serviceCmd)
}

func runService(cmd *cobra.Command, args []string) {
	env := os.Getenv("OUTCLIMB_ENV")
	if len(env) == 0 {
		env = "local"
	}

	if env == "prod" {
		logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("env", env)
		slog.SetDefault(logger)
	} else {
		logger := slog.New(slog.NewTextHandler(os.Stdout, nil)).With("env", env)
		slog.SetDefault(logger)
	}

	config := utils.LoadConfig(env)

	err := config.Validate()
	if err != nil {
		slog.Error("Unable to validate config", "error", err)
		os.Exit(1)
	}

	storeLayer := store.New(&config.Database)

	storeLayer.Migrate()

	appLayer := app.New(storeLayer, &config.App)
	httpLayer := http.New(appLayer, &config.Http, env)

	httpLayer.Run()
}
