-- Platform-level admin role (complements ADMIN_EMAILS allowlist)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS platform_role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_platform_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_platform_role_check
  CHECK (platform_role IN ('user', 'admin'));

CREATE INDEX IF NOT EXISTS idx_users_platform_role_admin
  ON users(platform_role)
  WHERE platform_role = 'admin';
