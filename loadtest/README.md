# Load testing

Goal: find how many requests per second the backend sustains on a small, fixed hardware budget,
then optimize until the **hardware is the bottleneck, not the software**. Every run is recorded
so each optimization's effect is visible ([results/RESULTS.md](results/RESULTS.md)).

## Hardware budget

1 CPU / 2 GB RAM / 100 GB storage in total for the app containers (set in `docker-compose.yml`):

| Container | CPU | Memory |
|---|---|---|
| backend (Spring Boot, `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=70`) | 0.6 | 1248 MB |
| postgres | 0.4 | 800 MB |

Monitoring containers (Prometheus, cAdvisor, postgres-exporter) have no limits; they are
measuring tools, not part of the budget. pgAdmin is commented out. k6 runs on the host.

## Pass target

A rate passes only if **all** hold: p90 <= 150 ms, p95 <= 200 ms, p99 <= 500 ms, errors < 1%,
and k6 dropped < 1% of iterations (dropping means the backend was too slow to keep up).

## Tools

| File | What it does |
|---|---|
| `write.js` | k6 test: anonymous `POST /api/urls` at one fixed rate (`RATE`, `DURATION` env) |
| `read.js` | k6 test: `GET /{code}` redirects, 97% live links (Zipf: a few hot links get most traffic), 2% unknown (404), 1% expired (410) |
| `seed-read.sh` + `seed-read.sql` | Fixed read dataset (1M links, same every time) and its codes in `data/` (git-ignored) |
| `find-capacity.mjs` | Finds the highest stable rate for a k6 test and records the result |
| `profile.sh` | CPU-profiles the backend (async-profiler) while k6 runs at a fixed rate |
| `results/RESULTS.md` | One row per capacity run: stable req/s, change vs previous, p90/p95/p99, CPU, note |
| `results/runs/` | Per run: every step with latency, time breakdown and saturation (`.md` + `.json`) (local only, git-ignored) |
| `results/profiles/` | Per profile: `flamegraph.html`, `top.txt` (samples, CPU by layer, socket I/O), `collapsed.txt`, `profile.jfr` (local only, git-ignored) |
| `../monitoring/` | Prometheus scrape config, `pg_stat_statements` setup for Postgres |

### find-capacity.mjs

```bash
node loadtest/find-capacity.mjs write "what changed"
```

1. **Warm-up** (not judged): 50, 100, 200 req/s for 30 s each, then 1-minute steps at 300 req/s
   until backend CPU per request changes < 5% between two steps (JIT finished). Matters a lot after
   a rebuild: a cold JVM on 0.6 CPU costs ~70% more CPU per request for several minutes.
2. **Ramp**: starts at ~90% of the previous result for the same test, x1.1 per step (first run
   ever: 50, x2). 30 s steps.
3. **Refine**: binary search between last pass and first fail, rates on a 5 req/s grid. Steps are
   30 s, or 1 min once within 5% of the limit (a small overload needs time to build a queue).
4. **Confirm**: hold the best rate for 2 min. If it fails, lower by 5% and confirm again. Short steps
   often pass rates that collapse after a minute or two (a random CPU burst starts a queue the backend
   can't drain), so only the confirmed rate is reported. Was 5 min / 3% until 2026-10-08; too slow.

After each step it reads Prometheus and saves where the time went per request (queued + network,
waiting for a DB connection, holding the DB connection, Java code; they add up to k6's average) and
saturation (Tomcat threads, DB pool, GC, CPU, CPU throttling, memory, DB cache hit).
It also records SQL statements per request, and for the confirmed step lists every statement with how
often it runs per request and its average time inside Postgres (from `pg_stat_statements` via
postgres-exporter v0.20.1 with `include_query`).
Env overrides (`P95_MS`, `START_RATE`, `CONFIRM_DURATION`, ...) are listed at the top of the file.

### profile.sh

```bash
loadtest/profile.sh write 800 60 "what changed"   # test, rate, seconds, note
```

Profile below the capacity limit so it shows the normal cost per request, not queueing.
After a rebuild, warm the JVM first (the built-in 30 s warm-up is too short for a cold JVM on 0.6 CPU):
`RATE=300 DURATION=4m k6 run -q loadtest/<test>.js`. If k6 misses the rate or drops requests,
`profile.sh` marks `top.txt` as INVALID PROFILE. Always profile
at the same rate and duration (800 req/s, 60 s) so profiles are comparable:

- **Total samples** in `top.txt` = CPU used for the same work. Fewer samples = cheaper requests
  (e.g. 22,607 -> 19,838 = 12% less CPU per request).
- **CPU by layer** counts each sample once, under the innermost layer doing the work. Percentages
  are shares of the total, so when one layer shrinks the others' percentages rise without changing.
- **Socket I/O** is time in system calls (the kernel moving bytes); it only shrinks with fewer round trips.

Compare two profiles: `loadtest/.tools/async-profiler-4.5-linux-x64/bin/jfrconv --cpu --diff a.jfr b.jfr diff.html`.

## Before every run

1. One change per run, committed first (each run file records the commit; `+changes` means uncommitted).
2. `docker compose up -d --build backend` if backend code/config changed.
3. Reset the data so every run of a test starts from the same state:
   - write: empty the tables
     ```bash
     docker exec url-shortener-db psql -U admin -d urlshortenerdb -c "TRUNCATE short_urls, app_user RESTART IDENTITY CASCADE;"
     ```
   - read: `loadtest/seed-read.sh` (also needed after any write run, which empties the tables).
     Reads don't change the data, so read runs can follow each other without reseeding.
4. Run, then compare the stable req/s with the previous row. Run-to-run noise is about ±15 req/s.

## How to read a run

- **Hardware bound**: a container sits at its CPU limit while time goes into real work.
- **Software bound**: latency breaks the target with CPU to spare; the time breakdown shows where
  requests wait (queue, DB connection pool) and the saturation table shows what is full.
- The overloaded steps show the raw maximum throughput at 100% CPU; the stable rate is usually
  ~90-93% of it. Gains beyond that gap come only from making each request cheaper (profile it).
