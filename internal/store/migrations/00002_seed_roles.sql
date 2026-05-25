-- +goose Up
INSERT INTO roles (created_at, updated_at, created_by, updated_by, name, "order")
SELECT NOW(), NOW(), 'system', 'system', 'Owner', 0
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Owner');

INSERT INTO roles (created_at, updated_at, created_by, updated_by, name, "order")
SELECT NOW(), NOW(), 'system', 'system', 'Admin', 1
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin');

INSERT INTO permissions (role_id, level, entity)
SELECT r.id, 2, e.entity
FROM roles r
CROSS JOIN (VALUES
    ('asset'), ('email'), ('form'), ('redirect'),
    ('location'), ('social'), ('user'), ('role')
) AS e(entity)
WHERE r.name = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM permissions p
    WHERE p.role_id = r.id AND p.entity = e.entity
  );

-- +goose Down
DELETE FROM permissions WHERE role_id IN (SELECT id FROM roles WHERE name = 'Admin');
DELETE FROM roles WHERE name IN ('Owner', 'Admin');
