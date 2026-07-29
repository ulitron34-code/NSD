-- Applied to production on 2026-07-18 under explicit authorization for NU-GRA-EVID-002.
-- Retained as an idempotent schema record; rerunning it does not replace the policy.
-- Purpose: allow grantor-authorized read access to nuxera_evidence_links rows
-- whose order has an accepted/shared data_room_shares record for the requester,
-- reusing the existing legacy data-room authorization mechanism instead of a new one.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'nuxera_evidence_links'
      AND policyname = 'authorized_grantor_select_nuxera_evidence_links'
  ) THEN
    CREATE POLICY "authorized_grantor_select_nuxera_evidence_links"
      ON nuxera_evidence_links FOR SELECT
      USING (
        visibility = 'authorized_grantor'
        AND EXISTS (
          SELECT 1 FROM data_room_shares drs
          WHERE drs.order_id = nuxera_evidence_links.order_id
            AND drs.recipient_user_id = auth.uid()
            AND drs.status IN ('accepted', 'shared')
        )
      );
  END IF;
END
$$;
