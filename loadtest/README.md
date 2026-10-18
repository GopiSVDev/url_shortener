# Load testing

Load tests for the backend, used to find how many requests per second it sustains on a small, fixed
resource budget and to optimize it until the hardware, not the software, is the limit. Every run is
recorded, so the effect of each optimization is visible in [results/RESULTS.md](results/RESULTS.md).

## Contents

- [Load testing](#load-testing)
  - [Contents](#contents)
  - [Test environment](#test-environment)
  - [Pass criteria](#pass-criteria)
  - [Scenarios](#scenarios)
  - [Prerequisites](#prerequisites)
  - [Running a test](#running-a-test)
    - [1. Prepare](#1-prepare)
    - [2. Find the capacity](#2-find-the-capacity)
    - [Single run at a fixed rate](#single-run-at-a-fixed-rate)
  - [Profiling](#profiling)
  - [Diagnosing where the time goes](#diagnosing-where-the-time-goes)
  - [Reading the results](#reading-the-results)
  - [Files](#files)

## Test environment

The app runs in an LXD virtual machine, `url-shortener` (Ubuntu 24.04, IP `10.24.21.249`), with
1 CPU, 2 GB of RAM and a 100 GB disk. Only `postgres` and `backend` run in it, under Docker Compose
without container limits, so they share the VM like they would on a small cloud server.

Everything else runs on the laptop, outside the budget:

| Tool | Where | Measures |
|---|---|---|
| k6 | laptop | Sends the load to `http://10.24.21.249:4000` |
| Prometheus | laptop (Docker, host network) | Scrapes the backend in the VM, postgres-exporter and LXD |
| postgres-exporter | laptop (Docker, host network) | `pg_stat_statements` of the VM's Postgres |
| LXD metrics endpoint | laptop (LXD itself) | VM CPU and memory, from outside the VM |

The VM's vCPU is pinned to host CPU 10 (core 5, sibling of CPU 11) and k6 runs on CPUs 0-9 with
`taskset`, so the load generator never shares a core with the app. Without pinning, k6 competed with the
VM on the laptop and results drifted down during a run (1050 instead of 1300 req/s). Keep the laptop
otherwise idle (no games or video) and plugged in during runs.

Postgres runs with `synchronous_commit=off` (set in `docker-compose.yml`): `diagnose.sh` showed that the
write path was bound by the WAL sync on every commit (~1-2 ms on the VM's ZFS-on-file disk, one sync at a
time). A crash can lose the last ~0.6 s of commits; acceptable for this project's disposable data.

Backend CPU comes from the JVM (`process_cpu_usage`). Postgres has no separate CPU number: the run file
shows VM CPU minus backend CPU, which is Postgres plus Docker and the OS.

Results from before the move to the VM (backend 0.6 CPU / Postgres 0.4 CPU in fixed container limits)
are not directly comparable with VM results.

## Pass criteria

A rate passes only if all of the following hold during the step:

| Metric | Limit |
|---|---|
| p90 latency | ≤ 150 ms |
| p95 latency | ≤ 200 ms |
| p99 latency | ≤ 500 ms |
| Error rate | < 1% |
| Dropped iterations | < 1% (k6 could not start requests on time because the backend fell behind) |

The limits can be overridden with environment variables (`P90_MS`, `P95_MS`, `P99_MS`, ...), listed at
the top of `find-capacity.mjs`. A run with different limits is not comparable with earlier runs.

## Scenarios

| Test | Script | Requests | Data |
|---|---|---|---|
| `write` | `write.js` | Anonymous `POST /api/urls` | Starts from empty tables |
| `read` | `read.js` | `GET /{code}` redirects: 97% live links, 2% unknown codes (404), 1% expired links (410) | 1M seeded links |

Live links in the read test follow a Zipf distribution (s = 1): the top 1,000 links get about 50% of the
requests and the top 10,000 about 67%, like real shortener traffic where a few links are popular.

With click analytics enabled, every successful redirect is also recorded. k6's User-Agent is classified
as a bot, so these clicks are stored (and cost the same to write) but are not counted in the stats.

## Prerequisites

- The VM, with the app running in it:
  ```bash
  sudo lxc launch ubuntu:24.04 url-shortener --vm -c limits.cpu=1 -c limits.memory=2GiB -d root,size=100GiB
  sudo lxc stop url-shortener && sudo lxc config set url-shortener limits.cpu=10-10   # pin to CPU 10
  sudo lxc start url-shortener
  sudo lxc config device override url-shortener eth0 ipv4.address=10.24.21.249   # fixed IP
  sudo lxc exec url-shortener -- sh -c 'curl -fsSL https://get.docker.com | sh && apt-get install -y btop'
  ```
  With ufw on the host, the VM needs `sudo ufw allow in on lxdbr0` and
  `sudo ufw route allow in|out on lxdbr0` to get an IP and reach the internet.
- LXD metrics for Prometheus (once):
  ```bash
  sudo lxc config set core.metrics_address 127.0.0.1:8444
  sudo lxc config set core.metrics_authentication false
  ```
- Monitoring on the laptop: `docker compose --profile monitoring up -d prometheus postgres-exporter`
- [k6](https://k6.io) (tested with v2.3) and Node.js 24 on the laptop
- `profile.sh` and `seed-read.sh` reach into the VM with `sudo lxc exec`, so they ask for the sudo password
- `RATE_LIMIT_ENABLED=false` in `.env`. k6 sends every request from one IP, which the per-IP rate limits
  would block. Restart the backend after changing it.

async-profiler is downloaded automatically by `profile.sh` into `loadtest/.tools/` on first use.

## Running a test

### 1. Prepare

1. Make one change per run. It is tested uncommitted and committed after its runs together with its
   results, so the run file records the previous commit with `+changes`.
2. Deploy the backend if its code or configuration changed. The image is built on the laptop (a build
   on the VM's 1 CPU is slow) and loaded into the VM, together with the project files:
   ```bash
   tar -c $(git ls-files) .env | sudo lxc exec url-shortener -- tar -x -C /root/url_shortener
   docker compose build backend
   docker save url_shortener-backend | sudo lxc exec url-shortener -- docker load
   sudo lxc exec url-shortener -- sh -c 'cd /root/url_shortener && docker compose up -d postgres backend'
   ```
3. Reset the data so every run of a test starts from the same state:
   - **write**: empty the tables
     ```bash
     sudo lxc exec url-shortener -- docker exec url-shortener-db psql -U admin -d urlshortenerdb \
       -c "TRUNCATE short_urls, app_user RESTART IDENTITY CASCADE;"
     ```
   - **read**: seed the fixed dataset (1M links, identical every time)
     ```bash
     loadtest/seed-read.sh
     ```
     Reseed after every write run, since the write test empties the tables. Read runs don't change the
     links, so they can follow each other without reseeding.

Both commands also empty `clicks` and `link_stats` (`CASCADE`).

### 2. Find the capacity

```bash
taskset -c 0-9 node loadtest/find-capacity.mjs <write|read> "what changed"
```

`taskset -c 0-9` keeps k6 off the VM's core (CPUs 10 and 11); use it for every k6 command, including
single runs and `profile.sh`.

The script runs k6 in steps of increasing rate and reports the highest rate that passes a sustained run:

1. **Warm-up** (not judged): 50, 100 and 200 req/s for 30 s each, then 1-minute steps at 300 req/s until
   the backend's CPU per request changes by less than 5% between two steps, which means the JIT has
   finished. After a rebuild this matters: a cold JVM uses much more CPU per request for several
   minutes.
2. **Ramp**: starts at about 90% of the previous result for the same test and grows 1.1× per step (the
   very first run starts at 50 and doubles). Steps are 30 s.
3. **Refine**: binary search between the last passing and the first failing rate, on a 10 req/s grid.
   Steps are 30 s, or 1 minute once within 5% of the limit, because a small overload needs time to build
   a visible queue.
4. **Confirm**: holds the best rate for 2 minutes. If it fails, the rate is lowered by 5% and confirmed
   again. Short steps often pass rates that collapse after a minute or two, so only the confirmed rate is
   reported.

After each step the script queries Prometheus and records where the time went per request, how saturated
each resource was, and how many SQL statements each request ran. The result is appended to
`results/RESULTS.md`, and the full details are saved in `results/runs/`.

### Single run at a fixed rate

```bash
RATE=200 DURATION=1m k6 run loadtest/write.js
```

Both scripts read `RATE` (req/s), `DURATION` and `BASE_URL` (default `http://10.24.21.249:4000`, the VM).

## Profiling

`profile.sh` records a CPU profile of the backend with async-profiler while k6 runs at a fixed rate:

```bash
loadtest/profile.sh <test> <rate> <seconds> "what changed"
loadtest/profile.sh write 800 60 "baseline"
```

- Always profile at the same rate and duration (800 req/s for 60 s) so profiles can be compared.
- Profile below the capacity limit, so the profile shows the normal cost of a request rather than
  queueing.
- After a rebuild, warm up the JVM first; the built-in 30 s warm-up is too short on 1 CPU:
  ```bash
  RATE=300 DURATION=4m k6 run -q loadtest/<test>.js
  ```
- If k6 misses the rate or drops requests, `top.txt` is marked `INVALID PROFILE`.

Each profile is saved in `results/profiles/<date>-<test>-<rate>rps/`:

| File | Contents |
|---|---|
| `flamegraph.html` | Interactive flame graph; open in a browser |
| `top.txt` | Total samples, CPU by layer, socket I/O share, top methods by self time |
| `collapsed.txt` | One line per stack with its sample count, for custom analysis |
| `profile.jfr` | Raw recording |

To compare two recordings as a differential flame graph:

```bash
loadtest/.tools/async-profiler-4.5-linux-x64/bin/jfrconv --cpu --diff a.jfr b.jfr diff.html
```

## Diagnosing where the time goes

`diagnose.sh` explains a time breakdown that the run file only shows as totals (for example why holding a
DB connection takes ms when the SQL takes µs). It runs k6 at a steady rate and, during the same 60 s
window, measures from three sides:

```bash
loadtest/diagnose.sh <test> <rate> <seconds> "note"
loadtest/diagnose.sh write 1300 180 "where does DB hold time go"
```

| Side | Source | Shows |
|---|---|---|
| Postgres | `pg_stat_activity` sampled every 10 ms, `pg_stat_wal` with `track_wal_io_timing` | What app connections do: run SQL, wait on WAL or locks, or sit idle waiting for the JVM; WAL syncs per commit and ms per sync |
| VM kernel | `/proc/stat`, `/proc/pressure/{cpu,io}`, `vmstat`, `/proc/<pid>/stat` | CPU split incl. iowait and steal; time tasks waited for the CPU or for I/O; run queue; CPU per process name (java, postgres, docker-proxy, kernel threads) |
| JVM | async-profiler wall-clock profile | What the Tomcat request threads wait on (pool, Postgres reply, CPU) |

It runs k6 with `taskset` itself, turns `track_wal_io_timing` on only for the run, and saves `summary.md`
plus the raw files in `results/diagnose/<date>-<test>-<rate>rps/`. The sampler and the wall profiler
use a little of the VM's CPU, so run it below capacity, not for capacity numbers.

## Reading the results

**Capacity runs** vary by about ±4% with no code change. Near the limit the result is also sensitive to
luck: one burst (GC, a batch of cache misses) can start a queue that the backend cannot drain. Treat single-run differences under about 10% with care, and use
capacity runs for large changes and final numbers.

**Profiles** are far more precise for small optimizations:

- **Total samples** in `top.txt` measure the CPU used for the same work. Fewer samples means cheaper
  requests (for example 22,607 → 19,838 is 12% less CPU per request).
- **CPU by layer** counts each sample once, under the innermost layer doing the work. Percentages are
  shares of the total, so when one layer shrinks the others' shares grow without changing.
- **Socket I/O** is time spent in system calls moving bytes; it only shrinks with fewer round trips.

**Bottlenecks** show up in the run file:

- *Hardware bound*: the VM sits at its CPU limit (VM CPU near 1) while the time goes into real work.
- *Software bound*: latency breaks the target with CPU to spare. The time breakdown shows where requests
  wait (queue, connection pool) and the saturation table shows which resource is full.
- The overloaded steps show the raw maximum throughput at 100% CPU. The stable rate is usually 90–93% of
  it; going beyond that gap requires making each request cheaper.

## Files

| Path | Description |
|---|---|
| `write.js` | k6 write scenario |
| `read.js` | k6 read scenario |
| `seed-read.sh`, `seed-read.sql` | Seed the read dataset and export its codes to `data/` |
| `find-capacity.mjs` | Capacity search; writes `results/RESULTS.md` and `results/runs/` |
| `profile.sh` | CPU profiling with async-profiler; writes `results/profiles/` |
| `diagnose.sh` | Time breakdown from Postgres, the VM kernel and the JVM; writes `results/diagnose/` |
| `results/RESULTS.md` | History of all capacity runs, one table per test (in git) |
| `results/runs/` | Per run: every step with latency, time breakdown and saturation (git-ignored) |
| `results/profiles/` | Per profile: flame graph and summaries (git-ignored) |
| `data/` | Codes of the seeded links used by `read.js` (git-ignored) |
| `../monitoring/` | Prometheus scrape config (VM backend, exporter, LXD) and `pg_stat_statements` setup |
