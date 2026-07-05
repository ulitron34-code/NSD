-- Migración: tabla de mensajería real por expediente (reemplaza el chat
-- falso de IndexedDB que usaba src/services/messagingServiceV2.js, que
-- nunca llegaba al backend).
-- Fecha: 2026-07-05
-- Correr en: Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID        NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  sender_user_id  UUID        NOT NULL,
  sender_email    TEXT,
  body            TEXT        NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_order_id    ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread       ON messages(order_id) WHERE read_at IS NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- El dueño del expediente puede leer/escribir sus mensajes.
CREATE POLICY "messages_order_owner"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM service_orders
      WHERE service_orders.id = messages.order_id
        AND service_orders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_orders
      WHERE service_orders.id = messages.order_id
        AND service_orders.user_id = auth.uid()
    )
  );

-- Un otorgante con data_room_shares aceptado sobre esa orden tambien puede
-- leer/escribir mensajes de ese expediente.
CREATE POLICY "messages_authorized_funder"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM data_room_shares
      WHERE data_room_shares.order_id = messages.order_id
        AND data_room_shares.status IN ('accepted', 'shared')
        AND (
          data_room_shares.recipient_user_id = auth.uid()
          OR data_room_shares.recipient_email ILIKE (auth.jwt() ->> 'email')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM data_room_shares
      WHERE data_room_shares.order_id = messages.order_id
        AND data_room_shares.status IN ('accepted', 'shared')
        AND (
          data_room_shares.recipient_user_id = auth.uid()
          OR data_room_shares.recipient_email ILIKE (auth.jwt() ->> 'email')
        )
    )
  );

-- El backend (service_role) puede leer/escribir todo para el agregado de
-- actividad y para las validaciones que ya hace en Express. No necesita
-- policy explicita: service_role bypasea RLS automaticamente.
