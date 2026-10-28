import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistoryClient, parseRetryAfter } from './historyRequests.js';

test('parses Retry-After as seconds or an HTTP date', () => {
  assert.equal(parseRetryAfter('3'), 3000);
  assert.equal(parseRetryAfter('Thu, 01 Jan 1970 00:00:05 GMT', 1000), 4000);
  assert.equal(parseRetryAfter('invalid'), null);
});

test('deduplicates concurrent history requests and reuses successful results', async () => {
  let calls = 0;
  let resolveRequest;
  const client = createHistoryClient(() => {
    calls += 1;
    return new Promise((resolve) => { resolveRequest = resolve; });
  });

  const first = client.get('account-token');
  const second = client.get('account-token');
  await Promise.resolve();
  assert.equal(calls, 1);
  resolveRequest({ assessments: [{ _id: 'roadmap-a' }], nextOffset: null });
  assert.deepEqual(await first, await second);
  assert.deepEqual(await client.get('account-token'), { assessments: [{ _id: 'roadmap-a' }], nextOffset: null });
  assert.equal(calls, 1);
});

test('a forced manual retry makes one fresh request and does not loop on 429', async () => {
  let calls = 0;
  const client = createHistoryClient(async () => {
    calls += 1;
    if (calls === 1) {
      const error = new Error('Too many requests. Please try again shortly.');
      error.status = 429;
      error.retryAfterMs = 1200;
      throw error;
    }
    return { assessments: [{ _id: 'roadmap-a' }], nextOffset: null };
  });

  await assert.rejects(client.get('account-token'), (error) => error.status === 429 && error.retryAfterMs === 1200);
  assert.equal(calls, 1);
  const refreshed = await client.get('account-token', 0, { refresh: true });
  assert.equal(refreshed.assessments[0]._id, 'roadmap-a');
  assert.equal(calls, 2);
});

test('a failed refresh leaves the previous successful history available', async () => {
  let calls = 0;
  const savedHistory = { assessments: [{ _id: 'roadmap-a' }], nextOffset: null };
  const client = createHistoryClient(async () => {
    calls += 1;
    if (calls === 1) return savedHistory;
    const error = new Error('Too many requests.');
    error.status = 429;
    throw error;
  });

  assert.equal(await client.get('account-token'), savedHistory);
  await assert.rejects(client.get('account-token', 0, { refresh: true }), (error) => error.status === 429);
  assert.equal(await client.get('account-token'), savedHistory);
  assert.equal(calls, 2);
});

test('does not automatically retry permanent client or authorization failures', async () => {
  for (const status of [400, 401, 403, 404]) {
    let calls = 0;
    const client = createHistoryClient(async () => {
      calls += 1;
      const error = new Error('Request denied');
      error.status = status;
      throw error;
    });

    await assert.rejects(client.get(`account-token-${status}`), (error) => error.status === status);
    assert.equal(calls, 1);
  }
});

test('history requests use only the saved-assessments read endpoint', async () => {
  const paths = [];
  const client = createHistoryClient(async (_token, offset) => {
    paths.push(`/api/assessments?offset=${offset}`);
    return { assessments: [], nextOffset: null };
  });

  await client.get('account-token', 50);
  assert.deepEqual(paths, ['/api/assessments?offset=50']);
});
