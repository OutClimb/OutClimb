//
// Captcha Logic
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
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"math/rand/v2"
	"sync"
	"time"

	altcha "github.com/altcha-org/altcha-lib-go/v2"
)

const (
	captchaAlgorithm  = "PBKDF2/SHA-256"
	captchaCost       = 5000
	captchaKeyLength  = 32
	captchaMinCounter = 5000
	captchaMaxCounter = 10000
	captchaTTL        = 10 * time.Minute
)

var ErrInvalidCaptcha = errors.New("invalid captcha")

// usedCaptchas remembers solved challenges until they expire so a single
// solution can't be replayed for multiple submissions.
type usedCaptchas struct {
	mu      sync.Mutex
	entries map[string]time.Time
}

func newUsedCaptchas() *usedCaptchas {
	return &usedCaptchas{entries: map[string]time.Time{}}
}

// markUsed records the signature and reports false if it had already been used.
func (u *usedCaptchas) markUsed(signature string, expiresAt time.Time) bool {
	u.mu.Lock()
	defer u.mu.Unlock()

	now := time.Now()
	for sig, exp := range u.entries {
		if now.After(exp) {
			delete(u.entries, sig)
		}
	}

	if _, ok := u.entries[signature]; ok {
		return false
	}

	u.entries[signature] = expiresAt
	return true
}

func (a *appLayer) CreateCaptchaChallenge() (*altcha.Challenge, error) {
	counter := captchaMinCounter + rand.IntN(captchaMaxCounter-captchaMinCounter)
	expiresAt := time.Now().Add(captchaTTL)

	challenge, err := altcha.CreateChallenge(altcha.CreateChallengeOptions{
		Algorithm:           captchaAlgorithm,
		Cost:                captchaCost,
		Counter:             &counter,
		DeriveKey:           altcha.DeriveKeyPBKDF2(),
		ExpiresAt:           &expiresAt,
		HMACSignatureSecret: a.config.AltchaHmacKey,
		KeyLength:           captchaKeyLength,
	})
	if err != nil {
		slog.Error("Unable to create captcha challenge",
			"layer", "app",
			"entity", "captcha",
			"error", err,
		)
		return nil, err
	}

	return &challenge, nil
}

// VerifyCaptcha checks a base64 encoded ALTCHA payload and consumes it.
func (a *appLayer) VerifyCaptcha(encodedPayload string) error {
	decoded, err := base64.StdEncoding.DecodeString(encodedPayload)
	if err != nil {
		return ErrInvalidCaptcha
	}

	var payload altcha.Payload
	if err := json.Unmarshal(decoded, &payload); err != nil {
		return ErrInvalidCaptcha
	}

	result, err := altcha.VerifySolution(altcha.VerifySolutionOptions{
		Challenge:           payload.Challenge,
		Solution:            payload.Solution,
		DeriveKey:           altcha.DeriveKeyPBKDF2(),
		HMACSignatureSecret: a.config.AltchaHmacKey,
	})
	if err != nil || result.Expired || !result.Verified {
		return ErrInvalidCaptcha
	}

	expiresAt := time.Unix(payload.Challenge.Parameters.ExpiresAt, 0)
	if !a.usedCaptchas.markUsed(payload.Challenge.Signature, expiresAt) {
		return ErrInvalidCaptcha
	}

	return nil
}
