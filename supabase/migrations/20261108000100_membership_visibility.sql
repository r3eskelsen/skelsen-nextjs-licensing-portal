-- ESK-LAB-04 privacy correction (v1.0.1): members can read only their own
-- membership. Administrative membership-roster functionality is out of scope.
-- Additive migration: retains upgrade path from v1.0.0 as well as fresh resets.
drop policy if exists member_select on public.memberships;
create policy member_select on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()));
