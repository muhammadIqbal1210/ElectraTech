-- database/migrations/001_init_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'PRODUSEN', 'KURIR');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'REVIEW', 'DISABLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE,
  producer_id UUID NOT NULL REFERENCES users(id),
  variety TEXT NOT NULL,
  generation TEXT NOT NULL DEFAULT 'G1',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  phase TEXT NOT NULL DEFAULT 'PENYEMAIAN',
  health_status TEXT NOT NULL DEFAULT 'SEHAT',
  seeded_at DATE NOT NULL DEFAULT current_date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batch_logs (
  id BIGSERIAL PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  from_phase TEXT,
  to_phase TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES users(id),
  courier_id UUID REFERENCES users(id),
  destination TEXT NOT NULL,
  package_quantity INTEGER NOT NULL CHECK (package_quantity > 0),
  status TEXT NOT NULL DEFAULT 'READY_FOR_PICKUP',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iot_logs (
  id BIGSERIAL PRIMARY KEY,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  temperature_c NUMERIC(5, 2) NOT NULL,
  humidity_percent NUMERIC(5, 2) NOT NULL,
  light_lux NUMERIC(10, 2) NOT NULL,
  pump_on BOOLEAN NOT NULL DEFAULT false,
  fan_on BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS package_tracking (
  id BIGSERIAL PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  cargo_condition TEXT NOT NULL,
  container_temperature_c NUMERIC(5, 2),
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_public_id ON batches(public_id);
CREATE INDEX IF NOT EXISTS idx_shipments_receipt_number ON shipments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_courier_id ON shipments(courier_id);
CREATE INDEX IF NOT EXISTS idx_iot_logs_recorded_at ON iot_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_package_tracking_receipt ON package_tracking(receipt_number);
CREATE INDEX IF NOT EXISTS idx_package_tracking_recorded_at ON package_tracking(recorded_at DESC);

CREATE OR REPLACE FUNCTION set_public_ids()
RETURNS trigger AS $$
BEGIN
  IF tg_table_name = 'users' AND new.public_id IS NULL THEN
    new.public_id := CASE new.role
      WHEN 'ADMIN' THEN 'ADM-'
      WHEN 'PRODUSEN' THEN 'PNK-'
      WHEN 'KURIR' THEN 'DRV-'
    END || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  END IF;

  IF tg_table_name = 'batches' AND new.public_id IS NULL THEN
    new.public_id := 'BATCH-' || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_shipment_receipt_number()
RETURNS trigger AS $$
BEGIN
  IF new.receipt_number IS NULL THEN
    new.receipt_number := 'ELC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 5));
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_public_id ON users;
CREATE TRIGGER trg_users_public_id
BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION set_public_ids();

DROP TRIGGER IF EXISTS trg_batches_public_id ON batches;
CREATE TRIGGER trg_batches_public_id
BEFORE INSERT ON batches
FOR EACH ROW EXECUTE FUNCTION set_public_ids();

DROP TRIGGER IF EXISTS trg_shipments_receipt_number ON shipments;
CREATE TRIGGER trg_shipments_receipt_number
BEFORE INSERT ON shipments
FOR EACH ROW EXECUTE FUNCTION set_shipment_receipt_number();
