-- +goose Up
CREATE TABLE IF NOT EXISTS donations (
    id bigserial PRIMARY KEY,
    stripe_checkout_session_id varchar(255) NOT NULL,
    stripe_payment_intent_id varchar(255) NOT NULL DEFAULT '',
    amount_cents bigint NOT NULL,
    currency varchar(3) NOT NULL,
    donor_name text NOT NULL DEFAULT '',
    donor_email text NOT NULL DEFAULT '',
    status varchar(32) NOT NULL,
    completed_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    CONSTRAINT uni_donations_stripe_checkout_session_id UNIQUE (stripe_checkout_session_id)
);

INSERT INTO permissions (role_id, level, entity)
SELECT r.id, 2, 'donation'
FROM roles r
WHERE r.name = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM permissions p
    WHERE p.role_id = r.id AND p.entity = 'donation'
  );

-- +goose Down
DELETE FROM permissions WHERE entity = 'donation';
DROP TABLE IF EXISTS donations;
