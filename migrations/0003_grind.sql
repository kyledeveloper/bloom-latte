-- 地点改为研磨度
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pours'
      and column_name = 'place'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pours'
      and column_name = 'grind'
  ) then
    alter table pours rename column place to grind;
  end if;
end $$;
