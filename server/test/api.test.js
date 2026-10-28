import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import app from '../src/app.js';
import { asyncHandler } from '../src/middleware/asyncHandler.js';
import { errorHandler } from '../src/middleware/errors.js';
import { createAssessmentHandler } from '../src/controllers/assessmentController.js';

test('assessment endpoints require an authenticated account', async (t) => {
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Sign in to continue.' });
});

test('malformed registration returns the existing validation response', async (t) => {
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x', email: 'not-an-email', password: 'short' })
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.message, 'Please check the provided information.');
  assert.deepEqual(body.details.map(({ field }) => field).sort(), ['email', 'name', 'password']);
});

test('unexpected async route errors reach middleware without exposing details', async (t) => {
  const testApp = express();
  testApp.get('/test', asyncHandler(async () => {
    throw new Error('internal test detail');
  }));
  testApp.use(errorHandler);

  const server = testApp.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/test`);

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: 'Something went wrong. Please try again later.' });
});

test('invalid assessment is rejected before AI analysis or persistence', async (t) => {
  let aiCalls = 0;
  let persistenceCalls = 0;
  const handler = createAssessmentHandler({
    generateAnalysis: async () => { aiCalls += 1; },
    saveAssessment: async () => { persistenceCalls += 1; }
  });
  const testApp = express();
  testApp.use(express.json());
  testApp.post('/api/assessments', asyncHandler(handler));
  testApp.use(errorHandler);

  const server = testApp.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetCareer: 'Data Analyst',
      experience: 'Just getting started',
      education: 'Undergraduate',
      skills: ['SQL'],
      goal: 'Build practical skills',
      targetRegion: 'Remote',
      weeklyHours: 41,
      projects: ''
    })
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'Please check the provided information.');
  assert.equal(aiCalls, 0);
  assert.equal(persistenceCalls, 0);
});
