-- Draft SQL for NU-GRA-EVID-002. Do not apply to production before schema review.
-- Purpose: allow grantor-authorized read access to nuxera_evidence_links rows
-- whose order has an accepted/shared data_room_shares record for the requester,
-- reusing the existing legacy data-room authorization mechanism instead of a new one.

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
