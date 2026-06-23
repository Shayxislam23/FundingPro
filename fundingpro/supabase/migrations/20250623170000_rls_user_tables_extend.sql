-- RLS for saved_grants, proposals, support_tickets (user-owned)

ALTER TABLE saved_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- saved_grants
DROP POLICY IF EXISTS "saved_grants_select_own" ON saved_grants;
CREATE POLICY "saved_grants_select_own"
ON saved_grants FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_grants_insert_own" ON saved_grants;
CREATE POLICY "saved_grants_insert_own"
ON saved_grants FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_grants_delete_own" ON saved_grants;
CREATE POLICY "saved_grants_delete_own"
ON saved_grants FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- proposals
DROP POLICY IF EXISTS "proposals_select_own" ON proposals;
CREATE POLICY "proposals_select_own"
ON proposals FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "proposals_insert_own" ON proposals;
CREATE POLICY "proposals_insert_own"
ON proposals FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "proposals_update_own" ON proposals;
CREATE POLICY "proposals_update_own"
ON proposals FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "proposals_delete_own" ON proposals;
CREATE POLICY "proposals_delete_own"
ON proposals FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- support_tickets
DROP POLICY IF EXISTS "support_tickets_select_own" ON support_tickets;
CREATE POLICY "support_tickets_select_own"
ON support_tickets FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "support_tickets_insert_own" ON support_tickets;
CREATE POLICY "support_tickets_insert_own"
ON support_tickets FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "support_tickets_update_own" ON support_tickets;
CREATE POLICY "support_tickets_update_own"
ON support_tickets FOR UPDATE TO authenticated
USING (user_id = auth.uid());
