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

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_consents_select_own" ON user_consents;
CREATE POLICY "user_consents_select_own"
ON user_consents FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_consents_insert_own" ON user_consents;
CREATE POLICY "user_consents_insert_own"
ON user_consents FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
