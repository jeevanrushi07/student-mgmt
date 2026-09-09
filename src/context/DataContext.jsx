import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

async function request(action, token, body) {
  const response = await fetch(`/api/index.js?action=${encodeURIComponent(action)}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export function DataProvider({ children }) {
  const { token, user, logout } = useAuth();
  const [state, setState] = useState({ users: [], courses: [], groups: [], assignments: [], acknowledgments: [] });
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setState({ users: [], courses: [], groups: [], assignments: [], acknowledgments: [] });
      setLoading(false);
      return;
    }
    try {
      const next = await request("bootstrap", token);
      setState(next);
      setError(null);
    } catch (err) {
      setError(err.message);
      if (/session|authentication|invalid/i.test(err.message)) logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => { refresh(); }, [refresh]);

  // Keeps professor/student views in sync when the same deployment is open in multiple tabs/devices.
  useEffect(() => {
    if (!token) return undefined;
    const interval = setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [token, refresh]);

  const mutate = useCallback(async (action, body) => {
    const result = await request(action, token, body);
    await refresh();
    return result;
  }, [token, refresh]);

  const api = useMemo(() => ({
    ...state,
    loading,
    error,
    refresh,
    coursesForProfessor: (profId) => state.courses.filter((c) => c.professorId === profId),
    coursesForStudent: (studentId) => state.courses.filter((c) => c.studentIds.includes(studentId)),
    assignmentsForCourse: (courseId) => state.assignments.filter((a) => a.courseId === courseId),
    groupsForCourse: (courseId) => state.groups.filter((g) => g.courseId === courseId),
    groupForStudentInCourse: (studentId, courseId) => state.groups.find((g) => g.courseId === courseId && g.memberIds.includes(studentId)),
    acknowledgmentsForAssignment: (assignmentId) => state.acknowledgments.filter((ack) => ack.assignmentId === assignmentId),
    groupMembers: (groupId) => {
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) return [];
      return group.memberIds.map((id) => state.users.find((u) => u.id === id)).filter(Boolean);
    },
    createCourse: (course) => mutate("createCourse", course),
    deleteCourse: (courseId) => mutate("deleteCourse", { courseId }),
    enrollCourse: (courseId) => mutate("enrollCourse", { courseId }),
    createGroup: ({ courseId, name }) => mutate("createGroup", { courseId, name }).then((r) => r.group),
    joinGroup: ({ groupId }) => mutate("joinGroup", { groupId }),
    createAssignment: (assignment) => mutate("createAssignment", assignment).then((r) => r.assignment),
    updateAssignment: (id, patch) => mutate("updateAssignment", { id, patch }),
    deleteAssignment: (id) => mutate("deleteAssignment", { id }),
    acknowledge: (payload) => mutate("acknowledge", payload),
  }), [state, loading, error, refresh, mutate]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
