import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()) || 'http://localhost:5173',
  exposedHeaders: ['Retry-After']
}));
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }), authRoutes);
app.use('/api/assessments', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }), assessmentRoutes);
app.use('/api/profiles', profileRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
