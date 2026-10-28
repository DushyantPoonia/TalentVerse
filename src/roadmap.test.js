import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoadmapCards, getRoadmapTaskKey, normalizeCompletedTasks, summarizeRoadmap } from './roadmap.js';

const roadmap = [
  { week: 1, theme: 'Foundations', tasks: ['Practice SQL', 'Review joins'] },
  { week: 2, theme: 'Portfolio', tasks: ['Build a dashboard'] }
];

test('roadmap task identifiers remain unique and deterministic', () => {
  assert.equal(getRoadmapTaskKey(roadmap[0], 0, 0), 'week-1:item-0:task-0');
  assert.notEqual(getRoadmapTaskKey(roadmap[0], 0, 0), getRoadmapTaskKey(roadmap[0], 0, 1));
  assert.notEqual(getRoadmapTaskKey(roadmap[0], 0, 0), getRoadmapTaskKey(roadmap[1], 1, 0));
});

test('legacy saved task keys normalize to stable roadmap identifiers', () => {
  assert.deepEqual(normalizeCompletedTasks(roadmap, ['week-1:Practice SQL']), ['week-1:item-0:task-0']);
});

test('roadmap metrics are based on saved tasks and selected-roadmap completion', () => {
  assert.deepEqual(summarizeRoadmap(roadmap, [
    'week-1:item-0:task-0',
    'week-1:item-0:task-1'
  ]), {
    tasks: [
      { key: 'week-1:item-0:task-0', weekIndex: 0, week: 1, theme: 'Foundations', title: 'Practice SQL', description: '' },
      { key: 'week-1:item-0:task-1', weekIndex: 0, week: 1, theme: 'Foundations', title: 'Review joins', description: '' },
      { key: 'week-2:item-1:task-0', weekIndex: 1, week: 2, theme: 'Portfolio', title: 'Build a dashboard', description: '' }
    ],
    completedCount: 2,
    remainingCount: 1,
    totalCount: 3,
    percentage: 67
  });
  assert.deepEqual(summarizeRoadmap([], []), {
    tasks: [],
    completedCount: 0,
    remainingCount: 0,
    totalCount: 0,
    percentage: 0
  });
});

test('roadmap library entries use saved records and stable assessment IDs', () => {
  const cards = getRoadmapCards([
    { _id: 'assessment-a', assessment: { targetCareer: 'Data Analyst' }, readiness: { score: 60 }, skillGaps: [{}], projects: [{}, {}] },
    { _id: 'assessment-b', suggestedPaths: [{ title: 'Product Designer' }], readiness: { score: 72 } },
    { assessment: { targetCareer: 'Unstored record' } }
  ]);

  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map(({ id, route, title, readiness }) => ({ id, route, title, readiness })), [
    { id: 'assessment-a', route: '/dashboard/assessments/assessment-a', title: 'Data Analyst', readiness: 60 },
    { id: 'assessment-b', route: '/dashboard/assessments/assessment-b', title: 'Product Designer', readiness: 72 }
  ]);
  assert.equal(cards[0].skillGapCount, 1);
  assert.equal(cards[0].projectCount, 2);
  assert.deepEqual(getRoadmapCards([]), []);
});
