//
// TOTP Logic
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
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"image/png"
	"log/slog"
	"strconv"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

const (
	totpIssuer = "OutClimb"
	totpPeriod = 30
	totpSkew   = 1
)

var (
	ErrTotpRequired = errors.New("totp code required")
	ErrTotpInvalid  = errors.New("invalid totp code")
)

var totpValidateOpts = totp.ValidateOpts{
	Period:    totpPeriod,
	Digits:    otp.DigitsSix,
	Algorithm: otp.AlgorithmSHA1,
}

func newTotpCipher(encodedKey string) (cipher.AEAD, error) {
	key, err := base64.StdEncoding.DecodeString(encodedKey)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	return cipher.NewGCM(block)
}

// totpAdditionalData binds an encrypted secret to its user so it can't be
// copied onto another user's row.
func totpAdditionalData(userId uint) []byte {
	return []byte("totp:" + strconv.FormatUint(uint64(userId), 10))
}

func (a *appLayer) encryptTotpSecret(userId uint, secret string) (string, error) {
	nonce := make([]byte, a.totpCipher.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}

	sealed := a.totpCipher.Seal(nonce, nonce, []byte(secret), totpAdditionalData(userId))
	return base64.StdEncoding.EncodeToString(sealed), nil
}

func (a *appLayer) decryptTotpSecret(userId uint, encrypted string) (string, error) {
	sealed, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return "", err
	}

	nonceSize := a.totpCipher.NonceSize()
	if len(sealed) < nonceSize {
		return "", errors.New("encrypted totp secret too short")
	}

	secret, err := a.totpCipher.Open(nil, sealed[:nonceSize], sealed[nonceSize:], totpAdditionalData(userId))
	if err != nil {
		return "", err
	}

	return string(secret), nil
}

// matchTotpStep returns the time step the code is valid for, checking the
// current step and the steps on either side of it to allow for clock drift.
func matchTotpStep(secret, code string) (int64, bool) {
	if len(code) != int(otp.DigitsSix) {
		return 0, false
	}

	now := time.Now()
	for offset := -totpSkew; offset <= totpSkew; offset++ {
		t := now.Add(time.Duration(offset*totpPeriod) * time.Second)
		expected, err := totp.GenerateCodeCustom(secret, t, totpValidateOpts)
		if err != nil {
			return 0, false
		}

		if subtle.ConstantTimeCompare([]byte(expected), []byte(code)) == 1 {
			return t.Unix() / totpPeriod, true
		}
	}

	return 0, false
}

func (a *appLayer) verifyTotp(user *models.UserInternal, code string) error {
	if len(code) == 0 {
		return ErrTotpRequired
	}

	secret, err := a.decryptTotpSecret(user.ID, user.EncryptedTotpSecret)
	if err != nil {
		slog.Error(
			"Unable to decrypt totp secret",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return errors.New("internal server error")
	}

	step, ok := matchTotpStep(secret, code)
	if !ok {
		return ErrTotpInvalid
	}

	// Only accept a step newer than the last one used so codes can't be replayed
	if updated, err := a.store.UpdateTotpLastStep(user.ID, step); err != nil {
		slog.Error(
			"Unable to update totp last step",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return errors.New("internal server error")
	} else if !updated {
		return ErrTotpInvalid
	}

	return nil
}

func (a *appLayer) BeginTotpSetup(user *models.UserInternal) (*models.TotpSetupInternal, error) {
	if user.TotpEnabled {
		return &models.TotpSetupInternal{}, errors.New("totp already enabled")
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      totpIssuer,
		AccountName: user.Username,
		Period:      totpPeriod,
		Digits:      otp.DigitsSix,
		Algorithm:   otp.AlgorithmSHA1,
	})
	if err != nil {
		slog.Error(
			"Unable to generate totp key",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return &models.TotpSetupInternal{}, errors.New("internal server error")
	}

	image, err := key.Image(256, 256)
	if err != nil {
		slog.Error(
			"Unable to generate totp qr code",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return &models.TotpSetupInternal{}, errors.New("internal server error")
	}

	var buffer bytes.Buffer
	if err := png.Encode(&buffer, image); err != nil {
		slog.Error(
			"Unable to encode totp qr code",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return &models.TotpSetupInternal{}, errors.New("internal server error")
	}

	encryptedSecret, err := a.encryptTotpSecret(user.ID, key.Secret())
	if err != nil {
		slog.Error(
			"Unable to encrypt totp secret",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return &models.TotpSetupInternal{}, errors.New("internal server error")
	}

	if err := a.store.SetTotpSecret(user.ID, encryptedSecret, user.Username); err != nil {
		slog.Error(
			"Unable to store totp secret",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return &models.TotpSetupInternal{}, errors.New("internal server error")
	}

	return &models.TotpSetupInternal{
		QRCode: "data:image/png;base64," + base64.StdEncoding.EncodeToString(buffer.Bytes()),
		Secret: key.Secret(),
		URL:    key.URL(),
	}, nil
}

func (a *appLayer) ConfirmTotpSetup(user *models.UserInternal, code string) error {
	if user.TotpEnabled {
		return errors.New("totp already enabled")
	} else if len(user.EncryptedTotpSecret) == 0 {
		return errors.New("totp setup not started")
	}

	secret, err := a.decryptTotpSecret(user.ID, user.EncryptedTotpSecret)
	if err != nil {
		slog.Error(
			"Unable to decrypt totp secret",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return errors.New("internal server error")
	}

	step, ok := matchTotpStep(secret, code)
	if !ok {
		return ErrTotpInvalid
	}

	if err := a.store.EnableTotp(user.ID, step, user.Username); err != nil {
		slog.Error(
			"Unable to enable totp",
			"layer", "app",
			"entity", "totp",
			"username", user.Username,
			"error", err,
		)
		return errors.New("internal server error")
	}

	return nil
}
