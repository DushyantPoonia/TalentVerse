import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  education: { type: String, default: '', maxlength: 120 },
  experience: { type: String, default: '', maxlength: 120 },
  targetRegion: { type: String, default: '', maxlength: 120 },
  skills: { type: [String], default: [] },
  goal: { type: String, default: '', maxlength: 500 },
  weeklyHours: { type: Number, min: 1, max: 40, default: 5 },
  projects: { type: String, default: '', maxlength: 1200 }
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);
