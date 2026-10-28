import Assessment from '../models/Assessment.js';
import CareerAnalysis from '../models/CareerAnalysis.js';
import Profile from '../models/Profile.js';
import RoadmapProgress from '../models/RoadmapProgress.js';
import { getCareerRequirements } from '../config/careerSkills.js';
import { assessmentSchema, progressSchema } from '../validators/schemas.js';
import { calculateReadiness, generateCareerAnalysis } from '../services/aiAnalysis.js';
import { serializeAssessmentHistory } from '../utils/assessmentHistory.js';

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

export async function listAssessments(req, res) {
  const assessments = await CareerAnalysis.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).populate('assessment').lean();
  res.json({ assessments: serializeAssessmentHistory(assessments) });
}

export async function getAssessment(req, res) {
  const analysis = await CareerAnalysis.findOne({ _id: req.params.id, user: req.user._id }).populate('assessment').lean();
  if (!analysis) return res.status(404).json({ message: 'Assessment was not found.' });
  res.json({ assessment: analysis.assessment, analysis });
}

export async function getProgress(req, res) {
  const analysis = await CareerAnalysis.findOne({ _id: req.params.id, user: req.user._id }).select('_id');
  if (!analysis) return res.status(404).json({ message: 'Roadmap was not found.' });
  const progress = await RoadmapProgress.findOne({ analysis: analysis._id, user: req.user._id }).lean();
  res.json({ progress });
}

export async function updateProgress(req, res) {
  const { completedTasks } = progressSchema.parse(req.body);
  const analysis = await CareerAnalysis.findOne({ _id: req.params.id, user: req.user._id }).select('_id');
  if (!analysis) return res.status(404).json({ message: 'Roadmap was not found.' });
  const progress = await RoadmapProgress.findOneAndUpdate({ analysis: analysis._id, user: req.user._id }, { $set: { completedTasks } }, { upsert: true, new: true, runValidators: true }).lean();
  res.json({ progress });
}
