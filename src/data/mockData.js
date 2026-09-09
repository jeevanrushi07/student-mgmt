// Mock data layer. Swap this file for real API calls when the backend is wired up —
// every consumer reads through DataContext, so nothing else has to change.

// The semester dashboards filter to. In a real backend this would come from
// an academic-calendar service; here it's just the term all seed courses use.
export const CURRENT_SEMESTER = "Fall 2026";

export const seedUsers = [
  { id: "u-prof-1", name: "Dr. Anita Rao", email: "anita.rao@college.edu", password: "password", role: "professor" },
  { id: "u-prof-2", name: "Dr. Marcus Webb", email: "marcus.webb@college.edu", password: "password", role: "professor" },

  { id: "u-stu-1", name: "Priya Sharma", email: "priya.sharma@college.edu", password: "password", role: "student" },
  { id: "u-stu-2", name: "Rohan Verma", email: "rohan.verma@college.edu", password: "password", role: "student" },
  { id: "u-stu-3", name: "Aditi Nair", email: "aditi.nair@college.edu", password: "password", role: "student" },
  { id: "u-stu-4", name: "Kabir Singh", email: "kabir.singh@college.edu", password: "password", role: "student" },
  { id: "u-stu-5", name: "Meera Iyer", email: "meera.iyer@college.edu", password: "password", role: "student" },
  { id: "u-stu-6", name: "Devansh Gupta", email: "devansh.gupta@college.edu", password: "password", role: "student" },
];

export const seedCourses = [
  {
    id: "c-101",
    code: "CS 301",
    name: "Data Structures & Algorithms",
    semester: "Fall 2026",
    professorId: "u-prof-1",
    studentIds: ["u-stu-1", "u-stu-2", "u-stu-3", "u-stu-4"],
  },
  {
    id: "c-102",
    code: "CS 412",
    name: "Distributed Systems",
    semester: "Fall 2026",
    professorId: "u-prof-1",
    studentIds: ["u-stu-2", "u-stu-3", "u-stu-5", "u-stu-6"], // Meera and Devansh are enrolled but ungrouped
  },
  {
    id: "c-201",
    code: "DS 210",
    name: "Applied Statistics",
    semester: "Fall 2026",
    professorId: "u-prof-2",
    studentIds: ["u-stu-1", "u-stu-4", "u-stu-5", "u-stu-6"],
  },
  {
    // Past-semester course, kept out of the "current semester" dashboard view
    // so the filter has something real to demonstrate.
    id: "c-099",
    code: "CS 210",
    name: "Intro to Algorithms",
    semester: "Spring 2026",
    professorId: "u-prof-1",
    studentIds: ["u-stu-1", "u-stu-2"],
  },
];

export const seedGroups = [
  {
    id: "g-1",
    courseId: "c-101",
    name: "Team Recursion",
    leaderId: "u-stu-1",
    memberIds: ["u-stu-1", "u-stu-2", "u-stu-4"],
  },
  {
    id: "g-2",
    courseId: "c-101",
    name: "Stack Overflowers",
    leaderId: "u-stu-3",
    memberIds: ["u-stu-3"], // u-stu-4 is ungrouped in this course
  },
  {
    id: "g-3",
    courseId: "c-102",
    name: "Consensus Crew",
    leaderId: "u-stu-2",
    memberIds: ["u-stu-2", "u-stu-3"],
  },
];

const inDays = (n, hour = 23, minute = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const daysAgo = (n, hour = 18, minute = 0) => inDays(-n, hour, minute);

export const seedAssignments = [
  {
    id: "a-1",
    courseId: "c-101",
    title: "Assignment 1 — Balanced Trees",
    description: "Implement an AVL tree with insert, delete, and rebalance operations. Submit a short write-up on rotation cases.",
    deadline: inDays(4, 23, 59),
    oneDriveLink: "https://onedrive.live.com/?assignment=avl-trees",
    submissionType: "individual",
  },
  {
    id: "a-2",
    courseId: "c-101",
    title: "Group Project — Pathfinding Visualizer",
    description: "In groups, build a small visualizer comparing BFS, DFS, and A*. One acknowledgment per group, submitted by the leader.",
    deadline: inDays(9, 23, 59),
    oneDriveLink: "https://onedrive.live.com/redir?assignment=pathfinding",
    submissionType: "group",
  },
  {
    id: "a-3",
    courseId: "c-101",
    title: "Assignment 0 — Complexity Warm-up",
    description: "Five short proofs on time and space complexity. Mostly a warm-up before the graded work begins.",
    deadline: daysAgo(6, 23, 59),
    oneDriveLink: "https://onedrive.live.com/redir?assignment=complexity-warmup",
    submissionType: "individual",
  },
  {
    id: "a-4",
    courseId: "c-102",
    title: "Group Project — Raft Consensus Demo",
    description: "Simulate leader election and log replication for a 5-node Raft cluster. Leader of record submits on behalf of the group.",
    deadline: daysAgo(1, 23, 59),
    oneDriveLink: "https://onedrive.live.com/redir?assignment=raft-demo",
    submissionType: "group",
  },
  {
    id: "a-5",
    courseId: "c-102",
    title: "Assignment 1 — CAP Theorem Case Study",
    description: "Pick a real distributed system and argue where it sits on the CAP triangle, with evidence from its docs.",
    deadline: inDays(2, 23, 59),
    oneDriveLink: "https://onedrive.live.com/redir?assignment=cap-case-study",
    submissionType: "individual",
  },
  {
    id: "a-6",
    courseId: "c-201",
    title: "Problem Set 3 — Hypothesis Testing",
    description: "Ten problems covering t-tests, chi-square tests, and p-value interpretation. Show your work.",
    deadline: inDays(6, 23, 59),
    oneDriveLink: "https://onedrive.live.com/redir?assignment=hypothesis-testing",
    submissionType: "individual",
  },
];

// { id, assignmentId, subjectType: 'student' | 'group', subjectId, acknowledgedBy, timestamp }
export const seedAcknowledgments = [
  {
    id: "ack-1",
    assignmentId: "a-3",
    subjectType: "student",
    subjectId: "u-stu-1",
    acknowledgedBy: "u-stu-1",
    timestamp: daysAgo(7, 14, 20),
  },
  {
    id: "ack-2",
    assignmentId: "a-3",
    subjectType: "student",
    subjectId: "u-stu-2",
    acknowledgedBy: "u-stu-2",
    timestamp: daysAgo(5, 9, 5),
  },
  {
    id: "ack-3",
    assignmentId: "a-1",
    subjectType: "student",
    subjectId: "u-stu-3",
    acknowledgedBy: "u-stu-3",
    timestamp: daysAgo(5, 21, 40),
  },
];
