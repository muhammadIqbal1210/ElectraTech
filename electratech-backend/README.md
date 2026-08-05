# Electra Tech Backend

Backend Express + PostgreSQL untuk modul autentikasi, batch penakar benih, log IoT, dan tracking kurir.

## Setup

1. Buat database PostgreSQL, misalnya `electratech`.
2. Salin `.env.example` menjadi `.env`, lalu sesuaikan `DATABASE_URL`.
3. Jalankan skema:

```bash
npm run db:setup
```

4. Jalankan API:

```bash
npm run dev
```

API berjalan di `http://localhost:4000`.

## Akun Seed

Semua akun seed memakai password `password123`.

- `admin` role `ADMIN`
- `produsen` role `PRODUSEN`
- `kurir` role `KURIR`

## Endpoint Awal

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/batches`
- `POST /api/batches`
- `GET /api/batches/:batchId/logs`
- `POST /api/batches/:batchId/logs`
- `GET /api/iot/logs`
- `POST /api/iot/logs`
- `GET /api/tracking`
- `POST /api/tracking/checkins`
