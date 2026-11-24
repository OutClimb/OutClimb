-- +goose Up
ALTER TABLE events ADD COLUMN slug varchar(255) NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uni_events_slug ON events (slug) WHERE deleted_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS uni_events_slug;
ALTER TABLE events DROP COLUMN IF EXISTS slug;
