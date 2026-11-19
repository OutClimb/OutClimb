//
// TLS Config Tests
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

package http

import (
	"crypto/tls"
	"os"
	"path/filepath"
	"testing"
)

func TestBuildTlsConfigRequiresTls13(t *testing.T) {
	config, err := buildTlsConfig("")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if config.MinVersion != tls.VersionTLS13 {
		t.Fatalf("min version = %d, want TLS 1.3", config.MinVersion)
	}
	if config.ClientAuth != tls.NoClientCert {
		t.Fatalf("client auth = %v, want no client cert without a CA file", config.ClientAuth)
	}
}

func TestBuildTlsConfigRejectsMissingClientCaFile(t *testing.T) {
	if _, err := buildTlsConfig(filepath.Join(t.TempDir(), "missing.pem")); err == nil {
		t.Fatal("expected error for missing client ca file")
	}
}

func TestBuildTlsConfigRejectsClientCaFileWithoutCertificates(t *testing.T) {
	clientCaFile := filepath.Join(t.TempDir(), "ca.pem")
	if err := os.WriteFile(clientCaFile, []byte("not a certificate"), 0o600); err != nil {
		t.Fatalf("writing client ca file: %v", err)
	}

	if _, err := buildTlsConfig(clientCaFile); err == nil {
		t.Fatal("expected error for client ca file without certificates")
	}
}
