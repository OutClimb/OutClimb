//
// Field Conditions Tests
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
	"errors"
	"testing"

	"github.com/OutClimb/OutClimb/internal/store"
)

func TestParseConditions(t *testing.T) {
	str := func(s string) *string { return &s }

	tests := []struct {
		name     string
		metadata *string
		wantNil  bool
		wantErr  bool
	}{
		{"nil metadata", nil, true, false},
		{"empty metadata", str(""), true, false},
		{"no conditions key", str(`{"options":["a"]}`), true, false},
		{"invalid json", str(`{`), true, true},
		{"with conditions", str(`{"conditions":{"match":"all","rules":[{"field":"a","operator":"equals","value":"x"}]}}`), false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseConditions(tt.metadata)
			if (err != nil) != tt.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, tt.wantErr)
			}
			if (got == nil) != tt.wantNil {
				t.Fatalf("got = %v, wantNil %v", got, tt.wantNil)
			}
			if got != nil && (got.Match != "all" || len(got.Rules) != 1 || got.Rules[0].Field != "a") {
				t.Fatalf("unexpected parse result: %+v", got)
			}
		})
	}
}

func TestEvaluateConditions(t *testing.T) {
	fields := map[string]*store.FormField{
		"radio":    {Slug: "radio", Type: "radios"},
		"select":   {Slug: "select", Type: "select"},
		"checks":   {Slug: "checks", Type: "checkboxes"},
		"flag":     {Slug: "flag", Type: "bool"},
		"news":     {Slug: "news", Type: "newsletter"},
		"text":     {Slug: "text", Type: "text-input"},
		"email":    {Slug: "email", Type: "email"},
		"headline": {Slug: "headline", Type: "subheader"},
	}

	rule := func(field, op, value string) conditionRule {
		return conditionRule{Field: field, Operator: op, Value: value}
	}
	one := func(r conditionRule) *fieldConditions {
		return &fieldConditions{Match: "all", Rules: []conditionRule{r}}
	}

	tests := []struct {
		name   string
		cond   *fieldConditions
		values map[string]string
		want   bool
	}{
		{"nil conditions", nil, nil, true},
		{"no rules", &fieldConditions{Match: "all"}, nil, true},

		{"radios equals match", one(rule("radio", "equals", "Yes")), map[string]string{"radio": "Yes"}, true},
		{"radios equals miss", one(rule("radio", "equals", "Yes")), map[string]string{"radio": "No"}, false},
		{"radios equals is case sensitive", one(rule("radio", "equals", "Yes")), map[string]string{"radio": "yes"}, false},
		{"radios notEquals match", one(rule("radio", "notEquals", "Yes")), map[string]string{"radio": "No"}, true},
		{"radios notEquals miss", one(rule("radio", "notEquals", "Yes")), map[string]string{"radio": "Yes"}, false},
		{"radios equals empty", one(rule("radio", "equals", "Yes")), map[string]string{}, false},
		{"radios notEquals empty", one(rule("radio", "notEquals", "Yes")), map[string]string{}, true},
		{"select equals match", one(rule("select", "equals", "A")), map[string]string{"select": "A"}, true},
		{"select includes not allowed", one(rule("select", "includes", "A")), map[string]string{"select": "A"}, false},

		{"checkboxes includes match", one(rule("checks", "includes", "B")), map[string]string{"checks": "A, B, C"}, true},
		{"checkboxes includes miss", one(rule("checks", "includes", "D")), map[string]string{"checks": "A, B, C"}, false},
		{"checkboxes includes is not substring", one(rule("checks", "includes", "A")), map[string]string{"checks": "AB, C"}, false},
		{"checkboxes excludes match", one(rule("checks", "excludes", "D")), map[string]string{"checks": "A, B"}, true},
		{"checkboxes excludes miss", one(rule("checks", "excludes", "A")), map[string]string{"checks": "A, B"}, false},
		{"checkboxes includes empty", one(rule("checks", "includes", "A")), map[string]string{"checks": ""}, false},
		{"checkboxes excludes empty", one(rule("checks", "excludes", "A")), map[string]string{}, true},

		{"bool checked equals true", one(rule("flag", "equals", "true")), map[string]string{"flag": "true"}, true},
		{"bool 1 equals true", one(rule("flag", "equals", "true")), map[string]string{"flag": "1"}, true},
		{"bool yes equals true", one(rule("flag", "equals", "true")), map[string]string{"flag": "Yes"}, true},
		{"bool false equals true", one(rule("flag", "equals", "true")), map[string]string{"flag": "false"}, false},
		{"bool false equals false", one(rule("flag", "equals", "false")), map[string]string{"flag": "false"}, true},
		{"bool 0 equals false", one(rule("flag", "equals", "false")), map[string]string{"flag": "0"}, true},
		{"bool true equals false", one(rule("flag", "equals", "false")), map[string]string{"flag": "true"}, false},
		{"bool empty equals false", one(rule("flag", "equals", "false")), map[string]string{}, true},
		{"bool empty equals true", one(rule("flag", "equals", "true")), map[string]string{}, false},
		{"bool notEquals not allowed", one(rule("flag", "notEquals", "true")), map[string]string{"flag": "false"}, false},
		{"newsletter checked", one(rule("news", "equals", "true")), map[string]string{"news": "true"}, true},

		{"text equals exact", one(rule("text", "equals", "hello")), map[string]string{"text": "hello"}, true},
		{"text equals ignores case", one(rule("text", "equals", "Hello")), map[string]string{"text": "hELLO"}, true},
		{"text equals trims value", one(rule("text", "equals", "hello")), map[string]string{"text": "  hello \n"}, true},
		{"text equals trims rule", one(rule("text", "equals", " hello ")), map[string]string{"text": "hello"}, true},
		{"text equals miss", one(rule("text", "equals", "hello")), map[string]string{"text": "hello there"}, false},
		{"text notEquals match", one(rule("text", "notEquals", "hello")), map[string]string{"text": "bye"}, true},
		{"text notEquals miss", one(rule("text", "notEquals", "hello")), map[string]string{"text": " HELLO "}, false},
		{"text equals empty", one(rule("text", "equals", "hello")), map[string]string{}, false},
		{"text notEquals empty", one(rule("text", "notEquals", "hello")), map[string]string{}, true},
		{"email equals ignores case", one(rule("email", "equals", "A@B.com")), map[string]string{"email": "a@b.com"}, true},
		{"text includes not allowed", one(rule("text", "includes", "hello")), map[string]string{"text": "hello"}, false},

		{"unknown source", one(rule("missing", "equals", "x")), map[string]string{"missing": "x"}, false},
		{"content source", one(rule("headline", "equals", "x")), map[string]string{"headline": "x"}, false},
		{"unknown operator", one(rule("radio", "contains", "Yes")), map[string]string{"radio": "Yes"}, false},

		{
			"all: both match",
			&fieldConditions{Match: "all", Rules: []conditionRule{rule("radio", "equals", "Yes"), rule("flag", "equals", "true")}},
			map[string]string{"radio": "Yes", "flag": "true"},
			true,
		},
		{
			"all: one misses",
			&fieldConditions{Match: "all", Rules: []conditionRule{rule("radio", "equals", "Yes"), rule("flag", "equals", "true")}},
			map[string]string{"radio": "Yes", "flag": "false"},
			false,
		},
		{
			"any: one matches",
			&fieldConditions{Match: "any", Rules: []conditionRule{rule("radio", "equals", "Yes"), rule("flag", "equals", "true")}},
			map[string]string{"radio": "No", "flag": "true"},
			true,
		},
		{
			"any: none match",
			&fieldConditions{Match: "any", Rules: []conditionRule{rule("radio", "equals", "Yes"), rule("flag", "equals", "true")}},
			map[string]string{"radio": "No", "flag": "false"},
			false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := evaluateConditions(tt.cond, fields, tt.values); got != tt.want {
				t.Fatalf("evaluateConditions() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidateFieldConditions(t *testing.T) {
	cond := func(match, field, op, value string) *string {
		s := `{"conditions":{"match":"` + match + `","rules":[{"field":"` + field + `","operator":"` + op + `","value":"` + value + `"}]}}`
		return &s
	}
	str := func(s string) *string { return &s }
	opts := str(`{"options":["Yes","No"]}`)

	sources := []FormFieldInput{
		{Slug: "radio", Type: "radios", Metadata: opts},
		{Slug: "check", Type: "checkboxes", Metadata: opts},
		{Slug: "bool", Type: "bool"},
		{Slug: "text", Type: "text-input"},
		{Slug: "head", Type: "subheader"},
	}

	tests := []struct {
		name    string
		target  FormFieldInput
		extra   []FormFieldInput
		wantErr bool
	}{
		{"no conditions", FormFieldInput{Slug: "t", Type: "text-input"}, nil, false},
		{"valid radios", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "radio", "equals", "Yes")}, nil, false},
		{"valid checkboxes", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("any", "check", "excludes", "No")}, nil, false},
		{"valid bool", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "bool", "equals", "false")}, nil, false},
		{"valid text", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "text", "notEquals", "anything")}, nil, false},
		{"valid on subheader", FormFieldInput{Slug: "t", Type: "subheader", Metadata: cond("all", "bool", "equals", "true")}, nil, false},
		{"bad match", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("some", "radio", "equals", "Yes")}, nil, true},
		{"no rules", FormFieldInput{Slug: "t", Type: "text-input", Metadata: str(`{"conditions":{"match":"all","rules":[]}}`)}, nil, true},
		{"unknown source", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "missing", "equals", "Yes")}, nil, true},
		{"self source", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "t", "equals", "x")}, nil, true},
		{"content source", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "head", "equals", "x")}, nil, true},
		{"chain", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "gated", "equals", "x")}, []FormFieldInput{{Slug: "gated", Type: "text-input", Metadata: cond("all", "bool", "equals", "true")}}, true},
		{"operator not allowed for type", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "radio", "includes", "Yes")}, nil, true},
		{"bool with notEquals", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "bool", "notEquals", "true")}, nil, true},
		{"option not in source", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "radio", "equals", "Maybe")}, nil, true},
		{"bad bool value", FormFieldInput{Slug: "t", Type: "text-input", Metadata: cond("all", "bool", "equals", "yes")}, nil, true},
		{"invalid json", FormFieldInput{Slug: "t", Type: "text-input", Metadata: str(`{`)}, nil, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fields := append(append([]FormFieldInput{}, sources...), tt.extra...)
			fields = append(fields, tt.target)

			err := validateFieldConditions(fields)
			if (err != nil) != tt.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, tt.wantErr)
			}
			if err != nil && !errors.Is(err, ErrInvalidFieldConditions) {
				t.Fatalf("err = %v, want ErrInvalidFieldConditions", err)
			}
		})
	}
}

func TestNormalizeFieldInput(t *testing.T) {
	str := func(s string) *string { return &s }
	conds := `"conditions":{"match":"all","rules":[{"field":"a","operator":"equals","value":"x"}]}`

	tests := []struct {
		name         string
		in           FormFieldInput
		wantMetadata *string
	}{
		{"input field unchanged", FormFieldInput{Type: "text-input", Required: true, Metadata: str(`{` + conds + `}`)}, str(`{` + conds + `}`)},
		{"divider without conditions", FormFieldInput{Type: "divider", Metadata: str(`{"text":"x"}`)}, nil},
		{"subheader keeps only conditions", FormFieldInput{Type: "subheader", Metadata: str(`{"text":"x",` + conds + `}`)}, str(`{` + conds + `}`)},
		{"divider keeps conditions", FormFieldInput{Type: "divider", Metadata: str(`{` + conds + `}`)}, str(`{` + conds + `}`)},
		{"paragraph unchanged", FormFieldInput{Type: "paragraph", Metadata: str(`{"text":"x",` + conds + `}`)}, str(`{"text":"x",` + conds + `}`)},
		{"nil metadata", FormFieldInput{Type: "subheader"}, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeFieldInput(tt.in)
			if (got.Metadata == nil) != (tt.wantMetadata == nil) || (got.Metadata != nil && *got.Metadata != *tt.wantMetadata) {
				t.Fatalf("metadata = %v, want %v", got.Metadata, tt.wantMetadata)
			}
			if isContentField(tt.in.Type) && (got.Required || got.Validation != nil) {
				t.Fatalf("content field should not be required or validated: %+v", got)
			}
		})
	}
}
