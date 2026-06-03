-- +goose Up
CREATE TABLE IF NOT EXISTS assets (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    file_name varchar(255) NOT NULL,
    key varchar(64) NOT NULL,
    CONSTRAINT uni_assets_file_name UNIQUE (file_name),
    CONSTRAINT uni_assets_key UNIQUE (key)
);
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets (deleted_at);

CREATE TABLE IF NOT EXISTS emails (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    name text NOT NULL,
    slug varchar(255) NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    text_body text NOT NULL,
    CONSTRAINT uni_emails_slug UNIQUE (slug)
);
CREATE INDEX IF NOT EXISTS idx_emails_deleted_at ON emails (deleted_at);

CREATE TABLE IF NOT EXISTS locations (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    name text,
    main_image_name text,
    individual_image_name text,
    background_image_path text,
    color text,
    address text,
    start_time text,
    end_time text,
    description text
);
CREATE INDEX IF NOT EXISTS idx_locations_deleted_at ON locations (deleted_at);

CREATE TABLE IF NOT EXISTS permissions (
    id bigserial PRIMARY KEY,
    role_id bigint NOT NULL,
    level bigint NOT NULL,
    entity text NOT NULL
);

CREATE TABLE IF NOT EXISTS redirects (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    from_path text NOT NULL,
    to_url text NOT NULL,
    starts_on timestamptz,
    stops_on timestamptz
);
CREATE INDEX IF NOT EXISTS idx_redirects_deleted_at ON redirects (deleted_at);

CREATE TABLE IF NOT EXISTS roles (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    name varchar(255) NOT NULL,
    "order" bigint NOT NULL DEFAULT 0,
    CONSTRAINT uni_roles_name UNIQUE (name)
);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_at ON roles (deleted_at);

CREATE TABLE IF NOT EXISTS users (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    disabled boolean NOT NULL DEFAULT FALSE,
    email varchar(254) NOT NULL,
    name text NOT NULL,
    password varchar(64) NOT NULL,
    require_password_reset boolean NOT NULL DEFAULT FALSE,
    username varchar(255) NOT NULL,
    role_id bigint NOT NULL DEFAULT 0,
    CONSTRAINT uni_users_username UNIQUE (username)
);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS forms (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    name text NOT NULL,
    slug varchar(255) NOT NULL,
    opens_on timestamptz,
    closes_on timestamptz,
    max_submissions bigint,
    not_open_message text,
    closed_message text,
    filled_message text,
    success_message text,
    confirmation_email_field_slug text,
    confirmation_email_slug text,
    notification_email_to text,
    notification_email_slug text,
    CONSTRAINT uni_forms_slug UNIQUE (slug)
);
CREATE INDEX IF NOT EXISTS idx_forms_deleted_at ON forms (deleted_at);

CREATE TABLE IF NOT EXISTS form_viewable_users (
    form_id bigint NOT NULL,
    user_id bigint NOT NULL,
    PRIMARY KEY (form_id, user_id)
);

CREATE TABLE IF NOT EXISTS form_fields (
    id bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    created_by text NOT NULL,
    updated_by text,
    deleted_by text,
    form_id bigint,
    name text NOT NULL,
    slug varchar(255) NOT NULL,
    type varchar(32) NOT NULL,
    metadata text,
    validation text,
    required boolean,
    "order" bigint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_form_fields_deleted_at ON form_fields (deleted_at);

CREATE TABLE IF NOT EXISTS submissions (
    id bigserial PRIMARY KEY,
    form_id bigint,
    submitted_on timestamptz
);

CREATE TABLE IF NOT EXISTS submission_values (
    id bigserial PRIMARY KEY,
    submission_id bigint,
    form_field_id bigint,
    value text
);

-- +goose Down
DROP TABLE IF EXISTS submission_values;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS form_fields;
DROP TABLE IF EXISTS form_viewable_users;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS redirects;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS assets;
