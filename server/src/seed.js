import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Profile from './models/Profile.js';

if (process.env.NODE_ENV === 'production' || process.env.SEED_DEV_DATA !== 'true') {
  throw new Error('Seeding is disabled. Set SEED_DEV_DATA=true outside production to continue.');
}
if (!process.env.SEED_USER_EMAIL || !process.env.SEED_USER_PASSWORD || process.env.SEED_USER_PASSWORD.length < 8) {
  throw new Error('Set SEED_USER_EMAIL and an SEED_USER_PASSWORD with at least 8 characters.');
}

try {
  await connectDatabase();
  const email = process.env.SEED_USER_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD, 12);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name: 'Development Learner', passwordHash } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await Profile.findOneAndUpdate(
    { user: user._id },
    { $set: { education: 'Undergraduate', experience: 'Some personal or academic projects', targetRegion: 'Remote', skills: ['Figma', 'User research'], goal: 'Build a design portfolio', weeklyHours: 5, projects: '' } },
    { new: true, upsert: true, runValidators: true }
  );
  console.info(`Development user seeded: ${email}`);
} finally {
  await mongoose.disconnect();
}
