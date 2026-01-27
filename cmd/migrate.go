//
// DB Migrate Command
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

package cmd

import (
	"log"
	"os"

	"github.com/OutClimb/OutClimb/internal/store"
	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/spf13/cobra"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Runs the database migration",
	Run:   runMigrate,
}

func init() {
	rootCmd.AddCommand(migrateCmd)
}

func runMigrate(cmd *cobra.Command, args []string) {
	env := os.Getenv("OUTCLIMB_ENV")
	if len(env) == 0 {
		env = "local"
	}

	config := utils.LoadConfig(env)

	err := config.Validate()
	if err != nil {
		log.Fatal("Error while validating config: " + err.Error())
		return
	}

	storeLayer := store.New(&config.Database, &config.Storage)
	storeLayer.Migrate()
}
