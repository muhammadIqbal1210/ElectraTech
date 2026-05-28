create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('ADMIN', 'PRODUSEN', 'KURIR');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type user_status as enum ('ACTIVE', 'REVIEW', 'DISABLED');
  end if;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  public_id text unique,
  name text not null,
  username text not null unique,
  password_hash text not null,
  role user_role not null,
  status user_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  public_id text unique,
  producer_id uuid not null references users(id),
  variety text not null,
  generation text not null default 'G1',
  quantity integer not null check (quantity > 0),
  phase text not null default 'PENYEMAIAN',
  health_status text not null default 'SEHAT',
  seeded_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table batches add column if not exists generation text not null default 'G1';

create table if not exists batch_logs (
  id bigserial primary key,
  batch_id uuid not null references batches(id) on delete cascade,
  from_phase text,
  to_phase text not null,
  notes text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  batch_id uuid not null references batches(id) on delete cascade,
  producer_id uuid not null references users(id),
  courier_id uuid references users(id),
  destination text not null,
  package_quantity integer not null check (package_quantity > 0),
  status text not null default 'READY_FOR_PICKUP',
  notes text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists iot_logs (
  id bigserial primary key,
  batch_id uuid references batches(id) on delete set null,
  temperature_c numeric(5, 2) not null,
  humidity_percent numeric(5, 2) not null,
  light_lux numeric(10, 2) not null,
  pump_on boolean not null default false,
  fan_on boolean not null default false,
  recorded_at timestamptz not null default now()
);

create table if not exists package_tracking (
  id bigserial primary key,
  receipt_number text not null,
  batch_id uuid not null references batches(id) on delete cascade,
  courier_id uuid not null references users(id),
  status text not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  cargo_condition text not null,
  container_temperature_c numeric(5, 2),
  notes text,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_batches_public_id on batches(public_id);
create index if not exists idx_shipments_receipt_number on shipments(receipt_number);
create index if not exists idx_shipments_status on shipments(status);
create index if not exists idx_shipments_courier_id on shipments(courier_id);
create index if not exists idx_iot_logs_recorded_at on iot_logs(recorded_at desc);
create index if not exists idx_package_tracking_receipt on package_tracking(receipt_number);
create index if not exists idx_package_tracking_recorded_at on package_tracking(recorded_at desc);

create or replace function set_public_ids()
returns trigger as $$
begin
  if tg_table_name = 'users' and new.public_id is null then
    new.public_id := case new.role
      when 'ADMIN' then 'ADM-'
      when 'PRODUSEN' then 'PNK-'
      when 'KURIR' then 'DRV-'
    end || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  end if;

  if tg_table_name = 'batches' and new.public_id is null then
    new.public_id := 'BATCH-' || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function set_shipment_receipt_number()
returns trigger as $$
begin
  if new.receipt_number is null then
    new.receipt_number := 'ELC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(new.id::text, '-', ''), 1, 5));
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_public_id on users;
create trigger trg_users_public_id
before insert on users
for each row execute function set_public_ids();

drop trigger if exists trg_batches_public_id on batches;
create trigger trg_batches_public_id
before insert on batches
for each row execute function set_public_ids();

drop trigger if exists trg_shipments_receipt_number on shipments;
create trigger trg_shipments_receipt_number
before insert on shipments
for each row execute function set_shipment_receipt_number();

insert into users (public_id, name, username, password_hash, role, status)
values
  ('ADM-001', 'Nadia Admin', 'admin', 'fb9d7fee00ff8d07cecb7c182c00fdd7:5976ee00b61fdb8f8cc3f61130039e45e23c8534510e6d0c3d4b4c1e774b10e8e76d5c754681073841f8e6b0c1e7beb581377cd737dd6712cad6d0b721aa065b', 'ADMIN', 'ACTIVE'),
  ('PNK-014', 'Greenhouse A3', 'produsen', 'fb9d7fee00ff8d07cecb7c182c00fdd7:5976ee00b61fdb8f8cc3f61130039e45e23c8534510e6d0c3d4b4c1e774b10e8e76d5c754681073841f8e6b0c1e7beb581377cd737dd6712cad6d0b721aa065b', 'PRODUSEN', 'ACTIVE'),
  ('DRV-021', 'Ikbal Kurir', 'kurir', 'fb9d7fee00ff8d07cecb7c182c00fdd7:5976ee00b61fdb8f8cc3f61130039e45e23c8534510e6d0c3d4b4c1e774b10e8e76d5c754681073841f8e6b0c1e7beb581377cd737dd6712cad6d0b721aa065b', 'KURIR', 'ACTIVE')
on conflict (username) do nothing;

insert into batches (public_id, producer_id, variety, generation, quantity, phase, health_status, seeded_at)
select 'BATCH-B092', u.id, 'Cabai Rawit Merah', 'G2', 1200, 'PENYEMAIAN', 'SEHAT', '2026-05-10'
from users u
where u.username = 'produsen'
on conflict (public_id) do nothing;

insert into batches (public_id, producer_id, variety, generation, quantity, phase, health_status, seeded_at)
select 'BATCH-B095', u.id, 'Tomat Hibrida F1', 'F1', 850, 'VEGETATIF_AWAL', 'SEHAT', '2026-05-18'
from users u
where u.username = 'produsen'
on conflict (public_id) do nothing;

insert into shipments (receipt_number, batch_id, producer_id, destination, package_quantity, status, notes)
select 'ELC-20260528-0092', b.id, u.id, 'Dinas Pertanian Suka Makmur, Blok C', 250, 'READY_FOR_PICKUP', 'Paket awal siap diterima kurir.'
from batches b
join users u on u.username = 'produsen'
where b.public_id = 'BATCH-B092'
on conflict (receipt_number) do nothing;
