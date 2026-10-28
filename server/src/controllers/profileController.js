import Profile from '../models/Profile.js';
import { profileSchema } from '../validators/schemas.js';

export async function getProfile(req, res) {
  const profile = await Profile.findOne({ user: req.user._id }).lean();
  res.json({ profile });
}

export async function updateProfile(req, res) {
  const changes = profileSchema.parse(req.body);
  const profile = await Profile.findOneAndUpdate({ user: req.user._id }, { $set: changes }, { new: true, runValidators: true, upsert: true }).lean();
  res.json({ profile });
}
