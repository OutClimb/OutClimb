//
// Create User Command
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
	"fmt"
	"os"

	"github.com/OutClimb/OutClimb/internal/store"
	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/spf13/cobra"
	"golang.org/x/crypto/bcrypt"
)

type createUser struct {
	username string
	password string
	name     string
	email    string
}

var createUserContext = createUser{}

var createUserCmd = &cobra.Command{
	Use:   "create-user",
	Short: "Creates a user in the database",
	Run:   runCreateUser,
}

func init() {
	rootCmd.AddCommand(createUserCmd)

	createUserCmd.PersistentFlags().StringVarP(&createUserContext.username, "username", "u", "", "The user's username")
	createUserCmd.PersistentFlags().StringVarP(&createUserContext.password, "password", "p", "", "The user's password")
	createUserCmd.PersistentFlags().StringVarP(&createUserContext.name, "name", "n", "", "The name to associate to the user")
	createUserCmd.PersistentFlags().StringVarP(&createUserContext.email, "email", "e", "", "The email to associate to the user")

	err := createUserCmd.MarkPersistentFlagRequired("username")
	if err != nil {
		fmt.Printf("There was an issue marking username flag as required")
	}

	err = createUserCmd.MarkPersistentFlagRequired("password")
	if err != nil {
		fmt.Printf("There was an issue marking password flag as required")
	}

	err = createUserCmd.MarkPersistentFlagRequired("name")
	if err != nil {
		fmt.Printf("There was an issue marking name flag as required")
	}

	err = createUserCmd.MarkPersistentFlagRequired("email")
	if err != nil {
		fmt.Printf("There was an issue marking email flag as required")
	}
}

func runCreateUser(cmd *cobra.Command, args []string) {
	env := os.Getenv("OUTCLIMB_ENV")
	if len(env) == 0 {
		env = "local"
	}

	config := utils.LoadConfig(env)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(createUserContext.password), config.App.PasswordCost)
	if err != nil {
		fmt.Println("Issue generating password")
		return
	}

	storeLayer := store.New(&config.Database)
	user, err := storeLayer.CreateUser("super", createUserContext.email, createUserContext.name, string(hashedPassword), createUserContext.username)
	if err != nil {
		fmt.Println("Error creating user: ", err)
		return
	}

	fmt.Println("User created successfully")
	fmt.Println("ID: ", user.ID)
	fmt.Println("Username: ", user.Username)
	fmt.Println("Name: ", user.Name)
	fmt.Println("Email: ", user.Email)
}
