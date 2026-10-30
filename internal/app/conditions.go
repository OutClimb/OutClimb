//
// Field Conditions Logic
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
	"slices"
	"strings"

	"github.com/OutClimb/OutClimb/internal/store"
)

type conditionRule struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

type fieldConditions struct {
	Match string          `json:"match"`
	Rules []conditionRule `json:"rules"`
}

// Free-text source types, compared trimmed and case-insensitively.
var freeTextFieldTypes = map[string]bool{
	"email":       true,
	"family-name": true,
	"given-name":  true,
	"phone":       true,
	"text-area":   true,
	"text-input":  true,
}

// Reads the conditions key out of a field's metadata. Fields without conditions return nil.
func parseConditions(metadata *string) (*fieldConditions, error) {
	if metadata == nil || len(*metadata) == 0 {
		return nil, nil
	}

	var parsed struct {
		Conditions *fieldConditions `json:"conditions"`
	}
	if err := json.Unmarshal([]byte(*metadata), &parsed); err != nil {
		return nil, err
	}

	return parsed.Conditions, nil
}

func evaluateRule(rule conditionRule, source *store.FormField, val string) bool {
	switch source.Type {
	case "checkboxes":
		var selected []string
		if val != "" {
			selected = strings.Split(val, ", ")
		}

		switch rule.Operator {
		case "includes":
			return slices.Contains(selected, rule.Value)
		case "excludes":
			return !slices.Contains(selected, rule.Value)
		}
	case "radios", "select":
		switch rule.Operator {
		case "equals":
			return val == rule.Value
		case "notEquals":
			return val != rule.Value
		}
	case "bool", "newsletter":
		if rule.Operator == "equals" {
			return isTruthy(val) == (rule.Value == "true")
		}
	default:
		if freeTextFieldTypes[source.Type] {
			matches := strings.EqualFold(strings.TrimSpace(val), strings.TrimSpace(rule.Value))

			switch rule.Operator {
			case "equals":
				return matches
			case "notEquals":
				return !matches
			}
		}
	}

	// Unknown source type or an operator the type doesn't allow never matches.
	return false
}

// Reports whether a field with these conditions is shown for the submitted values. No conditions,
// or no rules, means always shown.
func evaluateConditions(c *fieldConditions, fieldBySlug map[string]*store.FormField, values map[string]string) bool {
	if c == nil || len(c.Rules) == 0 {
		return true
	}

	for _, rule := range c.Rules {
		matched := false
		if source, ok := fieldBySlug[rule.Field]; ok {
			matched = evaluateRule(rule, source, values[rule.Field])
		}

		if c.Match == "any" && matched {
			return true
		}
		if c.Match != "any" && !matched {
			return false
		}
	}

	return c.Match != "any"
}
