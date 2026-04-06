-- BillMate v17 Supabase Schema
-- Run this in your Supabase SQL editor

create table if not exists orders (
  id uuid primary key,
  user_id uuid references auth.users(id),
  bill_number text not null,
  order_number text,
  service_mode text default 'dine-in',
  table_number text,
  customer_name text,
  customer_phone text,
  items jsonb not null default '[]',
  subtotal_paise bigint not null default 0,
  discount_paise bigint not null default 0,
  discount_type text default 'flat',
  discount_value numeric default 0,
  gst_percent numeric default 0,
  gst_paise bigint not null default 0,
  total_paise bigint not null default 0,
  payment_method text not null default 'cash',
  cash_received_paise bigint default 0,
  change_paise bigint default 0,
  upi_amount_paise bigint default 0,
  status text default 'completed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders enable row level security;
create policy "Users own orders" on orders for all using (auth.uid() = user_id);
create index if not exists orders_user_created on orders(user_id, created_at desc);
