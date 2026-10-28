import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetCareer: { type: String, required: true, trim: true, maxlength: 100 },
  experience: { type: String, required: true, maxlength: 120 },
  education: { type: String, required: true, maxlength: 120 },
  skills: { type: [String], default: [] },
  goal: { type: String, required: true, maxlength: 200 },
  targetRegion: { type: String, required: true, maxlength: 120 },
  weeklyHours: { type: Number, required: true, min: 1, max: 40 },
  projects: { type: String, default: '', maxlength: 1200 }
}, { timestamps: true });

assessmentSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model('Assessment', assessmentSchema);
