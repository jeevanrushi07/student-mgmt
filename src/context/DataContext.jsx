import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed.");
  }
  return res.status === 204 ? null : res.json();
}

export function DataProvider({ children }) {
  const { token } = useAuth();
  const [state, setState] = useState({ users: [], courses: [], groups: [], assignments: [], acknowledgments: [] });
  const [loading, setLoading] = useState(Boolean(token));

  const refresh = async () => {
    if (!token) {
      setState({ users: [], courses: [], groups: [], assignments: [], acknowledgments: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setState(await request("/data", { token }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh().catch(console.error); }, [token]);

  const api = useMemo(() => {
    const mutate = async (path, options) => {
      const result = await request(path, { token, ...options });
      await refresh();
      return result;
    };

    return {
      ...state,
      loading,
      refresh,
      students: state.users.filter((u) => u.role === "student"),
      findUserByEmail: (email) => state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
      coursesForProfessor: (profId) => state.courses.filter((c) => c.professorId === profId),
      coursesForStudent: (studentId) => state.courses.filter((c) => c.studentIds.includes(studentId)),
      assignmentsForCourse: (courseId) => state.assignments.filter((a) => a.courseId === courseId),
      groupsForCourse: (courseId) => state.groups.filter((g) => g.courseId === courseId),
      groupForStudentInCourse: (studentId, courseId) =>
        state.groups.find((g) => g.courseId === courseId && g.memberIds.includes(studentId)),
      acknowledgmentsForAssignment: (assignmentId) =>
        state.acknowledgments.filter((ack) => ack.assignmentId === assignmentId),
      groupMembers: (groupId) => {
        const group = state.groups.find((g) => g.id === groupId);
        return group ? group.memberIds.map((id) => state.users.find((u) => u.id === id)).filter(Boolean) : [];
      },

      createCourse: (data) => mutate("/courses", { method: "POST", body: data }),
      updateCourse: (id, data) => mutate(`/courses/${id}`, { method: "PUT", body: data }),
      deleteCourse: (id) => mutate(`/courses/${id}`, { method: "DELETE" }),

      createAssignment: (data) => mutate("/assignments", { method: "POST", body: data }),
      updateAssignment: (id, data) => mutate(`/assignments/${id}`, { method: "PUT", body: data }),
      deleteAssignment: (id) => mutate(`/assignments/${id}`, { method: "DELETE" }),

      createGroup: ({ courseId, name }) =>
        mutate("/groups", { method: "POST", body: { courseId, name } }),
      joinGroup: ({ groupId }) =>
        mutate(`/groups/${groupId}/join`, { method: "POST" }),

      acknowledge: ({ assignmentId, subjectType, subjectId }) =>
        mutate("/acknowledgments", {
          method: "POST",
          body: { assignmentId, subjectType, subjectId },
        }),
    };
  }, [state, token, loading]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
