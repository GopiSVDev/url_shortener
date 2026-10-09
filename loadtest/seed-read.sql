-- Fixed dataset for the read (redirect) test. Same rows every time, so read runs are comparable.
-- Run through loadtest/seed-read.sh, which also exports the codes for k6.
--
-- :links (default 1,000,000 via seed-read.sh) short links:
--   - codes: 7-char base62, unique and scattered (id * odd constant mod 62^7, a bijection)
--   - 90% never expire, 9% expire in the future, 1% already expired (redirect returns 410)
--   - 30% owned by one of 1,000 users, the rest anonymous
--   - URLs 40-150 chars, created over the last year

TRUNCATE short_urls, app_user RESTART IDENTITY CASCADE;

INSERT INTO app_user (username, password, role, created_at)
SELECT 'seed_user_' || u,
       '$2a$10$seedseedseedseedseedseOnlyForLoadTestsNotARealHash0000',
       'USER',
       now() - interval '1 year'
FROM generate_series(1, 1000) u;

INSERT INTO short_urls (original_url, short_code, expiration_date, created_at, updated_at, user_id)
SELECT 'https://example' || (g % 500) || '.com/' || repeat(md5(g::text), 1 + g % 4),
       (SELECT string_agg(substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
                                 ((v / (ARRAY[1, 62, 3844, 238328, 14776336, 916132832, 56800235584]::bigint[])[p + 1]) % 62)::int + 1, 1),
                          '' ORDER BY p DESC)
        FROM generate_series(0, 6) p),
       CASE WHEN g % 100 = 0 THEN now() - interval '1 day'
            WHEN g % 100 < 10 THEN now() + interval '1 year'
       END,
       now() - (g % 365) * interval '1 day',
       now() - (g % 365) * interval '1 day',
       CASE WHEN g % 10 < 3 THEN g % 1000 + 1 END
FROM generate_series(1, :links) g,
     LATERAL (SELECT (g::bigint * 1580030173) % 3521614606208 AS v) c;

VACUUM ANALYZE app_user, short_urls;
