CREATE TABLE payment_intent (
  request_key TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL UNIQUE,
  owner_token TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT payment_intent_amount CHECK (amount > 0 AND amount <= 9007199254740991 AND amount = floor(amount))
);
