import test from 'node:test';
import assert from 'node:assert/strict';
import { getLatestAssessment, loadDashboardData } from './dashboardData.js';

test('dashboard data keeps successful sections available when another request fails', async () => {
  const data = await loadDashboardData({
    getUser: async () => ({ user: { name: 'Taylor' } }),
    getHistory: async () => { throw new Error('History unavailable'); },
    getProfile: async () => ({ profile: { goal: 'Build a portfolio' } })
  });

  assert.equal(data.user.name, 'Taylor');
  assert.deepEqual(data.history, []);
  assert.deepEqual(data.profile, { goal: 'Build a portfolio' });
  assert.equal(data.errors.history.message, 'History unavailable');
  assert.equal(data.errors.user, null);
});

test('dashboard refresh preserves previously loaded history when the refresh fails', async () => {
  const previousHistory = [{ _id: 'saved-roadmap' }];
  const rateLimitError = new Error('Too many requests. Please wait a moment before trying again.');
  rateLimitError.status = 429;
  rateLimitError.retryAfterMs = 1500;
  const data = await loadDashboardData({
    getUser: async () => ({ user: { name: 'Taylor' } }),
    getHistory: async () => { throw rateLimitError; },
    getProfile: async () => ({ profile: {} }),
    initialHistory: previousHistory
  });

  assert.equal(data.history, previousHistory);
  assert.equal(data.errors.history.status, 429);
  assert.equal(data.errors.history.retryAfterMs, 1500);
  assert.match(data.errors.history.message, /Too many requests/);
});

test('dashboard data preserves the next assessment history offset', async () => {
  const data = await loadDashboardData({
    getUser: async () => ({ user: { name: 'Taylor' } }),
    getHistory: async () => ({ assessments: [{ _id: 'history-1' }], nextOffset: 50 }),
    getProfile: async () => ({ profile: {} })
  });

  assert.equal(data.history.length, 1);
  assert.equal(data.historyNextOffset, 50);
});

test('dashboard reads the latest flat history record and its roadmap data', () => {
  const latest = getLatestAssessment([{
    readiness: { score: 60, explanation: 'Self-reported skill match.' },
    skillGaps: [{ skill: 'SQL', priority: 'high' }],
    roadmap: [{ week: 1, tasks: ['Practice SQL'] }],
    projects: [{ title: 'Data story', skills: ['SQL'] }],
    assessment: { targetCareer: 'Data Analyst' }
  }]);

  assert.equal(latest.readiness.score, 60);
  assert.equal(latest.skillGaps[0].skill, 'SQL');
  assert.deepEqual(latest.roadmap[0].tasks, ['Practice SQL']);
  assert.deepEqual(latest.projects[0].skills, ['SQL']);
  assert.equal(latest.assessment.targetCareer, 'Data Analyst');
});

test('dashboard safely handles empty history and missing optional analysis fields', () => {
  assert.equal(getLatestAssessment([]), null);
  assert.equal(getLatestAssessment(null), null);
  assert.deepEqual(getLatestAssessment([{}]), {
    readiness: null,
    skillGaps: [],
    roadmap: [],
    projects: []
  });
  assert.deepEqual(getLatestAssessment([{
    readiness: null,
    skillGaps: null,
    roadmap: [{ week: 1, tasks: null }],
    projects: [{ title: 'Project', skills: null }]
  }]), {
    readiness: null,
    skillGaps: [],
    roadmap: [{ week: 1, tasks: [] }],
    projects: [{ title: 'Project', skills: [] }]
  });
});
