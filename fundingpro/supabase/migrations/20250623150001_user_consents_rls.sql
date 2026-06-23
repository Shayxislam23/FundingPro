-- RLS for user_consents (Supabase only)

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_consents_select_own" ON user_consents;
CREATE POLICY "user_consents_select_own"
ON user_consents FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_consents_insert_own" ON user_consents;
CREATE POLICY "user_consents_insert_own"
ON user_consents FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
