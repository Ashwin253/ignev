BEGIN;
SELECT plan(8);

INSERT INTO public.evlistings (id, slug, title)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'ev-media-ratings-rls-test',
  'RLS test vehicle'
);

INSERT INTO public.ev_media_sources (id, name)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'RLS test source'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.ev_media_ratings', 'insert,update,delete'),
  'anonymous users have no write grants'
);

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$
    INSERT INTO public.ev_media_ratings (
      id, listing_id, source_id, source_name, rating_value, rating_max
    )
    VALUES (
      '77777777-7777-7777-7777-777777777777',
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666',
      'RLS test source', 4, 5
    )
  $$,
  '42501',
  NULL,
  'anonymous users cannot insert ratings'
);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$
    INSERT INTO public.ev_media_ratings (
      id, listing_id, source_id, source_name, rating_value, rating_max
    )
    VALUES (
      '77777777-7777-7777-7777-777777777777',
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666',
      'RLS test source', 4, 5
    )
  $$,
  'authenticated users can insert ratings'
);
RESET ROLE;
SELECT is(
  (SELECT count(*) FROM public.ev_media_ratings WHERE id = '77777777-7777-7777-7777-777777777777'),
  1::bigint,
  'authenticated insert creates a rating'
);

SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$
    UPDATE public.ev_media_ratings
    SET rating_value = 3
    WHERE id = '77777777-7777-7777-7777-777777777777'
  $$,
  'authenticated users can update ratings'
);
RESET ROLE;
SELECT is(
  (SELECT rating_value FROM public.ev_media_ratings WHERE id = '77777777-7777-7777-7777-777777777777'),
  3::numeric,
  'authenticated update changes a rating'
);

SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$
    DELETE FROM public.ev_media_ratings
    WHERE id = '77777777-7777-7777-7777-777777777777'
  $$,
  'authenticated users can delete ratings'
);
RESET ROLE;
SELECT is(
  (SELECT count(*) FROM public.ev_media_ratings WHERE id = '77777777-7777-7777-7777-777777777777'),
  0::bigint,
  'authenticated delete removes a rating'
);

SELECT * FROM finish();
ROLLBACK;
