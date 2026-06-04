-- database/seeders/001_seed_initial_data.sql

INSERT INTO users (public_id, name, username, password_hash, role, status)
VALUES
  ('ADM-001', 'Nadia Admin', 'admin', 'fb9d7fee00ff8d07cecb7c182c00fdd7:5976ee00b61fdb8f8cc3f61130039e45e23c8534510e6d0c3d4b4c1e774b10e8e76d5c754681073841f8e6b0c1e7beb581377cd737dd6712cad6d0b721aa065b', 'ADMIN', 'ACTIVE'),
  ('PNK-014', 'Greenhouse A3', 'produsen', 'fb9d7fee00ff8d07cecb7c182c00fdd7:5976ee00b61fdb8f8cc3f61130039e45e23c8534510e6d0c3d4b4c1e774b10e8e76d5c754681073841f8e6b0c1e7beb581377cd737dd6712cad6d0b721aa065b', 'PRODUSEN', 'ACTIVE'),
  ('DRV-021', 'Ikbal Kurir', 'kurir', 'fb9d7fee00ff8d07cecb7c182c00fdd7:5976ee00b61fdb8f8cc3f61130039e45e23c8534510e6d0c3d4b4c1e774b10e8e76d5c754681073841f8e6b0c1e7beb581377cd737dd6712cad6d0b721aa065b', 'KURIR', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO batches (public_id, producer_id, variety, generation, quantity, phase, health_status, seeded_at)
SELECT 'BATCH-B092', u.id, 'Cabai Rawit Merah', 'G2', 1200, 'PENYEMAIAN', 'SEHAT', '2026-05-10'
FROM users u
WHERE u.username = 'produsen'
ON CONFLICT (public_id) DO NOTHING;

INSERT INTO batches (public_id, producer_id, variety, generation, quantity, phase, health_status, seeded_at)
SELECT 'BATCH-B095', u.id, 'Tomat Hibrida F1', 'F1', 850, 'VEGETATIF_AWAL', 'SEHAT', '2026-05-18'
FROM users u
WHERE u.username = 'produsen'
ON CONFLICT (public_id) DO NOTHING;

INSERT INTO shipments (receipt_number, batch_id, producer_id, destination, package_quantity, status, notes)
SELECT 'ELC-20260528-0092', b.id, u.id, 'Dinas Pertanian Suka Makmur, Blok C', 250, 'READY_FOR_PICKUP', 'Paket awal siap diterima kurir.'
FROM batches b
JOIN users u ON u.username = 'produsen'
WHERE b.public_id = 'BATCH-B092'
ON CONFLICT (receipt_number) DO NOTHING;
