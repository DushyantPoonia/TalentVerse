import test from 'node:test';
import assert from 'node:assert/strict';
import { createListAssessmentsHandler, createRoadmapHandlers } from '../src/controllers/assessmentController.js';
import { getRoadmapTaskKey, normalizeCompletedTasks } from '../src/utils/roadmapProgress.js';

const analysisId = '507f1f77bcf86cd799439011';
const ownerId = '507f191e810c19729de860ea';
const otherOwnerId = '507f1f77bcf86cd799439012';
const roadmap = [{ week: 1, tasks: ['Practice SQL', 'Review joins'] }];
const analysis = { _id: analysisId, roadmap, assessment: { targetCareer: 'Data Analyst' } };

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('normalizes legacy completed-task keys and retains stable identifiers', () => {
  assert.deepEqual(normalizeCompletedTasks(roadmap, [
    'week-1:Practice SQL',
    getRoadmapTaskKey(roadmap[0], 0, 1)
  ]), [
    getRoadmapTaskKey(roadmap[0], 0, 0),
    getRoadmapTaskKey(roadmap[0], 0, 1)
  ]);
  assert.equal(normalizeCompletedTasks(roadmap, ['not-a-roadmap-task']), null);
});

test('assessment history pagination scopes to the owner and exposes the next offset', async () => {
  let query;
  const handler = createListAssessmentsHandler({
    findAssessments: async (userId, offset, limit) => {
      query = { userId, offset, limit };
      return Array.from({ length: 51 }, (_, index) => ({
        _id: `assessment-${index}`,
        assessment: { targetCareer: 'Data Analyst' }
      }));
    }
  });
  const res = responseRecorder();
  await handler({ query: { offset: '50' }, user: { _id: ownerId } }, res);

  assert.deepEqual(query, { userId: ownerId, offset: 50, limit: 51 });
  assert.equal(res.body.assessments.length, 50);
  assert.equal(res.body.nextOffset, 100);
});

test('assessment history pagination rejects invalid offsets', async () => {
  let queried = false;
  const handler = createListAssessmentsHandler({ findAssessments: async () => { queried = true; return []; } });
  const res = responseRecorder();
  await handler({ query: { offset: '-1' }, user: { _id: ownerId } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(queried, false);
});

test('assessment retrieval scopes the lookup to the authenticated owner', async () => {
  let lookup;
  const handlers = createRoadmapHandlers({
    findAssessment: async (id, userId) => {
      lookup = { id, userId };
      return userId === ownerId ? analysis : null;
    }
  });
  const res = responseRecorder();
  await handlers.getAssessment({ params: { id: analysisId }, user: { _id: ownerId } }, res);

  assert.deepEqual(lookup, { id: analysisId, userId: ownerId });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.analysis._id, analysisId);
  const otherResponse = responseRecorder();
  await handlers.getAssessment({ params: { id: analysisId }, user: { _id: otherOwnerId } }, otherResponse);
  assert.equal(otherResponse.statusCode, 404);
});

test('missing assessments return not found and do not expose another account', async () => {
  const handlers = createRoadmapHandlers({ findAssessment: async () => null });
  const res = responseRecorder();
  await handlers.getAssessment({ params: { id: analysisId }, user: { _id: ownerId } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Assessment was not found.' });
});

test('invalid assessment identifiers return a client error without querying storage', async () => {
  let queried = false;
  const handlers = createRoadmapHandlers({ findAssessment: async () => { queried = true; } });
  const res = responseRecorder();
  await handlers.getAssessment({ params: { id: 'invalid' }, user: { _id: ownerId } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(queried, false);
});

test('progress reads are owner-scoped and return normalized completion state', async () => {
  const lookups = [];
  const handlers = createRoadmapHandlers({
    findRoadmap: async (id, userId) => {
      lookups.push(['analysis', id, userId]);
      return analysis;
    },
    findProgress: async (id, userId) => {
      lookups.push(['progress', id, userId]);
      return { completedTasks: ['week-1:Practice SQL'] };
    }
  });
  const res = responseRecorder();
  await handlers.getProgress({ params: { id: analysisId }, user: { _id: ownerId } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.progress.completedTasks, [getRoadmapTaskKey(roadmap[0], 0, 0)]);
  assert.deepEqual(lookups, [['analysis', analysisId, ownerId], ['progress', analysisId, ownerId]]);
});

test('progress updates reject task keys outside the owned roadmap', async () => {
  let saved = false;
  const handlers = createRoadmapHandlers({
    findRoadmap: async () => analysis,
    saveProgress: async () => { saved = true; }
  });
  const res = responseRecorder();
  await handlers.updateProgress({
    params: { id: analysisId },
    user: { _id: ownerId },
    body: { completedTasks: ['another-users-task'] }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'Completed tasks must belong to this roadmap.' });
  assert.equal(saved, false);
});

test('progress updates return not found when the assessment is missing', async () => {
  let saved = false;
  const handlers = createRoadmapHandlers({
    findRoadmap: async () => null,
    saveProgress: async () => { saved = true; }
  });
  const res = responseRecorder();
  await handlers.updateProgress({
    params: { id: analysisId },
    user: { _id: ownerId },
    body: { completedTasks: [] }
  }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Roadmap was not found.' });
  assert.equal(saved, false);
});

test('progress updates persist normalized IDs under the authenticated owner and selected analysis', async () => {
  let saved;
  const handlers = createRoadmapHandlers({
    findRoadmap: async (id, userId) => {
      assert.equal(id, analysisId);
      assert.equal(userId, ownerId);
      return analysis;
    },
    saveProgress: async (id, userId, completedTasks) => {
      saved = { id, userId, completedTasks };
      return { analysis: id, completedTasks };
    }
  });
  const taskKey = getRoadmapTaskKey(roadmap[0], 0, 1);
  const res = responseRecorder();
  await handlers.updateProgress({
    params: { id: analysisId },
    user: { _id: ownerId },
    body: { completedTasks: [taskKey] }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(saved, { id: analysisId, userId: ownerId, completedTasks: [taskKey] });
  assert.deepEqual(res.body.progress.completedTasks, [taskKey]);
});
