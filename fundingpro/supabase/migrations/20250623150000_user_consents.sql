-- User legal consents (ЗРУ-547 verifiable consent audit trail)

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locale TEXT NOT NULL DEFAULT 'ru',
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consents_unique
  ON user_consents(user_id, consent_type, document_version);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
