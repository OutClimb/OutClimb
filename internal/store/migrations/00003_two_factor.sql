-- +goose Up
ALTER TABLE roles ADD COLUMN IF NOT EXISTS require_two_factor boolean NOT NULL DEFAULT FALSE;
UPDATE roles SET require_two_factor = TRUE WHERE name = 'Owner' AND name = 'Admin';

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_last_step bigint NOT NULL DEFAULT 0;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS totp_last_step;
ALTER TABLE users DROP COLUMN IF EXISTS totp_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS totp_secret;

ALTER TABLE roles DROP COLUMN IF EXISTS require_two_factor;
