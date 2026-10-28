import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeAssessmentHistory } from '../src/utils/assessmentHistory.js';

test('assessment history response keeps analysis fields flat with the populated assessment nested', () => {
  const analysis = {
    _id: 'analysis-id',
    readiness: { score: 60, explanation: 'Self-reported skill match.' },
    skillGaps: [{ skill: 'SQL', priority: 'high', reason: 'Role requirement.' }],
    roadmap: [{ week: 1, theme: 'Foundations', tasks: ['Practice SQL'], estimatedHours: 3 }],
    projects: [{ title: 'Data story', description: 'Build a dashboard.', skills: ['SQL'] }],
    assessment: { targetCareer: 'Data Analyst' }
  };

  const [record] = serializeAssessmentHistory([analysis]);

  assert.equal(record._id, 'analysis-id');
  assert.equal(record.readiness.score, 60);
  assert.equal(record.skillGaps[0].skill, 'SQL');
  assert.equal(record.roadmap[0].theme, 'Foundations');
  assert.equal(record.projects[0].title, 'Data story');
  assert.deepEqual(record.assessment, { targetCareer: 'Data Analyst' });
  assert.equal(Object.hasOwn(record, 'analysis'), false);
});

test('assessment history serializer preserves empty history', () => {
  assert.deepEqual(serializeAssessmentHistory([]), []);
});
