-- +goose Up
CREATE TABLE IF NOT EXISTS events (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    title text NOT NULL,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    location_id bigint REFERENCES locations (id),
    location_name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    featured_image_asset_id bigint NOT NULL REFERENCES assets (id),
    featured_image_alt_text text NOT NULL,
    excerpt text NOT NULL,
    body text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events (deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at);

INSERT INTO permissions (role_id, level, entity)
SELECT r.id, 2, 'event'
FROM roles r
WHERE r.name = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM permissions p
    WHERE p.role_id = r.id AND p.entity = 'event'
  );

-- +goose Down
DELETE FROM permissions WHERE entity = 'event';
DROP TABLE IF EXISTS events;
