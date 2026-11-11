-- Run in Supabase Dashboard > SQL Editor.
-- The browser roles intentionally receive no access to customer/order data.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  email text not null,
  shipping_address text not null,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  items jsonb not null,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  shipping integer not null default 0 check (shipping >= 0),
  total integer not null check (total >= 0),
  payment_status text not null default 'awaiting_payment'
    check (payment_status in ('awaiting_payment','submitted','verified','rejected')),
  order_status text not null default 'awaiting_payment'
    check (order_status in ('awaiting_payment','paid','payment_issue','processing','shipped','delivered','cancelled')),
  payer_name text,
  utr text,
  payment_submitted_at timestamptz,
  verified_at timestamptz,
  access_token_hash text not null
);

create unique index if not exists orders_utr_unique
  on public.orders (upper(utr)) where utr is not null;
create index if not exists orders_created_at_desc on public.orders (created_at desc);
create index if not exists orders_payment_status on public.orders (payment_status);

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated;
grant all privileges on table public.orders to service_role;

-- Only the server uses the Supabase secret key. Never put it in frontend code.
