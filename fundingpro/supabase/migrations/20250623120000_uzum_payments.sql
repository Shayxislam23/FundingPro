-- Uzum Bank payment integration tables

ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_uzs NUMERIC(14, 0);

UPDATE plans SET price_uzs = ROUND(price_usd * 12800) WHERE price_uzs IS NULL;

INSERT INTO settings (key, value, category) VALUES
  ('usd_uzs_rate', '12800', 'billing')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS uzum_transactions (
  trans_id TEXT PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'PENDING',
  amount_tiyin BIGINT NOT NULL,
  create_time BIGINT,
  confirm_time BIGINT,
  reverse_time BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uzum_transactions_payment ON uzum_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_uzum_transactions_state ON uzum_transactions(state);
