# Ledger — Student, Group & Assignment Management (Frontend)

A React + Tailwind frontend for the Joineazy Round 2 Task 2 brief. The app demonstrates the complete professor and student UX using a local mock API/data layer, so it can be run without a backend while preserving the required role-based workflows.

## Requirements covered

### Professor flow
- Login/register with role-based redirect.
- Professor dashboard lists all courses they teach.
- Course → assignment management page.
- Create, edit, delete, and view assignments with title, description, deadline, OneDrive link, and Individual/Group submission type.
- Submission counts and progress bars.
- Open/Complete/Overdue status, search, and status filtering.

### Student flow
- Login/register with JWT-style authentication flow and form validation.
- Student dashboard shows current-semester enrollments.
- Course → assignment page.
- Assignment name, description, deadline date/time, OneDrive link, submission type, and acknowledgment status.
- Individual assignments: each student acknowledges their own submission and the timestamp is stored.
- Group assignments: only the identified group leader can acknowledge. The acknowledgment is stored against the group, so every member sees the same result. The member view identifies who submitted, including the leader's name and the group name.
- Late submissions are explicitly labeled **Acknowledged — Late** / **Late submission acknowledged** and retain the timestamp.
- Students without a group see the exact required prompt: **“You are not part of any group. Form or join one to submit this assignment.”** with a Form or join action.
- Group roster identifies the leader and every member.
- Progress bars, acknowledgment stamps, hover states, toasts, and reduced-motion support provide feedback and responsive UX.

## JWT demonstration

The frontend includes a JWT-shaped demo token because the brief permits a mock API for the working demo. The token contains: `sub`, `role`, `name`, `email`, `groupMemberships`, `iat`, and `exp`. `groupMemberships` identifies each group, course, and whether the user is the leader. The JWT panel in the navbar shows the decoded claims and token.

Example for Devansh Gupta, who is intentionally ungrouped:

```json
{
  "sub": "u-stu-6",
  "role": "student",
  "name": "Devansh Gupta",
  "email": "devansh.gupta@college.edu",
  "groupMemberships": [],
  "iat": 1787861177,
  "exp": 1787864777
}
```

For production, a backend should issue and verify a cryptographically signed JWT. The demo deliberately does not put a signing secret in the browser.

## Demo accounts

All seeded accounts use password `password`.

| Email | Role / state |
|---|---|
| `anita.rao@college.edu` | Professor |
| `marcus.webb@college.edu` | Professor |
| `priya.sharma@college.edu` | Student · Group Leader · Team Recursion |
| `rohan.verma@college.edu` | Student · Group Member · Team Recursion |
| `kabir.singh@college.edu` | Student · Group Member · Team Recursion |
| `aditi.nair@college.edu` | Student · Group Leader · Stack Overflowers |
| `meera.iyer@college.edu` | Student · Ungrouped |
| `devansh.gupta@college.edu` | Student · Ungrouped |

Meera and Devansh are enrolled in CS 412 but are not members of any group there. CS 412 also contains an overdue group assignment so Rohan can demonstrate a late group submission.

## Run locally

```bash
npm install
npm run dev
```

For production build verification:

```bash
npm run build
npm run preview
```

## Demo sequence

1. Sign in as Priya and open CS 301. Show the group roster and Team Recursion leader/member roles.
2. On the future group assignment, Priya sees the acknowledgment action. Click it.
3. Sign in as Rohan or Kabir. The same assignment shows **Acknowledged** and states that it was submitted by Priya (Group Leader) on behalf of Team Recursion.
4. Before acknowledgment on another group assignment, show Rohan/Kabir's **Member — cannot acknowledge** state.
5. Sign in as Meera or Devansh and open CS 412. Show the exact ungrouped prompt and Form or join action.
6. Sign in as Rohan and open the overdue CS 412 group assignment. Acknowledge it and show **Acknowledged — Late**. Sign in as Rohan's group member afterward to show the same late result and leader attribution.
7. Open **JWT demo** in the navbar and show `groupMemberships` for Priya/Rohan and `[]` for Meera/Devansh.

## Project structure

```text
src/
  context/         AuthContext, DataContext, ToastContext
  data/            Seed users, courses, groups, assignments, acknowledgments
  components/      Shared navigation, forms, cards, modal, progress, status stamp
  pages/           Login, Register, ProfessorDashboard, StudentDashboard,
                   ProfessorAssignments, StudentAssignments, CourseGate
  utils/           Deadline and timestamp formatting
```

## Deliverables

The repository is structured as a complete React frontend and the app can run against the mock API/data layer as permitted by the brief. A real GitHub repository URL, deployed Vercel/Netlify URL, and screenshots/GIFs must be added by the candidate when submitting the final PDF, because those depend on the candidate's accounts and deployment.
