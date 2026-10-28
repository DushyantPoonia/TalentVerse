import test from 'node:test';
import assert from 'node:assert/strict';
import { getLatestAssessment } from './dashboardData.js';

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
