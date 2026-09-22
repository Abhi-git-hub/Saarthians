-- Teacher note sharing.
--
-- note_shares has RLS enabled with only a SELECT policy, so teachers could
-- never actually share notes despite the notes_shared_read policy advertising
-- it. These two narrowly-scoped policies close that gap without touching any
-- existing policy:
--   * INSERT: the sharer must own the note AND the target must be one of their
--     actively assigned students (or the caller is an admin).
--   * DELETE: the note owner (or an admin) may revoke a share.
-- No UPDATE policy is added: shares carry no mutable columns, so updates
-- remain denied by default.

create policy note_share_owner_insert on public.note_shares
for insert
with check (
  (
    shared_by_user_id = auth.uid()
    and exists (
      select 1 from public.notes n
      where n.id = note_shares.note_id and n.owner_user_id = auth.uid()
    )
    and exists (
      select 1 from public.teacher_student ts
      where ts.teacher_id = auth.uid()
        and ts.student_id = note_shares.student_id
        and ts.status = 'active'
    )
  )
  or public.is_admin()
);

create policy note_share_owner_delete on public.note_shares
for delete
using (
  exists (
    select 1 from public.notes n
    where n.id = note_shares.note_id and n.owner_user_id = auth.uid()
  )
  or public.is_admin()
);
