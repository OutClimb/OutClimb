-- +goose Up
CREATE TABLE IF NOT EXISTS event_links (
    id bigserial PRIMARY KEY,
    event_id bigint NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    position integer NOT NULL,
    label text NOT NULL,
    url text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_event_links_event_id ON event_links (event_id);

-- +goose Down
DROP TABLE IF EXISTS event_links;
