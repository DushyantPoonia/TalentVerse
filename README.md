# TalentVerse

TalentVerse is a career-intelligence application for students and early-career professionals. It pairs an original responsive React experience with an Express API, MongoDB persistence, authenticated profiles, and a validated server-side LLM analysis flow.

## Requirements

- Node.js 20+
- MongoDB Atlas database (or a local MongoDB instance)
- An OpenAI-compatible chat-completions API key for generating assessments

## Local development

1. Install frontend dependencies with `npm install`.
2. Install API dependencies with `npm --prefix server install`.
3. Configure the root `.env` and `server/.env` files as shown in [Environment](#environment). Vite reads the root file; the API loads `server/.env` through `dotenv`.
4. In one terminal, start the API with `npm run server`. In another terminal, start the frontend with `npm run dev`, then open the URL Vite prints (normally `http://localhost:5173`).

The assessment form can be completed without an account, but analysis requires sign-in so the validated result can be saved to the user's account. If the AI provider is not configured or fails, the API reports an error and does not create a fake analysis.

For an explicitly enabled development-only account seed, set `SEED_DEV_DATA=true`, `SEED_USER_EMAIL`, and `SEED_USER_PASSWORD` in `server/.env`, then run `npm --prefix server run seed`. The script refuses to run in production.

## Environment

Configure the existing files at the project root (`.env`) and in the backend directory (`server/.env`). These are local configuration files, not templates; replace placeholder values with your own settings. The frontend `VITE_API_URL` points to the API, while provider credentials and other server secrets belong only in `server/.env`.

Root `.env` (frontend):

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_CONTACT_EMAIL=contact@example.invalid
```

`server/.env` (backend):

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<a long random secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
LLM_API_KEY=<your provider API key>
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=<your chat-completions model>
```

`MONGODB_URI` and `JWT_SECRET` are needed for the API to connect to MongoDB and issue tokens. `LLM_API_KEY` is needed for AI-generated analyses. `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, `LLM_BASE_URL`, and `LLM_MODEL` have defaults or can be adjusted as needed. The displayed values are examples or placeholders only; do not put real secrets in documentation.

The root `.gitignore` excludes `.env`, `.env.*`, `server/.env`, and `server/.env.*` (while allowing `.env.example` files). Keep both `.env` files out of commits and never expose backend secrets through `VITE_` variables.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/profiles`, `PATCH /api/profiles`
- `POST /api/assessments`, `GET /api/assessments`, `GET /api/assessments/:id`
- `GET /api/assessments/:id/progress`, `PUT /api/assessments/:id/progress`
- `GET /api/health`

Private endpoints require `Authorization: Bearer <token>`. Assessment records, analyses, profiles, and roadmap progress are scoped to the authenticated user. Career skill requirements are maintained in `server/src/config/careerSkills.js`.

The readiness estimate is the percentage of the selected career's maintained skill list matched by the user's self-reported skills. It is explicitly not an employability score or hiring prediction. LLM output is validated before any assessment or analysis is persisted.

## Tests and build

- `npm test` runs backend schema and readiness tests.
- `npm run build` creates the Vite production build in `dist/`.

## Deployment

1. Create a MongoDB Atlas database and configure network access and a least-privilege database user.
2. Deploy `server/` to Render with the API environment variables above and a start command of `npm start`. Set `CLIENT_ORIGIN` to the deployed frontend origin.
3. Deploy the project root to Vercel. Set `VITE_API_URL` to the Render API URL ending in `/api`; set `VITE_CONTACT_EMAIL` if desired.
4. Keep `JWT_SECRET`, `MONGODB_URI`, and `LLM_API_KEY` only in Render's environment settings. Never use a `VITE_` prefix for secrets.
