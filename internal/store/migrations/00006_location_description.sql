-- +goose Up
ALTER TABLE locations
    ADD COLUMN excerpt text NOT NULL DEFAULT '',
    ADD COLUMN long_description text NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE locations
    DROP COLUMN excerpt,
    DROP COLUMN long_description;
