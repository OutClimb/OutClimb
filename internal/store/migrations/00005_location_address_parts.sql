-- +goose Up
ALTER TABLE locations
    ADD COLUMN city text NOT NULL DEFAULT '',
    ADD COLUMN state text NOT NULL DEFAULT '',
    ADD COLUMN zip text NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE locations
    DROP COLUMN zip,
    DROP COLUMN state,
    DROP COLUMN city;
