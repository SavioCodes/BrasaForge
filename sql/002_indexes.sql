create index if not exists idx_sites_user_status on sites(user_id, status);
create index if not exists idx_sites_updated_at on sites(updated_at desc);
create index if not exists idx_site_pages_site_route on site_pages(site_id, route);
create index if not exists idx_jobs_user_status on jobs(user_id, status);
create index if not exists idx_jobs_site_kind on jobs(site_id, kind);
create index if not exists idx_billing_status on billing(status);
create index if not exists idx_credits_ledger_user_created on credits_ledger(user_id, created_at desc);
create index if not exists idx_api_logs_route_created on api_logs(route, created_at desc);
