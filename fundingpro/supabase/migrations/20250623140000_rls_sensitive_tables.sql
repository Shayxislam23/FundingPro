-- Row Level Security for user-owned / org-scoped tables (defense in depth when using authenticated client)

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Organizations: members can read their orgs
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
CREATE POLICY "organizations_select_member"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "organizations_update_member" ON organizations;
CREATE POLICY "organizations_update_member"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
  )
);

-- Organization members: users see only their memberships
DROP POLICY IF EXISTS "org_members_select_own" ON organization_members;
CREATE POLICY "org_members_select_own"
ON organization_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "org_members_insert_own" ON organization_members;
CREATE POLICY "org_members_insert_own"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Applications
DROP POLICY IF EXISTS "applications_select_own" ON applications;
CREATE POLICY "applications_select_own"
ON applications FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "applications_insert_own" ON applications;
CREATE POLICY "applications_insert_own"
ON applications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "applications_update_own" ON applications;
CREATE POLICY "applications_update_own"
ON applications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "applications_delete_own" ON applications;
CREATE POLICY "applications_delete_own"
ON applications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Documents
DROP POLICY IF EXISTS "documents_select_own" ON documents;
CREATE POLICY "documents_select_own"
ON documents FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_insert_own" ON documents;
CREATE POLICY "documents_insert_own"
ON documents FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_update_own" ON documents;
CREATE POLICY "documents_update_own"
ON documents FOR UPDATE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_delete_own" ON documents;
CREATE POLICY "documents_delete_own"
ON documents FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Payments
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own"
ON payments FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own"
ON payments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Subscriptions
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own"
ON subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());
