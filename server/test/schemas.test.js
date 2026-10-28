import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentSchema, loginSchema, registerSchema } from '../src/validators/schemas.js';
import { calculateReadiness, generateCareerAnalysis } from '../src/services/aiAnalysis.js';
import { getCareerRequirements } from '../src/config/careerSkills.js';
import Assessment from '../src/models/Assessment.js';

test('registration rejects short passwords and malformed email', () => {
  assert.equal(registerSchema.safeParse({ name: 'Alex Doe', email: 'alex@example.com', password: 'securepass' }).success, true);
  assert.equal(registerSchema.safeParse({ name: 'A', email: 'not-an-email', password: 'short' }).success, false);
});

test('login requires a valid email and an eight-character password', () => {
  assert.equal(loginSchema.safeParse({ email: 'alex@example.com', password: 'securepass' }).success, true);
  assert.equal(loginSchema.safeParse({ email: 'bad', password: '1234567' }).success, false);
});

test('assessment validation checks required fields and bounded learning time', () => {
  const valid = { targetCareer: 'Data Analyst', experience: 'Just getting started', education: 'Undergraduate', skills: ['SQL'], goal: 'Land my first role', targetRegion: 'Remote', weeklyHours: 5, projects: 'A class dashboard' };
  assert.equal(assessmentSchema.safeParse(valid).success, true);
  assert.equal(assessmentSchema.safeParse({ ...valid, weeklyHours: 41 }).success, false);
  assert.equal(assessmentSchema.safeParse({ ...valid, skills: [] }).success, false);
});

test('assessment projects are optional and omitted or blank values normalize consistently', () => {
  const valid = { targetCareer: 'Data Analyst', experience: 'Just getting started', education: 'Undergraduate', skills: ['SQL'], goal: 'Land my first role', targetRegion: 'Remote', weeklyHours: 5 };
  assert.equal(assessmentSchema.parse(valid).projects, '');
  assert.equal(assessmentSchema.parse({ ...valid, projects: '   ' }).projects, '');
  assert.equal(assessmentSchema.parse({ ...valid, projects: 'A class dashboard' }).projects, 'A class dashboard');
  assert.equal(assessmentSchema.safeParse({ ...valid, projects: 'x'.repeat(1201) }).success, false);

  const user = new Assessment({ ...valid, user: '507f1f77bcf86cd799439011' });
  assert.equal(user.projects, '');
  assert.equal(user.validateSync(), undefined);
});

test('readiness is an explainable match ratio over maintained requirements', () => {
  const requirements = getCareerRequirements('Data Analyst');
  assert.equal(calculateReadiness(['SQL', 'Python'], requirements), 25);
  assert.equal(calculateReadiness(['sql', 'PYTHON'], requirements), 25);
});

test('analysis fails explicitly when the external AI provider is not configured', async () => {
  const originalKey = process.env.LLM_API_KEY;
  delete process.env.LLM_API_KEY;
  try {
    await assert.rejects(generateCareerAnalysis({}, []), (error) => error.status === 503 && /LLM_API_KEY/.test(error.message));
  } finally {
    if (originalKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = originalKey;
  }
});
