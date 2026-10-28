import mongoose from 'mongoose';

const careerAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, unique: true },
  suggestedPaths: { type: [mongoose.Schema.Types.Mixed], required: true },
  currentSkills: { type: [String], required: true },
  skillGaps: { type: [mongoose.Schema.Types.Mixed], required: true },
  nextSteps: { type: [String], required: true },
  projects: { type: [mongoose.Schema.Types.Mixed], required: true },
  roadmap: { type: [mongoose.Schema.Types.Mixed], required: true },
  readiness: {
    score: { type: Number, required: true, min: 0, max: 100 },
    explanation: { type: String, required: true }
  }
}, { timestamps: true });

careerAnalysisSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model('CareerAnalysis', careerAnalysisSchema);
