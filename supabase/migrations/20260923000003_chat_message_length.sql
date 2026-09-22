-- Defense in depth: bound chat message size at the database layer so a
-- client bypassing the 2000-char application validation cannot stuff
-- unbounded text into chat_messages via direct API access.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chat_messages_content_length'
  ) then
    alter table public.chat_messages
      add constraint chat_messages_content_length
      check (char_length(content) between 1 and 5000);
  end if;
end $$;
