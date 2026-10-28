import { z } from 'zod';

const requiredText = (max) => z.string().trim().min(1).max(max);
export const registerSchema = z.object({
  name: requiredText(80).min(2),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128)
});
export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128)
});
export const assessmentSchema = z.object({
  targetCareer: requiredText(100),
  experience: requiredText(120),
  education: requiredText(120),
  skills: z.array(requiredText(80)).min(1).max(40),
  goal: requiredText(200),
  targetRegion: requiredText(120),
  weeklyHours: z.number().int().min(1).max(40),
  projects: z.string().trim().max(1200).default('')
});
export const profileSchema = z.object({
  education: z.string().trim().max(120).optional(),
  experience: z.string().trim().max(120).optional(),
  targetRegion: z.string().trim().max(120).optional(),
  skills: z.array(requiredText(80)).max(40).optional(),
  goal: z.string().trim().max(500).optional(),
  weeklyHours: z.number().int().min(1).max(40).optional(),
  projects: z.string().trim().max(1200).optional()
}).strict();
export const progressSchema = z.object({
  completedTasks: z.array(requiredText(200)).max(100)
});

const gapSchema = z.object({ skill: requiredText(80), priority: z.enum(['high', 'medium', 'low']), reason: requiredText(500) });
const weekSchema = z.object({ week: z.number().int().min(1).max(52), theme: requiredText(120), tasks: z.array(requiredText(300)).min(1).max(6), estimatedHours: z.number().min(1).max(80) });
export const analysisSchema = z.object({
  suggestedPaths: z.array(z.object({ title: requiredText(100), explanation: requiredText(500) })).min(1).max(3),
  currentSkills: z.array(requiredText(80)).max(40),
  skillGaps: z.array(gapSchema).min(1).max(20),
  nextSteps: z.array(requiredText(300)).min(1).max(8),
  projects: z.array(z.object({ title: requiredText(120), description: requiredText(500), skills: z.array(requiredText(80)).min(1).max(12) })).min(1).max(5),
  roadmap: z.array(weekSchema).min(1).max(12),
  readiness: z.object({ explanation: requiredText(500) })
});
