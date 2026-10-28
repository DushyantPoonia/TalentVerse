import Assessment from '../models/Assessment.js';
import CareerAnalysis from '../models/CareerAnalysis.js';
import Profile from '../models/Profile.js';
import RoadmapProgress from '../models/RoadmapProgress.js';
import { getCareerRequirements } from '../config/careerSkills.js';
import { assessmentSchema, progressSchema } from '../validators/schemas.js';
import { calculateReadiness, generateCareerAnalysis } from '../services/aiAnalysis.js';
import { serializeAssessmentHistory } from '../utils/assessmentHistory.js';
import { normalizeCompletedTasks } from '../utils/roadmapProgress.js';

async function persistAssessment(input, generated, readinessScore, userId, requirements) {
  const assessment = await Assessment.create({ ...input, user: userId });
  const analysis = await CareerAnalysis.create({
    ...generated,
    user: userId,
    assessment: assessment._id,
    currentSkills: input.skills,
    readiness: {
      score: readinessScore,
      explanation: `This estimate compares ${input.skills.length} self-reported skill${input.skills.length === 1 ? '' : 's'} with ${requirements.length} maintained skills for ${input.targetCareer}. It is not a measure of employability or hiring likelihood.`
    }
  });
  await Profile.findOneAndUpdate({ user: userId }, { $set: { education: input.education, experience: input.experience, targetRegion: input.targetRegion, skills: input.skills, goal: input.goal, weeklyHours: input.weeklyHours, projects: input.projects } }, { upsert: true, new: true });
  await RoadmapProgress.create({ user: userId, analysis: analysis._id, completedTasks: [] });
  return { assessment, analysis };
}

export function createAssessmentHandler({
  generateAnalysis = generateCareerAnalysis,
  saveAssessment = persistAssessment
} = {}) {
  return async function createAssessment(req, res) {
    const input = assessmentSchema.parse(req.body);
    const requirements = getCareerRequirements(input.targetCareer);
    const generated = await generateAnalysis(input, requirements);
    const readinessScore = calculateReadiness(input.skills, requirements);
    const { assessment, analysis } = await saveAssessment(input, generated, readinessScore, req.user._id, requirements);
    res.status(201).json({ assessment, analysis });
  };
}

export const createAssessment = createAssessmentHandler();

export function createListAssessmentsHandler({
  findAssessments = (userId, offset, limit) => CareerAnalysis.find({ user: userId })
    .sort({ createdAt: -1, _id: -1 })
    .skip(offset)
    .limit(limit)
    .populate('assessment')
    .lean()
} = {}) {
  return async function listAssessments(req, res) {
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
      return res.status(400).json({ message: 'Assessment history offset is invalid.' });
    }
    const pageSize = 50;
    const results = await findAssessments(req.user._id, offset, pageSize + 1);
    const hasMore = results.length > pageSize;
    const assessments = results.slice(0, pageSize);
    res.json({
      assessments: serializeAssessmentHistory(assessments),
      nextOffset: hasMore ? offset + pageSize : null
    });
  };
}

export const listAssessments = createListAssessmentsHandler();

const validAnalysisId = (id) => /^[a-f\d]{24}$/i.test(id || '');

export function createRoadmapHandlers({
  findAssessment = (id, userId) => CareerAnalysis.findOne({ _id: id, user: userId }).populate('assessment').lean(),
  findRoadmap = (id, userId) => CareerAnalysis.findOne({ _id: id, user: userId }).select('_id roadmap').lean(),
  findProgress = (analysisId, userId) => RoadmapProgress.findOne({ analysis: analysisId, user: userId }).lean(),
  saveProgress = (analysisId, userId, completedTasks) => RoadmapProgress.findOneAndUpdate(
    { analysis: analysisId, user: userId },
    { $set: { completedTasks } },
    { upsert: true, new: true, runValidators: true }
  ).lean()
} = {}) {
  async function getAssessment(req, res) {
    if (!validAnalysisId(req.params.id)) return res.status(400).json({ message: 'Assessment ID is invalid.' });
    const analysis = await findAssessment(req.params.id, req.user._id);
    if (!analysis) return res.status(404).json({ message: 'Assessment was not found.' });
    res.json({ assessment: analysis.assessment, analysis });
  }

  async function getProgress(req, res) {
    if (!validAnalysisId(req.params.id)) return res.status(400).json({ message: 'Roadmap ID is invalid.' });
    const analysis = await findRoadmap(req.params.id, req.user._id);
    if (!analysis) return res.status(404).json({ message: 'Roadmap was not found.' });
    const progress = await findProgress(analysis._id, req.user._id);
    if (!progress) return res.json({ progress: null });
    const completedTasks = normalizeCompletedTasks(analysis.roadmap, progress.completedTasks) || [];
    res.json({ progress: { ...progress, completedTasks } });
  }

  async function updateProgress(req, res) {
    const { completedTasks } = progressSchema.parse(req.body);
    if (!validAnalysisId(req.params.id)) return res.status(400).json({ message: 'Roadmap ID is invalid.' });
    const analysis = await findRoadmap(req.params.id, req.user._id);
    if (!analysis) return res.status(404).json({ message: 'Roadmap was not found.' });
    const normalized = normalizeCompletedTasks(analysis.roadmap, completedTasks);
    if (!normalized) return res.status(400).json({ message: 'Completed tasks must belong to this roadmap.' });
    const progress = await saveProgress(analysis._id, req.user._id, normalized);
    res.json({ progress });
  }

  return { getAssessment, getProgress, updateProgress };
}

const roadmapHandlers = createRoadmapHandlers();
export const getAssessment = roadmapHandlers.getAssessment;
export const getProgress = roadmapHandlers.getProgress;
export const updateProgress = roadmapHandlers.updateProgress;
