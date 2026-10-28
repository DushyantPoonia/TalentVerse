import mongoose from 'mongoose';

const roadmapProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerAnalysis', required: true },
  completedTasks: { type: [String], default: [] }
}, { timestamps: true });

roadmapProgressSchema.index({ user: 1, analysis: 1 }, { unique: true });
export default mongoose.model('RoadmapProgress', roadmapProgressSchema);
