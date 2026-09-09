# Student, Group & Assignment Management System

## Round 2 frontend enhancement

This project implements the required Professor and Student UX flows from the Joineazy Frontend Task 2 brief: role-based authentication, course dashboards, assignment management, student acknowledgments, group submission rules, progress visualization, and responsive React/Tailwind UI.

### Backend enhancement

The Professor and Student experiences now use a shared backend data layer instead of browser-only mock/localStorage data.

Architecture:

```text
React frontend
     |
     | JWT-authenticated REST API
     v
Node.js backend
     |
     v
Persistent JSON datastore
```

The backend exposes authenticated endpoints for:

- Login and registration with signed JWTs
- Course creation, editing, enrollment, and deletion
- Assignment creation, editing, and deletion
- Group creation and joining
- Individual and group acknowledgments with timestamps
- Shared course/assignment/group/acknowledgment data

Professor changes therefore become available to students through the same backend datastore, including when the professor and student use different browser sessions or devices connected to the same backend.

## Required workflow

1. Log in as a Professor.
2. Create a course and enroll one or more students.
3. Open the course and create an assignment.
4. Log in as an enrolled Student in another browser/session.
5. The new course and assignment are returned by the backend and appear in the Student experience.
6. For an individual assignment, the student acknowledges their own submission.
7. For a group assignment, only the group leader can acknowledge; the acknowledgment is shared with all group members.
8. Return to the Professor view to see updated submission/acknowledgment progress.

## Demo accounts

All seeded accounts use the password `password`.

Professor: `anita.rao@college.edu`

Student: `priya.sharma@college.edu`

## Local setup

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run server
```

The API runs on `http://localhost:4000`.

In a second terminal, start the frontend:

```bash
npm run dev
```

The Vite app uses `http://localhost:4000/api` by default. To use another backend URL, set:

```text
VITE_API_URL=https://your-backend.example.com/api
```

## Data persistence

The backend creates `server/data.json` on first startup. Passwords are stored using Node's `scrypt` password hashing. The frontend no longer uses localStorage as the source of truth for courses, assignments, groups, or acknowledgments.

## Task requirements covered

- Professor authentication and role-based redirect
- Professor course dashboard
- Professor course creation and management
- Professor assignment creation/editing/viewing
- Assignment deadline, OneDrive link, and submission type
- Submission counts and progress analytics
- Student authentication with JWT
- Student semester course dashboard
- Student assignment view
- Individual acknowledgment with timestamp
- Group-leader acknowledgment behavior
- Group membership and form/join flow
- Student progress visualization
- Toast feedback and responsive UI
- Shared Professor-to-Student and Student-to-Professor data flow through the backend

## Vercel deployment

This project now exposes the backend through a Vercel Function at `/api`. The frontend defaults to the same-origin `/api` path, so no `VITE_API_URL` variable is required on Vercel.

Set this Vercel environment variable:

- `JWT_SECRET` = a long random secret

Use Vite as the framework, `npm run build` as the build command, and `dist` as the output directory.

Note: the Vercel Function uses an in-memory data store so the demo works without an external database. Serverless instances can be recycled, so this deployment is suitable for a demo/task submission rather than production persistence. For production, replace the in-memory store with a managed Postgres/Redis database.
