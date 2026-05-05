//
// Email Logic
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
	"bytes"
	htmltemplate "html/template"
	"log/slog"
	"text/template"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/resend/resend-go/v3"
)

func (a *appLayer) sendEmail(to []string, email *models.EmailInternal, data interface{}) error {
	if len(a.config.ResendApiKey) == 0 {
		slog.Warn("Resend API key not configured, skipping email",
			"layer", "app",
			"entity", "email",
			"slug", email.Slug,
		)
		return nil
	}

	subjectTmpl, err := template.New("subject").Parse(email.Subject)
	if err != nil {
		return err
	}
	var subjectBuf bytes.Buffer
	if err := subjectTmpl.Execute(&subjectBuf, data); err != nil {
		return err
	}

	htmlTmpl, err := htmltemplate.New("html").Parse(email.HtmlBody)
	if err != nil {
		return err
	}
	var htmlBuf bytes.Buffer
	if err := htmlTmpl.Execute(&htmlBuf, data); err != nil {
		return err
	}

	textTmpl, err := template.New("text").Parse(email.TextBody)
	if err != nil {
		return err
	}
	var textBuf bytes.Buffer
	if err := textTmpl.Execute(&textBuf, data); err != nil {
		return err
	}

	client := resend.NewClient(a.config.ResendApiKey)
	params := &resend.SendEmailRequest{
		From:    a.config.EmailFromAddress,
		To:      to,
		Subject: subjectBuf.String(),
		Html:    htmlBuf.String(),
		Text:    textBuf.String(),
	}
	_, err = client.Emails.Send(params)
	return err
}

func (a *appLayer) CreateEmail(user *models.UserInternal, name, slug, subject, htmlBody, textBody string) (*models.EmailInternal, error) {
	email, err := a.store.CreateEmail(user.Username, name, slug, subject, htmlBody, textBody)
	if err != nil {
		return nil, err
	}

	internal := models.EmailInternal{}
	internal.Internalize(email)
	return &internal, nil
}

func (a *appLayer) DeleteEmail(id uint) error {
	return a.store.DeleteEmail(id)
}

func (a *appLayer) GetAllEmails() (*[]models.EmailInternal, error) {
	emails, err := a.store.GetAllEmails()
	if err != nil {
		return nil, err
	}

	result := make([]models.EmailInternal, len(*emails))
	for i := range *emails {
		result[i].Internalize(&(*emails)[i])
	}
	return &result, nil
}

func (a *appLayer) GetEmail(id uint) (*models.EmailInternal, error) {
	email, err := a.store.GetEmail(id)
	if err != nil {
		return nil, err
	}

	internal := models.EmailInternal{}
	internal.Internalize(email)
	return &internal, nil
}

func (a *appLayer) UpdateEmail(user *models.UserInternal, id uint, name, slug, subject, htmlBody, textBody string) (*models.EmailInternal, error) {
	email, err := a.store.UpdateEmail(id, user.Username, name, slug, subject, htmlBody, textBody)
	if err != nil {
		return nil, err
	}

	internal := models.EmailInternal{}
	internal.Internalize(email)
	return &internal, nil
}
