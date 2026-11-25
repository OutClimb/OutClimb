-- +goose Up
CREATE TABLE IF NOT EXISTS tags (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    name text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uni_tags_name_lower ON tags (lower(name));

CREATE TABLE IF NOT EXISTS event_tags (
    event_id bigint NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    tag_id bigint NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag_id ON event_tags (tag_id);

-- +goose Down
DROP TABLE IF EXISTS event_tags;
DROP TABLE IF EXISTS tags;
