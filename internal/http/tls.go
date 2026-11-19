//
// TLS Config
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
	"crypto/x509"
	"errors"
	"fmt"
	"os"
)

func buildTlsConfig(certFiles []string, keyFiles []string, clientCaFile string) (*tls.Config, error) {
	if len(certFiles) != len(keyFiles) {
		return nil, errors.New("cert files and key files must have the same number of entries")
	}

	config := &tls.Config{MinVersion: tls.VersionTLS13}

	for i := range certFiles {
		certificate, err := tls.LoadX509KeyPair(certFiles[i], keyFiles[i])
		if err != nil {
			return nil, fmt.Errorf("load key pair %s: %w", certFiles[i], err)
		}
		config.Certificates = append(config.Certificates, certificate)
	}

	if len(clientCaFile) == 0 {
		return config, nil
	}

	clientCaPem, err := os.ReadFile(clientCaFile)
	if err != nil {
		return nil, fmt.Errorf("read client ca file: %w", err)
	}

	clientCaPool := x509.NewCertPool()
	if !clientCaPool.AppendCertsFromPEM(clientCaPem) {
		return nil, errors.New("client ca file contains no valid certificates")
	}

	config.ClientCAs = clientCaPool
	config.ClientAuth = tls.RequireAndVerifyClientCert

	return config, nil
}
