# CareerPilot AI — Server

Backend API for CareerPilot AI built with Express, TypeScript, and MongoDB.

## Overview

This repo serves the CareerPilot AI backend, including:
- Job CRUD endpoints
- User authentication via Better Auth
- Interview chat and match APIs
- Cover letter generation
- File upload support

## Technology

- Node.js + TypeScript
- Express 5
- MongoDB
- Better Auth
- dotenv
- Vitest for tests

## Environment

Create a `.env` file with these variables:

```dotenv
MONGODB_URI=your-mongodb-connection-string
DB_NAME=careerpilot-db
AUTH_DB_NAME=better-auth-db
BETTER_AUTH_SECRET=your-better-auth-secret
BETTER_AUTH_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

The server runs on port `5000` by default.

## Build

```bash
npm run build
npm run start
```

## API Routes

- `GET /` — health check
- `POST /api/jobs` — create a job
- `GET /api/jobs` — list jobs
- `GET /api/jobs/:id` — job details
- `POST /api/auth/*` — authentication routes
- `POST /api/profile` — profile operations
- `POST /api/match` — match scoring
- `POST /api/interview-chat` — interview chat messages
- `POST /api/cover-letter` — cover letter generation
- `POST /api/upload` — file uploads

## Notes

- The app uses a lazy MongoDB connect pattern so it only opens a connection on the first request.
- CORS is configured with `CLIENT_URL`, `http://localhost:3000`, and deployed client URL.
- Better Auth uses `AUTH_DB_NAME` and `BETTER_AUTH_SECRET`.

## Key files

- `src/index.ts` — main server entrypoint
- `src/config/db.ts` — MongoDB connection helper
- `src/lib/auth.ts` — Better Auth configuration
- `src/routes` — Express route handlers

## Tests

```bash
npm run test
```

## Deployment

This project is ready for Vercel or any Node-compatible host.

## License

Use the repo license or add one if needed.
