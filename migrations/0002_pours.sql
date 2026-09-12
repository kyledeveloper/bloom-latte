-- Per-user latte journal. Photos are compressed JPEG data URLs.
create table if not exists pours (
  id         text primary key,
  user_id    text not null,
  created_at timestamptz not null default now(),
  photo      text not null,
  pattern    text not null,
  rating     integer not null,
  beans      text not null default '',
  milk       text not null default '',
  place      text not null default '',
  notes      text not null default ''
);

create index if not exists pours_user_id_created_at_idx
  on pours (user_id, created_at desc);
