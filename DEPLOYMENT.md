# Vercel deployment

This project contains both the React frontend and the backend API in the same Vercel project. No separate backend server is required.

## Required Vercel environment variables

Create an Upstash Redis database and add:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET` — use a long random string

The API stores the shared application state in Redis, so professor and student accounts see the same courses, assignments, groups, enrollments, and acknowledgments.

## Deploy

Upload this project to a Vercel project or connect the repository. Vercel detects `vercel.json`, builds the Vite app, and serves `api/index.js` as a serverless function.

Build command: `npm run build`
Output directory: `dist`

## Demo accounts

Professor: `anita.rao@college.edu` / `password`
Student: `priya.sharma@college.edu` / `password`

The first API request initializes the Redis data store from `src/data/mockData.js`.
