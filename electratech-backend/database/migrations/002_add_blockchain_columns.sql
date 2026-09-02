ALTER TABLE IF EXISTS batches
  ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;

ALTER TABLE IF EXISTS batch_logs
  ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;

ALTER TABLE IF EXISTS shipments
  ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;

ALTER TABLE IF EXISTS package_tracking
  ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_batches_blockchain_tx_hash ON batches(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_batch_logs_blockchain_tx_hash ON batch_logs(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_shipments_blockchain_tx_hash ON shipments(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_package_tracking_blockchain_tx_hash ON package_tracking(blockchain_tx_hash);
