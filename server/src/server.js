import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT || 5000);
try {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  await connectDatabase();
  app.listen(port, () => console.info(`TalentVerse API listening on port ${port}.`));
} catch (error) {
  console.error('Unable to start TalentVerse API:', error.message);
  process.exitCode = 1;
}
