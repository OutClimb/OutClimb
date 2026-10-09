//
// Newsletter Logic
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

package app

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/OutClimb/OutClimb/internal/store"
	"github.com/mailerlite/mailerlite-go"
)

const newsletterTimeout = 10 * time.Second

type newsletterMetadata struct {
	FirstNameFieldSlug string `json:"firstNameFieldSlug"`
	LastNameFieldSlug  string `json:"lastNameFieldSlug"`
	EmailFieldSlug     string `json:"emailFieldSlug"`
}

func parseNewsletterMetadata(metadata *string) newsletterMetadata {
	meta := newsletterMetadata{}
	if metadata != nil && len(*metadata) > 0 {
		if err := json.Unmarshal([]byte(*metadata), &meta); err != nil {
			return newsletterMetadata{}
		}
	}

	return meta
}

func isTruthy(val string) bool {
	switch strings.ToLower(val) {
	case "true", "1", "yes":
		return true
	default:
		return false
	}
}

// Subscribes the submitter for every checked newsletter field on the form. Failures are logged and
// never fail the submission, since the submission itself has already been stored.
func (a *appLayer) subscribeNewsletterFields(formId uint, fields []store.FormField, values map[string]string) {
	for _, field := range fields {
		if field.Type != "newsletter" || !isTruthy(values[field.Slug]) {
			continue
		}

		meta := parseNewsletterMetadata(field.Metadata)
		email := strings.TrimSpace(values[meta.EmailFieldSlug])
		if meta.EmailFieldSlug == "" || email == "" {
			slog.Warn("Newsletter field checked without an email address, skipping subscription",
				"layer", "app",
				"entity", "newsletter",
				"formId", formId,
				"field", field.Slug,
			)
			continue
		}

		firstName := ""
		if meta.FirstNameFieldSlug != "" {
			firstName = strings.TrimSpace(values[meta.FirstNameFieldSlug])
		}

		lastName := ""
		if meta.LastNameFieldSlug != "" {
			lastName = strings.TrimSpace(values[meta.LastNameFieldSlug])
		}

		if err := a.subscribeToNewsletter(email, firstName, lastName); err != nil {
			slog.Error("Unable to subscribe to newsletter",
				"layer", "app",
				"entity", "newsletter",
				"formId", formId,
				"field", field.Slug,
				"error", err,
			)
		}
	}
}

func (a *appLayer) subscribeToNewsletter(email, firstName, lastName string) error {
	if len(a.config.MailerLiteApiKey) == 0 {
		slog.Warn("MailerLite API key not configured, skipping newsletter subscription",
			"layer", "app",
			"entity", "newsletter",
		)
		return nil
	}

	subscriber := &mailerlite.UpsertSubscriber{
		Email:  email,
		Fields: map[string]interface{}{},
	}

	if firstName != "" {
		subscriber.Fields["name"] = firstName
	}

	if lastName != "" {
		subscriber.Fields["last_name"] = lastName
	}

	client := mailerlite.NewClient(a.config.MailerLiteApiKey)
	client.SetHttpClient(&http.Client{Timeout: newsletterTimeout})

	ctx, cancel := context.WithTimeout(context.Background(), newsletterTimeout)
	defer cancel()

	_, _, err := client.Subscriber.Upsert(ctx, subscriber)
	return err
}
