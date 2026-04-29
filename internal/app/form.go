//
// Form Logic
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
	"encoding/json"
	"errors"
	"log/slog"
	"regexp"
	"slices"
	"strings"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/OutClimb/OutClimb/internal/store"
)

var (
	ErrFormNotFound = errors.New("form not found")
	ErrFormNotOpen  = errors.New("form not open")
	ErrFormClosed   = errors.New("form closed")
	ErrFormFull     = errors.New("form max submissions reached")
	ErrInvalidField = errors.New("invalid field value")
	ErrMissingField = errors.New("missing required field")
	ErrForbidden    = errors.New("forbidden")
)

type FormFieldInput struct {
	Name       string
	Slug       string
	Type       string
	Metadata   *string
	Validation *string
	Required   bool
	Order      uint
}

func canViewSubmissions(user *models.UserInternal, form *models.FormInternal) bool {
	if user.Role == "Owner" {
		return true
	}

	level, ok := user.Permissions["form"]
	if !ok {
		return false
	}

	if level >= uint(store.LevelWrite) {
		return true
	}

	if level >= uint(store.LevelRead) {
		return slices.Contains(form.ViewableBy, user.ID)
	}

	return false
}

func millisToTime(ms *int64) *time.Time {
	if ms == nil || *ms <= 0 {
		return nil
	}

	t := time.UnixMilli(*ms)
	return &t
}

func (a *appLayer) loadFormInternal(formId uint) (*models.FormInternal, error) {
	form, err := a.store.GetForm(formId)
	if err != nil {
		return nil, err
	}

	fields, err := a.store.GetAllFormFieldsForForm(formId)
	if err != nil {
		return nil, err
	}

	internal := models.FormInternal{}
	internal.Internalize(form, fields)

	return &internal, nil
}

func (a *appLayer) checkFormAvailability(form *store.Form) error {
	now := time.Now()

	if form.OpensOn != nil && now.Before(*form.OpensOn) {
		return ErrFormNotOpen
	}

	if form.ClosesOn != nil && !now.Before(*form.ClosesOn) {
		return ErrFormClosed
	}

	if form.MaxSubmissions != nil {
		count, err := a.store.CountSubmissionsForForm(form.ID)
		if err != nil {
			return err
		}
		if count >= int64(*form.MaxSubmissions) {
			return ErrFormFull
		}
	}

	return nil
}

func validateFieldValue(field store.FormField, val string) error {
	if field.Required && len(val) == 0 {
		return ErrMissingField
	}

	if field.Validation != nil && len(val) > 0 {
		matched, err := regexp.MatchString(*field.Validation, val)
		if err != nil || !matched {
			return ErrInvalidField
		}
	}

	var metadata *interface{}
	if field.Metadata != nil && len(*field.Metadata) > 0 {
		err := json.Unmarshal([]byte(*field.Metadata), &metadata)
		if err != nil {
			metadata = nil
		}
	}

	if field.Type == "checkboxes" && val != "" {
		options := (*metadata).(map[string]interface{})
		selectedOptions := strings.Split(val, ", ")
		for _, selectedOption := range selectedOptions {
			if _, ok := options[selectedOption]; !ok {
				return ErrInvalidField
			}
		}
	}

	if (field.Type == "radios" || field.Type == "select") && val != "" {
		options := (*metadata).(map[string]interface{})
		if _, ok := options[val]; !ok {
			return ErrInvalidField
		}
	}

	if field.Type == "bool" && val != "" {
		lowerValue := strings.ToLower(val)
		possibleValues := map[string]bool{"true": true, "false": true, "1": true, "0": true, "yes": true, "no": true}
		if _, ok := possibleValues[lowerValue]; !ok {
			return ErrInvalidField
		}
	}

	return nil
}

func (a *appLayer) CreateForm(user *models.UserInternal, name, slug string, opensOn, closesOn *int64, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage *string, viewableBy []uint, fields []FormFieldInput) (*models.FormInternal, error) {
	var formId uint

	err := a.store.WithTransaction(func(tx store.StoreLayer) error {
		form, err := tx.CreateForm(user.Username, name, slug, millisToTime(opensOn), millisToTime(closesOn), maxSubmissions, notOpenMessage, closedMessage, filledMessage, successMessage)
		if err != nil {
			return err
		}
		formId = form.ID

		for _, f := range fields {
			if _, err := tx.CreateFormField(user.Username, form.ID, f.Name, f.Slug, f.Type, f.Metadata, f.Validation, f.Required, f.Order); err != nil {
				return err
			}
		}

		return tx.SetFormViewableBy(form.ID, viewableBy)
	})

	if err != nil {
		slog.Error("Unable to create form",
			"layer", "app",
			"entity", "form",
			"error", err,
		)
		return nil, err
	}

	return a.loadFormInternal(formId)
}

func (a *appLayer) UpdateForm(user *models.UserInternal, id uint, name, slug string, opensOn, closesOn *int64, maxSubmissions *uint, notOpenMessage, closedMessage, filledMessage, successMessage *string, viewableBy []uint, fields []FormFieldInput) (*models.FormInternal, error) {
	err := a.store.WithTransaction(func(tx store.StoreLayer) error {
		form, err := tx.UpdateForm(id, user.Username, name, slug, millisToTime(opensOn), millisToTime(closesOn), maxSubmissions, notOpenMessage, closedMessage, filledMessage, successMessage)
		if err != nil {
			return err
		}

		existing, err := tx.GetAllFormFieldsForForm(form.ID)
		if err != nil {
			return err
		}

		existingBySlug := map[string]*store.FormField{}
		for i := range *existing {
			f := &(*existing)[i]
			existingBySlug[f.Slug] = f
		}

		for _, f := range fields {
			if ex, ok := existingBySlug[f.Slug]; ok {
				if _, err := tx.UpdateFormField(ex.ID, user.Username, f.Name, f.Slug, f.Type, f.Metadata, f.Validation, f.Required, f.Order); err != nil {
					return err
				}
				delete(existingBySlug, f.Slug)
			} else {
				if _, err := tx.CreateFormField(user.Username, form.ID, f.Name, f.Slug, f.Type, f.Metadata, f.Validation, f.Required, f.Order); err != nil {
					return err
				}
			}
		}

		for _, f := range existingBySlug {
			if err := tx.DeleteFormField(f.ID); err != nil {
				return err
			}
		}

		return tx.SetFormViewableBy(form.ID, viewableBy)
	})

	if err != nil {
		slog.Error("Unable to update form",
			"layer", "app",
			"entity", "form",
			"id", id,
			"error", err,
		)
		return nil, err
	}

	return a.loadFormInternal(id)
}

func (a *appLayer) DeleteForm(user *models.UserInternal, id uint) error {
	err := a.store.WithTransaction(func(tx store.StoreLayer) error {
		if err := tx.DeleteSubmissionValuesForForm(id); err != nil {
			return err
		}

		if err := tx.DeleteSubmissionsForForm(id); err != nil {
			return err
		}

		if err := tx.DeleteFormFieldForForm(id); err != nil {
			return err
		}

		if err := tx.SetFormViewableBy(id, nil); err != nil {
			return err
		}

		return tx.DeleteForm(id)
	})

	if err != nil {
		slog.Error("Unable to delete form",
			"layer", "app",
			"entity", "form",
			"id", id,
			"error", err,
		)
	}

	return err
}

func (a *appLayer) GetForm(user *models.UserInternal, id uint) (*models.FormInternal, error) {
	return a.loadFormInternal(id)
}

func (a *appLayer) GetFormBySlug(slug string) (*models.FormInternal, error) {
	form, err := a.store.GetFormWithSlug(slug)
	if err != nil {
		return nil, ErrFormNotFound
	}

	fields, err := a.store.GetAllFormFieldsForForm(form.ID)
	if err != nil {
		return nil, err
	}

	internal := models.FormInternal{}
	internal.Internalize(form, fields)
	internal.Status = a.computeFormStatus(form)

	return &internal, nil
}

func (a *appLayer) computeFormStatus(form *store.Form) string {
	now := time.Now()

	if form.OpensOn != nil && now.Before(*form.OpensOn) {
		return "notOpen"
	}

	if form.ClosesOn != nil && now.After(*form.ClosesOn) {
		return "closed"
	}

	if form.MaxSubmissions != nil {
		count, err := a.store.CountSubmissionsForForm(form.ID)
		if err == nil && count >= int64(*form.MaxSubmissions) {
			return "filled"
		}
	}

	return "open"
}

func (a *appLayer) GetAllForms() (*[]models.FormInternal, error) {
	forms, err := a.store.GetAllForms()
	if err != nil {
		return nil, err
	}

	result := make([]models.FormInternal, len(*forms))
	for i, form := range *forms {
		emptyFields := []store.FormField{}
		result[i].Internalize(&form, &emptyFields)
	}

	return &result, nil
}

func (a *appLayer) CreateSubmission(slug string, values map[string]string) (*models.SubmissionInternal, error) {
	form, err := a.store.GetFormWithSlug(slug)
	if err != nil {
		return nil, ErrFormNotFound
	}

	if err := a.checkFormAvailability(form); err != nil {
		return nil, err
	}

	fields, err := a.store.GetAllFormFieldsForForm(form.ID)
	if err != nil {
		return nil, err
	}

	fieldBySlug := map[string]*store.FormField{}
	fieldSlugByID := map[uint]string{}
	for i := range *fields {
		f := &(*fields)[i]
		fieldBySlug[f.Slug] = f
		fieldSlugByID[f.ID] = f.Slug
	}

	for _, field := range *fields {
		if err := validateFieldValue(field, values[field.Slug]); err != nil {
			return nil, err
		}
	}

	submission, err := a.store.CreateSubmission(form.ID)
	if err != nil {
		slog.Error("Unable to create submission", "layer", "app", "entity", "form", "formId", form.ID, "error", err)
		return nil, err
	}

	for slug, val := range values {
		field, ok := fieldBySlug[slug]
		if !ok {
			continue
		}
		if _, err := a.store.CreateSubmissionValue(submission.ID, field.ID, val); err != nil {
			slog.Error("Unable to create submission value", "layer", "app", "entity", "form", "submissionId", submission.ID, "error", err)
			return nil, err
		}
	}

	storedValues, err := a.store.GetAllSubmissionValueForSubmission(submission.ID)
	if err != nil {
		return nil, err
	}

	submissionInternal := models.SubmissionInternal{}
	submissionInternal.Internalize(submission, storedValues, fieldSlugByID)

	return &submissionInternal, nil
}

func (a *appLayer) GetSubmissionsForForm(user *models.UserInternal, formId uint) (*[]models.SubmissionInternal, error) {
	formInternal, err := a.loadFormInternal(formId)
	if err != nil {
		return nil, err
	}

	if !canViewSubmissions(user, formInternal) {
		return nil, ErrForbidden
	}

	fields, err := a.store.GetAllFormFieldsForForm(formId)
	if err != nil {
		return nil, err
	}

	fieldSlugByID := map[uint]string{}
	for _, f := range *fields {
		fieldSlugByID[f.ID] = f.Slug
	}

	submissions, err := a.store.GetSubmissionsForForm(formId)
	if err != nil {
		return nil, err
	}

	result := make([]models.SubmissionInternal, len(*submissions))
	for i, submission := range *submissions {
		values, err := a.store.GetAllSubmissionValueForSubmission(submission.ID)
		if err != nil {
			return nil, err
		}
		result[i].Internalize(&submission, values, fieldSlugByID)
	}

	return &result, nil
}

func (a *appLayer) DeleteSubmission(user *models.UserInternal, submissionId uint) error {
	if err := a.store.DeleteSubmissionValuesForSubmission(submissionId); err != nil {
		slog.Error("Unable to delete submission values", "layer", "app", "entity", "form", "submissionId", submissionId, "error", err)
		return err
	}

	if err := a.store.DeleteSubmission(submissionId); err != nil {
		slog.Error("Unable to delete submission", "layer", "app", "entity", "form", "submissionId", submissionId, "error", err)
		return err
	}

	return nil
}
