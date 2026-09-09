import crypto from 'node:crypto';
import { seedUsers, seedCourses, seedGroups, seedAssignments, seedAcknowledgments } from '../src/data/mockData.js';

const STORE_KEY = 'student-mgmt:state:v1';
const JWT_SECRET = process.env.JWT_SECRET;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const json = (res, status, body) => res.status(status).json(body);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, key] = String(stored || '').split(':');
  if (!salt || !key) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash.length === key.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(key));
}
const id = (prefix) => `${prefix}-${crypto.randomBytes(5).toString('hex')}`;

async function redis(command, ...args) {
  if (!redisUrl || !redisToken) throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in Vercel Environment Variables.');
  const response = await fetch(`${redisUrl}/${command}/${args.map((x) => encodeURIComponent(x)).join('/')}`, { headers: { Authorization: `Bearer ${redisToken}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Storage request failed.');
  return data.result;
}

const base64url = (value) => Buffer.from(value).toString('base64url');
function signToken(user) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ sub: user.id, role: user.role, name: user.name, email: user.email, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}
function verifyToken(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Authentication required.');
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) throw new Error('Invalid session.');
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('Invalid session.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (claims.exp < Math.floor(Date.now() / 1000)) throw new Error('Session expired.');
  return claims;
}

const initialState = () => ({ users: seedUsers.map(({ id, name, email, password, role }) => ({ id, name, email, password: hashPassword(password), role })), courses: seedCourses, groups: seedGroups, assignments: seedAssignments, acknowledgments: seedAcknowledgments });

async function loadState() {
  const raw = await redis('get', STORE_KEY);
  if (!raw) {
    const fresh = initialState();
    await redis('set', STORE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  return JSON.parse(raw);
}
async function saveState(state) { await redis('set', STORE_KEY, JSON.stringify(state)); }
function publicState(state) { return { ...state, users: state.users.map(({ password, ...u }) => u) }; }

export default async function handler(req, res) {
  try {
    if (!JWT_SECRET) return json(res, 500, { error: 'JWT_SECRET is not configured. Add it to Vercel Environment Variables.' });
    const action = req.query.action || 'bootstrap';

    if (action === 'login') {
      const state = await loadState();
      const { email, password } = req.body || {};
      const user = state.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase() && verifyPassword(password || '', u.password));
      if (!user) return json(res, 401, { error: "Those credentials don't match our records." });
      const { password: _, ...safeUser } = user;
      return json(res, 200, { user: safeUser, token: signToken(safeUser) });
    }

    if (action === 'register') {
      const state = await loadState();
      const { name, email, password, role } = req.body || {};
      if (!name?.trim() || !email?.trim() || !password || !['student', 'professor'].includes(role)) return json(res, 400, { error: 'Name, email, password, and role are required.' });
      if (state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return json(res, 409, { error: 'An account with that email already exists.' });
      const user = { id: id('u'), name: name.trim(), email: email.trim().toLowerCase(), password: hashPassword(password), role };
      state.users.push(user);
      await saveState(state);
      const { password: _, ...safeUser } = user;
      return json(res, 201, { user: safeUser, token: signToken(safeUser) });
    }

    const auth = verifyToken(req);
    const state = await loadState();

    if (action === 'bootstrap') return json(res, 200, publicState(state));

    if (action === 'createCourse') {
      if (auth.role !== 'professor') return json(res, 403, { error: 'Only professors can create courses.' });
      const { code, name, semester } = req.body || {};
      if (!code?.trim() || !name?.trim() || !semester?.trim()) return json(res, 400, { error: 'Course code, name, and semester are required.' });
      const course = { id: id('c'), code: code.trim().toUpperCase(), name: name.trim(), semester: semester.trim(), professorId: auth.sub, studentIds: [] };
      state.courses.push(course); await saveState(state); return json(res, 201, { course });
    }

    if (action === 'enrollCourse') {
      if (auth.role !== 'student') return json(res, 403, { error: 'Only students can enroll.' });
      const course = state.courses.find((c) => c.id === req.body?.courseId);
      if (!course) return json(res, 404, { error: 'Course not found.' });
      if (!course.studentIds.includes(auth.sub)) course.studentIds.push(auth.sub);
      await saveState(state); return json(res, 200, { ok: true });
    }

    if (action === 'createAssignment') {
      if (auth.role !== 'professor') return json(res, 403, { error: 'Only professors can create assignments.' });
      const data = req.body || {}; const course = state.courses.find((c) => c.id === data.courseId);
      if (!course || course.professorId !== auth.sub) return json(res, 403, { error: 'You do not own this course.' });
      const assignment = { id: id('a'), ...data, deadline: new Date(data.deadline).toISOString() };
      state.assignments.push(assignment); await saveState(state); return json(res, 201, { assignment });
    }

    if (action === 'updateAssignment') {
      if (auth.role !== 'professor') return json(res, 403, { error: 'Only professors can update assignments.' });
      const { id: assignmentId, patch } = req.body || {}; const assignment = state.assignments.find((a) => a.id === assignmentId); const course = assignment && state.courses.find((c) => c.id === assignment.courseId);
      if (!assignment || !course || course.professorId !== auth.sub) return json(res, 403, { error: 'You do not own this assignment.' });
      Object.assign(assignment, patch, patch?.deadline ? { deadline: new Date(patch.deadline).toISOString() } : {}); await saveState(state); return json(res, 200, { ok: true });
    }

    if (action === 'deleteAssignment') {
      if (auth.role !== 'professor') return json(res, 403, { error: 'Only professors can delete assignments.' });
      const assignment = state.assignments.find((a) => a.id === req.body?.id); const course = assignment && state.courses.find((c) => c.id === assignment.courseId);
      if (!assignment || !course || course.professorId !== auth.sub) return json(res, 403, { error: 'You do not own this assignment.' });
      state.assignments = state.assignments.filter((a) => a.id !== assignment.id); state.acknowledgments = state.acknowledgments.filter((a) => a.assignmentId !== assignment.id); await saveState(state); return json(res, 200, { ok: true });
    }

    if (action === 'createGroup') {
      if (auth.role !== 'student') return json(res, 403, { error: 'Only students can create groups.' });
      const { courseId, name } = req.body || {}; const course = state.courses.find((c) => c.id === courseId);
      if (!course || !course.studentIds.includes(auth.sub)) return json(res, 403, { error: 'You are not enrolled in this course.' });
      const group = { id: id('g'), courseId, name: name.trim(), leaderId: auth.sub, memberIds: [auth.sub] }; state.groups.push(group); await saveState(state); return json(res, 201, { group });
    }

    if (action === 'joinGroup') {
      if (auth.role !== 'student') return json(res, 403, { error: 'Only students can join groups.' });
      const group = state.groups.find((g) => g.id === req.body?.groupId); const course = group && state.courses.find((c) => c.id === group.courseId);
      if (!group || !course?.studentIds.includes(auth.sub)) return json(res, 403, { error: 'You are not enrolled in this course.' });
      if (!group.memberIds.includes(auth.sub)) group.memberIds.push(auth.sub); await saveState(state); return json(res, 200, { ok: true });
    }

    if (action === 'acknowledge') {
      if (auth.role !== 'student') return json(res, 403, { error: 'Only students can acknowledge assignments.' });
      const { assignmentId, subjectType, subjectId } = req.body || {}; const assignment = state.assignments.find((a) => a.id === assignmentId); const course = assignment && state.courses.find((c) => c.id === assignment.courseId);
      if (!assignment || !course?.studentIds.includes(auth.sub)) return json(res, 404, { error: 'Assignment not found or access denied.' });
      if (assignment.submissionType === 'group') { const group = state.groups.find((g) => g.id === subjectId && g.courseId === assignment.courseId); if (!group || group.leaderId !== auth.sub) return json(res, 403, { error: 'Only the group leader can acknowledge a group assignment.' }); }
      else if (subjectId !== auth.sub) return json(res, 403, { error: 'You can only acknowledge your own submission.' });
      if (!state.acknowledgments.some((a) => a.assignmentId === assignmentId && a.subjectId === subjectId)) state.acknowledgments.push({ id: id('ack'), assignmentId, subjectType, subjectId, acknowledgedBy: auth.sub, timestamp: new Date().toISOString() });
      await saveState(state); return json(res, 201, { ok: true });
    }

    return json(res, 404, { error: 'Unknown action.' });
  } catch (error) {
    console.error(error); return json(res, 500, { error: error.message || 'Server error.' });
  }
}
