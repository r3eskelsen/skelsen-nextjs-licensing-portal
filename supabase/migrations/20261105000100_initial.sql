-- Synthetic local-only licensing demo. All tenant tables use RLS.
create extension if not exists pgcrypto;
create type public.member_role as enum ('client','admin','owner');
create table public.organizations(id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120), created_at timestamptz not null default now());
create table public.memberships(organization_id uuid not null references public.organizations(id), user_id uuid not null references auth.users(id), role public.member_role not null, created_at timestamptz not null default now(), primary key(organization_id,user_id));
create table public.licenses(id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), name text not null check(length(name) between 1 and 80), status text not null default 'active' check(status in ('active','expired','revoked')), expires_on date not null, created_at timestamptz not null default now());
create table public.documents(id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), license_id uuid not null, title text not null check(length(title) between 1 and 160), created_at timestamptz not null default now(), foreign key(license_id) references public.licenses(id));
create table public.renewals(id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), license_id uuid not null references public.licenses(id), renewed_on date not null, created_at timestamptz not null default now());
create table public.audit_events(id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), actor_id uuid references auth.users(id), action text not null, license_id uuid references public.licenses(id), created_at timestamptz not null default now());
create index on public.memberships(user_id,organization_id);
create index on public.licenses(organization_id);
create index on public.documents(organization_id);
create index on public.renewals(organization_id);
create index on public.audit_events(organization_id,created_at desc);
-- SECURITY DEFINER helper avoids recursive membership policy evaluation.
create function public.has_org_role(org uuid, allowed public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships m where m.organization_id=org and m.user_id=(select auth.uid()) and m.role=any(allowed));
$$;
revoke all on function public.has_org_role(uuid,public.member_role[]) from public;
grant execute on function public.has_org_role(uuid,public.member_role[]) to authenticated;
create function public.belongs_to_org(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships m where m.organization_id=org and m.user_id=(select auth.uid()));
$$;
revoke all on function public.belongs_to_org(uuid) from public;
grant execute on function public.belongs_to_org(uuid) to authenticated;
-- Additional composite keys guard against cross-org parent references.
create unique index licenses_org_id_id on public.licenses(organization_id,id);
alter table public.documents add constraint documents_same_org_fk foreign key(organization_id,license_id) references public.licenses(organization_id,id);
alter table public.renewals add constraint renewals_same_org_fk foreign key(organization_id,license_id) references public.licenses(organization_id,id);
alter table public.audit_events add constraint audit_same_org_fk foreign key(organization_id,license_id) references public.licenses(organization_id,id);
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.licenses enable row level security;
alter table public.documents enable row level security;
alter table public.renewals enable row level security;
alter table public.audit_events enable row level security;
create policy org_select on public.organizations for select to authenticated using (public.belongs_to_org(id));
create policy member_select on public.memberships for select to authenticated using (public.belongs_to_org(organization_id));
create policy license_select on public.licenses for select to authenticated using (public.belongs_to_org(organization_id));
create policy license_insert on public.licenses for insert to authenticated with check (public.has_org_role(organization_id,array['admin','owner']::public.member_role[]));
create policy license_update on public.licenses for update to authenticated using (public.has_org_role(organization_id,array['admin','owner']::public.member_role[])) with check (public.has_org_role(organization_id,array['admin','owner']::public.member_role[]));
create policy document_select on public.documents for select to authenticated using (public.belongs_to_org(organization_id));
create policy renewal_select on public.renewals for select to authenticated using (public.belongs_to_org(organization_id));
create policy audit_select on public.audit_events for select to authenticated using (public.belongs_to_org(organization_id));
-- Audit is server-side database-generated, and not writable by ordinary clients.
create function public.record_license_created() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.audit_events(organization_id,actor_id,action,license_id) values(new.organization_id,auth.uid(),'license.created',new.id);
 return new;
end;$$;
create trigger licenses_audit after insert on public.licenses for each row execute function public.record_license_created();
-- No client write access to org membership, documents, renewals or audit in v0.1.
grant usage on schema public to authenticated;
grant select on public.organizations, public.memberships, public.documents, public.renewals, public.audit_events to authenticated;
grant select, insert, update on public.licenses to authenticated;
