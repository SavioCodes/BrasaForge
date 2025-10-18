create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

set search_path to public;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  plan text not null default 'trial',
  credits_total integer not null default 200,
  credits_used integer not null default 0,
  openai_api_key text,
  anthropic_api_key text,
  google_api_key text,
  default_provider text,
  default_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  status text not null default 'draft',
  provider_id text,
  model text,
  palette text,
  sector text,
  last_prompt text,
  export_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  route text not null,
  content jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_pages_unique_route unique(site_id, route)
);

create table if not exists jobs (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  kind text not null,
  status text not null default 'queued',
  provider_id text,
  model text,
  prompt text,
  result jsonb,
  error text,
  estimated_credits integer,
  cost_credits integer,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists billing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan text,
  status text,
  amount numeric(12, 2),
  external_id text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_user_unique unique(user_id)
);

create table if not exists credits_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  reasaon text not null default 'spend',
  reference_id text,
  created_at timestamptz not null default now()
);

create table if not exists api_logs (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  route text not null,
  status_code integer not null,
  duration_ms integer,
  provider_id text,
  model text,
  tokens_in integer,
  tokens_out integer,
  cost_credits numeric(10, 2),
  error_message text,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

create trigger trigger_sites_updated_at
before update on sites
for each row execute function set_updated_at();

create trigger trigger_site_pages_updated_at
before update on site_pages
for each row execute function set_updated_at();

create trigger trigger_jobs_updated_at
before update on jobs
for each row execute function set_updated_at();

create trigger trigger_billing_updated_at
before update on billing
for each row execute function set_updated_at();

alter table profiles enable row level security;
alter table sites enable row level security;
alter table site_pages enable row level security;
alter table jobs enable row level security;
alter table credits_ledger enable row level security;

create policy profiles_select_own on profiles
  for select using (auth.uid() = id);
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy sites_select_own on sites
  for select using (auth.uid() = user_id);
create policy sites_modify_own on sites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy site_pages_select_own on site_pages
  for select using (
    auth.uid() = (
      select user_id from sites where sites.id = site_pages.site_id
    )
  );
create policy site_pages_modify_own on site_pages
  for all using (
    auth.uid() = (
      select user_id from sites where sites.id = site_pages.site_id
    )
  )
  with check (
    auth.uid() = (
      select user_id from sites where sites.id = site_pages.site_id
    )
  );

create policy jobs_select_own on jobs
  for select using (auth.uid() = user_id);
create policy jobs_modify_own on jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy credits_ledger_select_own on credits_ledger
  for select using (auth.uid() = user_id);

create or replace function public.get_credits(p_user_id uuid)
returns table(total integer, used integer, available integer, plan text)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(credits_total, 0) as total,
    coalesce(credits_used, 0) as used,
    greatest(coalesce(credits_total, 0) - coalesce(credits_used, 0), 0) as available,
    plan
  from profiles
  where id = p_user_id;
$$;

grant execute on function public.get_credits(uuid) to authenticated, service_role;

create or replace function public.spend_credits(
  p_user_id uuid,
  p_amount integer,
  p_reasaon text default 'spend',
  p_reference_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_total integer;
  current_used integer;
  remaining integer;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', true, 'remaining', null);
  end if;

  select credits_total, credits_used
    into current_total, current_used
  from profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile % not found', p_user_id;
  end if;

  remaining := current_total - current_used;

  if remaining < p_amount then
    return jsonb_build_object('success', false, 'remaining', remaining);
  end if;

  update profiles
    set credits_used = credits_used + p_amount,
        updated_at = now()
    where id = p_user_id;

  insert into credits_ledger(user_id, amount, reasaon, reference_id)
  values (p_user_id, p_amount, coalesce(p_reasaon, 'spend'), p_reference_id);

  return jsonb_build_object('success', true, 'remaining', remaining - p_amount);
end;
$$;

grant execute on function public.spend_credits(uuid, integer, text, text) to authenticated, service_role;

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles(id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_user();
