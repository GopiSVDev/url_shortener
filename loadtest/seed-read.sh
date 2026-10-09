#!/usr/bin/env bash
# Seeds the fixed read-test dataset and exports its codes for read.js.
# Empties short_urls and app_user first. Re-run after any write test (it truncates the tables).
#
#   loadtest/seed-read.sh            # 1,000,000 links
#   LINKS=100000 loadtest/seed-read.sh
#
# Writes loadtest/data/live-codes.txt (redirect -> 302) and loadtest/data/expired-codes.txt (-> 410).
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
links="${LINKS:-1000000}"
db_user="${POSTGRES_USER:-admin}"
db_name="${POSTGRES_DB:-urlshortenerdb}"
psql=(docker exec -i url-shortener-db psql -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -q)

echo "Seeding $links links ..."
start=$(date +%s)
"${psql[@]}" -v links="$links" < "$here/seed-read.sql"
echo "Seeded in $(( $(date +%s) - start ))s"

mkdir -p "$here/data"
# Ordered by a hash so popular ranks in read.js land on rows spread over the whole table,
# not on the first pages (hot rows clustered together would be unrealistically cache friendly).
"${psql[@]}" -At -c "SELECT short_code FROM short_urls WHERE expiration_date IS NULL OR expiration_date > now() ORDER BY md5(short_code)" \
  > "$here/data/live-codes.txt"
"${psql[@]}" -At -c "SELECT short_code FROM short_urls WHERE expiration_date <= now() ORDER BY md5(short_code)" \
  > "$here/data/expired-codes.txt"

echo "Live codes:    $(wc -l < "$here/data/live-codes.txt")"
echo "Expired codes: $(wc -l < "$here/data/expired-codes.txt")"
"${psql[@]}" -At -c "SELECT 'Table + indexes: ' || pg_size_pretty(pg_total_relation_size('short_urls'))"
