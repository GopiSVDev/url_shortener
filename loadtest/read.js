// Read test: GET /{code} (redirect) at one fixed rate, on the dataset from seed-read.sh.
// Normally driven by find-capacity.mjs, which picks RATE and DURATION for each step:
//   loadtest/seed-read.sh
//   node loadtest/find-capacity.mjs read
//
// Single run by hand:
//   RATE=200 DURATION=1m k6 run loadtest/read.js
//
// Request mix:
//   97% live links, Zipf distributed (s = 1): the top 1,000 links get ~50% of requests,
//       the top 10,000 ~67%, like real shortener traffic where a few links are hot  -> 302
//    2% unknown codes, from a fixed pool of 10,000 (8 chars, seeded codes are 7)  -> 404
//    1% expired links, uniform                                                     -> 410
//
// Env: RATE (req/s, default 50), DURATION (default 1m), BASE_URL (default http://localhost:4000)

import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const RATE = Number(__ENV.RATE || 50);

const lines = (file) => open(file).split('\n').filter((l) => l.length > 0);
const live = new SharedArray('live', () => lines('./data/live-codes.txt'));
const expired = new SharedArray('expired', () => lines('./data/expired-codes.txt'));
const MISSING_POOL = 10000;

export const options = {
  discardResponseBodies: true,
  maxRedirects: 0,
  // No 'url' tag: one series per code would flood Prometheus. Requests are grouped by 'name'.
  systemTags: ['status', 'method', 'name', 'group', 'check', 'error', 'error_code', 'scenario', 'expected_response'],
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  scenarios: {
    read: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: __ENV.DURATION || '1m',
      // VUs needed = rate x latency. Enough for ~2s latency; beyond that k6 drops
      // iterations, which find-capacity counts as a failed step.
      preAllocatedVUs: Math.ceil(RATE * 0.5) + 10,
      maxVUs: RATE * 2 + 50,
    },
  },
};

// Zipf with s = 1 over n items: P(rank <= r) ~ ln r / ln n, so rank = n^u for uniform u.
function zipfIndex(n) {
  return Math.min(Math.floor(Math.pow(n, Math.random())), n) - 1;
}

export default function () {
  const roll = Math.random();
  let code;
  let expected;
  if (roll < 0.97) {
    code = live[zipfIndex(live.length)];
    expected = 302;
  } else if (roll < 0.99) {
    code = 'm' + String(Math.floor(Math.random() * MISSING_POOL)).padStart(7, '0');
    expected = 404;
  } else {
    code = expired[Math.floor(Math.random() * expired.length)];
    expected = 410;
  }

  // Only the status this code should get counts as success (e.g. a 404 for a live code is an error).
  // Redirects are not followed (maxRedirects: 0).
  const res = http.get(`${BASE_URL}/${code}`, {
    tags: { name: 'redirect' },
    responseCallback: http.expectedStatuses(expected),
  });
  check(res, { 'expected status': (r) => r.status === expected });
}
