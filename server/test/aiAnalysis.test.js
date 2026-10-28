import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCareerAnalysis } from '../src/services/aiAnalysis.js';

const validAnalysis = {
  suggestedPaths: [{ title: 'Data analyst', explanation: 'A practical path.' }],
  currentSkills: ['SQL'],
  skillGaps: [{ skill: 'Visualization', priority: 'medium', reason: 'Build more practice.' }],
  nextSteps: ['Practice chart selection.'],
  projects: [{ title: 'Portfolio dashboard', description: 'Build a dashboard.', skills: ['SQL'] }],
  roadmap: [{ week: 1, theme: 'Foundations', tasks: ['Review SQL'], estimatedHours: 3 }],
  readiness: { explanation: 'This is a limited skill-match estimate.' }
};

async function withMockedProvider({ status, body, baseUrl, model, responses, randomValue, clockAdvanceAfterRequest }, run) {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const originalRandom = Math.random;
  const originalKey = process.env.LLM_API_KEY;
  const originalBaseUrl = process.env.LLM_BASE_URL;
  const originalModel = process.env.LLM_MODEL;
  const originalConsoleError = console.error;
  const logs = [];
  let requestUrl;
  let requestOptions;
  let requestCount = 0;
  let clockElapsed = 0;
  const responseQueue = responses || [{ status, body }];

  process.env.LLM_API_KEY = 'test-key-not-a-real-secret';
  if (baseUrl === undefined) delete process.env.LLM_BASE_URL;
  else process.env.LLM_BASE_URL = baseUrl;
  if (model === undefined) delete process.env.LLM_MODEL;
  else process.env.LLM_MODEL = model;
  if (randomValue !== undefined) Math.random = () => randomValue;
  if (clockAdvanceAfterRequest !== undefined) {
    Date.now = () => originalNow() + clockElapsed;
  }
  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    const response = responseQueue[Math.min(requestCount, responseQueue.length - 1)];
    requestCount += 1;
    if (clockAdvanceAfterRequest !== undefined) clockElapsed += clockAdvanceAfterRequest;
    return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  };
  console.error = (message) => logs.push(String(message));

  try {
    await run({
      logs,
      get requestCount() { return requestCount; },
      get requestUrl() { return requestUrl; },
      get requestBody() { return JSON.parse(requestOptions.body); },
      get requestOptions() { return requestOptions; }
    });
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
    Math.random = originalRandom;
    console.error = originalConsoleError;
    if (originalKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = originalKey;
    if (originalBaseUrl === undefined) delete process.env.LLM_BASE_URL;
    else process.env.LLM_BASE_URL = originalBaseUrl;
    if (originalModel === undefined) delete process.env.LLM_MODEL;
    else process.env.LLM_MODEL = originalModel;
  }
}

test('quota-related 429 logs sanitized provider details and returns actionable guidance', async () => {
  await withMockedProvider({
    status: 429,
    body: JSON.stringify({
      error: {
        message: 'You exceeded your current quota with test-key-not-a-real-secret.',
        type: 'insufficient_quota',
        code: 'insufficient_quota',
        metadata: { billing_limit: 0 }
      }
    })
  }, async ({ logs }) => {
    await assert.rejects(
      generateCareerAnalysis({ goal: 'private assessment data' }, []),
      (error) => error.status === 429 && error.expose === true && /quota.*billing/i.test(error.message)
    );
    assert.match(logs[0], /status=429/);
    assert.match(logs[0], /code=insufficient_quota/);
    assert.match(logs[0], /type=insufficient_quota/);
    assert.match(logs[0], /billing_limit=0/);
    assert.doesNotMatch(logs[0], /private assessment data|test-key-not-a-real-secret/);
  });
});

test('rate-limit 429 suggests waiting before retrying', async () => {
  await withMockedProvider({
    status: 429,
    body: JSON.stringify({ error: { message: 'Too many requests; rate limit exceeded.', type: 'requests', code: 'rate_limit_exceeded' } })
  }, async ({ logs }) => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 429 && error.expose === true && /rate-limiting.*wait/i.test(error.message)
    );
    assert.match(logs[0], /code=rate_limit_exceeded/);
  });
});

test('unknown 429 cause gets a neutral message', async () => {
  await withMockedProvider({
    status: 429,
    body: JSON.stringify({ error: { message: 'Request could not be processed.' } })
  }, async () => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 429 && /could not process.*try again later/i.test(error.message)
    );
  });
});

test('other provider errors log diagnostics but expose only a generic message', async () => {
  await withMockedProvider({
    status: 500,
    body: JSON.stringify({ error: { message: 'Internal provider detail', type: 'server_error', code: 'internal_error' } })
  }, async ({ logs }) => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 503 && error.expose === true && /temporarily unavailable.*try again shortly/i.test(error.message)
    );
    assert.match(logs[0], /message=Internal provider detail/);
  });
});

test('malformed provider error body does not crash or leak its contents', async () => {
  await withMockedProvider({ status: 429, body: 'not-json private provider response' }, async ({ logs }) => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 429 && /could not process.*try again later/i.test(error.message)
    );
    assert.match(logs[0], /code=unavailable type=unavailable message=unavailable/);
    assert.doesNotMatch(logs[0], /private provider response/);
  });
});

test('successful Gemini analysis uses normalized endpoint, model, JSON mode and validated output', async () => {
  await withMockedProvider({
    status: 200,
    body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }),
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai///',
    model: 'gemini-3.8-flash'
  }, async (state) => {
    const assessment = { goal: 'career direction' };
    const requirements = ['SQL'];
    const result = await generateCareerAnalysis(assessment, requirements);
    assert.deepEqual(result, validAnalysis);
    assert.equal(state.requestUrl, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
    assert.equal(state.requestBody.model, 'gemini-3.8-flash');
    assert.equal(state.requestBody.reasoning_effort, 'low');
    assert.deepEqual(state.requestBody.response_format, { type: 'json_object' });
    assert.equal('temperature' in state.requestBody, false);
    assert.equal(state.requestBody.messages[1].content.includes(JSON.stringify(assessment)), true);
    assert.equal(state.requestBody.messages[1].content.includes(JSON.stringify(requirements)), true);
    assert.deepEqual(state.logs, []);
  });
});

test('Gemini endpoint is appended only once when the configured URL already includes it', async () => {
  await withMockedProvider({
    status: 200,
    body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }),
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions/'
  }, async (state) => {
    await generateCareerAnalysis({}, []);
    assert.equal(state.requestUrl, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
  });
});

test('successful analysis defaults to the documented Gemini endpoint and model', async () => {
  await withMockedProvider({
    status: 200,
    body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] })
  }, async (state) => {
    await generateCareerAnalysis({}, []);
    assert.equal(state.requestUrl, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
    assert.equal(state.requestBody.model, 'gemini-3.8-flash');
  });
});

test('Gemini authentication failures return actionable safe guidance', async () => {
  await withMockedProvider({
    status: 401,
    body: JSON.stringify({ error: { message: 'Invalid API key: test-key-not-a-real-secret', status: 'UNAUTHENTICATED' } })
  }, async ({ logs }) => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 503 && error.expose === true && /Gemini API authentication or access failed/.test(error.message)
    );
    assert.doesNotMatch(logs[0], /test-key-not-a-real-secret/);
  });
});

test('unavailable Gemini model returns actionable configuration guidance', async () => {
  await withMockedProvider({
    status: 404,
    body: JSON.stringify({ error: { message: 'Model gemini-invalid is not found.', status: 'NOT_FOUND' } })
  }, async () => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 503 && error.expose === true && /configured Gemini model is unavailable/.test(error.message)
    );
  });
});

test('network failures and timeouts retain safe provider messages', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.LLM_API_KEY;
  const originalConsoleError = console.error;
  const logs = [];
  process.env.LLM_API_KEY = 'test-key-not-a-real-secret';
  console.error = (message) => logs.push(String(message));
  try {
    globalThis.fetch = async () => { throw new Error('socket failure'); };
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 502 && error.expose === true && /Could not reach the career analysis provider/.test(error.message)
    );
    globalThis.fetch = async () => { const error = new Error('timed out'); error.name = 'TimeoutError'; throw error; };
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 502 && error.expose === true && /Career analysis timed out/.test(error.message)
    );
    assert.match(logs[0], /AI provider network error model=gemini-3.8-flash host=generativelanguage\.googleapis\.com elapsedMs=\d+ error=Error/);
    assert.match(logs[1], /AI provider timeout model=gemini-3.8-flash host=generativelanguage\.googleapis\.com elapsedMs=\d+ error=TimeoutError/);
    assert.doesNotMatch(logs.join(' '), /test-key-not-a-real-secret/);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = originalKey;
  }
});

test('transient 503 retries once and succeeds without changing output validation', async () => {
  await withMockedProvider({
    responses: [
      { status: 503, body: JSON.stringify({ error: { code: 'unavailable', message: 'Temporary provider overload.' } }) },
      { status: 200, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }) }
    ],
    randomValue: 0
  }, async (state) => {
    const result = await generateCareerAnalysis({}, []);
    assert.deepEqual(result, validAnalysis);
    assert.equal(state.requestCount, 2);
    assert.match(state.logs[0], /status=503.*code=unavailable.*message=Temporary provider overload/);
  });
});

test('repeated transient failures stop after two retries and return temporary unavailability', async () => {
  const unavailable = { status: 503, body: JSON.stringify({ error: { code: 'unavailable', message: 'Temporarily overloaded.' } }) };
  await withMockedProvider({
    responses: [unavailable, unavailable, unavailable, unavailable],
    randomValue: 0
  }, async (state) => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 503 && error.expose === true && /temporarily unavailable/i.test(error.message)
    );
    assert.equal(state.requestCount, 3);
    assert.equal(state.logs.length, 4);
  });
});

test('does not start a retry when the overall deadline has insufficient time remaining', async () => {
  await withMockedProvider({
    responses: [
      { status: 503, body: JSON.stringify({ error: { code: 'unavailable', message: 'Temporary outage.' } }) },
      { status: 200, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }) }
    ],
    randomValue: 0,
    clockAdvanceAfterRequest: 44_500
  }, async (state) => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 503 && /temporarily unavailable/i.test(error.message)
    );
    assert.equal(state.requestCount, 1);
    assert.match(state.logs[0], /elapsedMs=445\d{2}/);
  });
});

test('non-retryable authentication and malformed-request errors are not retried', async () => {
  for (const response of [
    { status: 401, body: JSON.stringify({ error: { status: 'UNAUTHENTICATED', message: 'Invalid key.' } }) },
    { status: 400, body: JSON.stringify({ error: { status: 'INVALID_ARGUMENT', message: 'Malformed request.' } }) }
  ]) {
    await withMockedProvider({ responses: [response], randomValue: 0 }, async (state) => {
      await assert.rejects(generateCareerAnalysis({}, []));
      assert.equal(state.requestCount, 1);
    });
  }
});

test('transient status with exhausted quota is not retried', async () => {
  await withMockedProvider({
    responses: [
      { status: 503, body: JSON.stringify({ error: { code: 'RESOURCE_EXHAUSTED', message: 'Quota exhausted.' } }) },
      { status: 200, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }) }
    ]
  }, async (state) => {
    await assert.rejects(generateCareerAnalysis({}, []));
    assert.equal(state.requestCount, 1);
  });
});

test('transient status with malformed-request or invalid-model diagnostics is not retried', async () => {
  for (const response of [
    { status: 503, body: JSON.stringify({ error: { code: 'INVALID_ARGUMENT', message: 'Malformed request body.' } }) },
    { status: 503, body: JSON.stringify({ error: { code: 'MODEL_NOT_FOUND', message: 'Configured model not found.' } }) }
  ]) {
    await withMockedProvider({
      responses: [
        response,
        { status: 200, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(validAnalysis) } }] }) }
      ],
      randomValue: 0
    }, async (state) => {
      await assert.rejects(generateCareerAnalysis({}, []));
      assert.equal(state.requestCount, 1);
    });
  }
});

test('malformed successful provider responses are rejected without bypassing schema validation', async () => {
  await withMockedProvider({ status: 200, body: 'not-json' }, async () => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 502 && /invalid response/.test(error.message)
    );
  });
  await withMockedProvider({
    status: 200,
    body: JSON.stringify({ choices: [{ message: { content: '{"suggestedPaths":[]}' } }] })
  }, async () => {
    await assert.rejects(
      generateCareerAnalysis({}, []),
      (error) => error.status === 502 && /could not be validated/.test(error.message)
    );
  });
});
