// Write test: POST /api/urls (anonymous) at one fixed rate.
// Normally driven by find-capacity.mjs, which picks RATE and DURATION for each step:
//   node loadtest/find-capacity.mjs write
//
// Single run by hand:
//   RATE=200 DURATION=1m k6 run loadtest/write.js
//
// Env: RATE (req/s, default 50), DURATION (default 1m), BASE_URL (default http://localhost:4000)

import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const RATE = Number(__ENV.RATE || 50);

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  scenarios: {
    write: {
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

export default function () {
  const id = exec.scenario.iterationInTest;
  const body = JSON.stringify({
    originalUrl: `https://example.com/articles/2026/10/load-test-article-number-${id}?utm_source=k6`,
  });

  const res = http.post(`${BASE_URL}/api/urls`, body, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'create' },
  });

  check(res, { 'status is 201': (r) => r.status === 201 });
}
