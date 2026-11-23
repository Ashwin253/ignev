alter table public.evlistings
  add column if not exists images_360 jsonb not null default '[]'::jsonb;

update public.evlistings
set images_360 = jsonb_build_array(
  images_360 -> 0,
  '""'::jsonb,
  images_360 -> 1,
  '""'::jsonb,
  images_360 -> 2,
  '""'::jsonb,
  images_360 -> 3,
  '""'::jsonb
)
where case
        when jsonb_typeof(images_360) = 'array'
          then jsonb_array_length(images_360) = 4
        else false
      end
  and jsonb_typeof(images_360 -> 0) = 'string'
  and jsonb_typeof(images_360 -> 1) = 'string'
  and jsonb_typeof(images_360 -> 2) = 'string'
  and jsonb_typeof(images_360 -> 3) = 'string';

comment on column public.evlistings.images_360 is
  'Clockwise exterior image URLs: Front, Front-right, Right, Right-end, Rear, End-left, Left, Left-start. Four-frame legacy arrays are also supported.';

notify pgrst, 'reload schema';