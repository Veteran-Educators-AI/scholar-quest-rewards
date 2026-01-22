-- Seed Data: Default badges, collectibles, challenges

-- Streak badges
INSERT INTO badges (name, description, icon_url, xp_reward, criteria) VALUES
  ('3-Day Streak', 'Complete assignments on time for 3 days in a row', NULL, 25, '{"streak_days": 3}'),
  ('Week Warrior', 'Complete assignments on time for 7 days in a row', NULL, 50, '{"streak_days": 7}'),
  ('Two-Week Champion', 'Complete assignments on time for 14 days in a row', NULL, 100, '{"streak_days": 14}'),
  ('Monthly Master', 'Complete assignments on time for 30 days in a row', NULL, 200, '{"streak_days": 30}'),
  ('Streak Legend', 'Complete assignments on time for 60 days in a row', NULL, 400, '{"streak_days": 60}'),
  ('Unstoppable', 'Complete assignments on time for 100 days in a row', NULL, 1000, '{"streak_days": 100}')
ON CONFLICT DO NOTHING;

-- Challenge badges
INSERT INTO public.badges (name, description, icon_url, xp_reward, criteria) VALUES
  ('Math Master', 'Complete the Math Week challenge', NULL, 50, '{"type": "challenge", "theme": "math"}'),
  ('Reading Champion', 'Complete the Reading Week challenge', NULL, 50, '{"type": "challenge", "theme": "reading"}'),
  ('Science Explorer', 'Complete the Science Week challenge', NULL, 50, '{"type": "challenge", "theme": "science"}')
ON CONFLICT DO NOTHING;

-- Collectibles: Frames
INSERT INTO public.collectibles (name, description, rarity, slot, image_url) VALUES
  ('Golden Frame', 'A shimmering golden border for top achievers', 'legendary', 'frame', null),
  ('Star Frame', 'Surrounded by twinkling stars', 'epic', 'frame', null),
  ('Rainbow Frame', 'A colorful rainbow border', 'rare', 'frame', null),
  ('Basic Frame', 'A simple decorative frame', 'common', 'frame', null)
ON CONFLICT DO NOTHING;

-- Collectibles: Backgrounds
INSERT INTO public.collectibles (name, description, rarity, slot, image_url) VALUES
  ('Galaxy Background', 'A cosmic starfield backdrop', 'legendary', 'background', null),
  ('Forest Background', 'A peaceful forest scene', 'epic', 'background', null),
  ('Ocean Background', 'Calm ocean waves', 'rare', 'background', null),
  ('Sky Background', 'Blue sky with clouds', 'common', 'background', null)
ON CONFLICT DO NOTHING;

-- Collectibles: Hats
INSERT INTO public.collectibles (name, description, rarity, slot, image_url) VALUES
  ('Wizard Hat', 'The hat of a true scholar wizard', 'legendary', 'hat', null),
  ('Crown', 'A royal crown for quiz champions', 'epic', 'hat', null),
  ('Graduation Cap', 'Celebrate your learning journey', 'rare', 'hat', null),
  ('Baseball Cap', 'A cool casual cap', 'common', 'hat', null)
ON CONFLICT DO NOTHING;

-- Collectibles: Pets
INSERT INTO public.collectibles (name, description, rarity, slot, image_url) VALUES
  ('Phoenix Companion', 'A magical fire bird by your side', 'legendary', 'pet', null),
  ('Owl Companion', 'A wise owl friend', 'epic', 'pet', null),
  ('Cat Companion', 'A curious cat buddy', 'rare', 'pet', null),
  ('Puppy Companion', 'A loyal puppy friend', 'common', 'pet', null)
ON CONFLICT DO NOTHING;

-- Sample challenges
INSERT INTO public.challenges (title, description, theme, start_date, end_date, xp_bonus, coin_bonus, min_assignments, badge_id)
SELECT
  'MathMania Week',
  'Complete 3 math assignments this week to earn bonus XP and the Math Master badge!',
  'math',
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days',
  150, 50, 3, id
FROM public.badges WHERE name = 'Math Master'
ON CONFLICT DO NOTHING;

INSERT INTO public.challenges (title, description, theme, start_date, end_date, xp_bonus, coin_bonus, min_assignments, badge_id)
SELECT
  'Reading Rally',
  'Complete 3 reading assignments this week for bonus rewards and the Reading Champion badge!',
  'reading',
  date_trunc('week', now()) + interval '7 days',
  date_trunc('week', now()) + interval '14 days',
  150, 50, 3, id
FROM public.badges WHERE name = 'Reading Champion'
ON CONFLICT DO NOTHING;

-- Sample lotto draw
INSERT INTO public.lotto_draws (title, description, prize_description, end_date)
VALUES (
  'January Super Raffle',
  'Complete assignments to earn entries! Every verified assignment = 1 raffle ticket.',
  '$50 Gaming Gift Card',
  now() + interval '30 days'
)
ON CONFLICT DO NOTHING;
